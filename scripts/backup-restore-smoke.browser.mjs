import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';

const SESSION = 'mentation.sessions.v1';
const COPIES = 'mentation.restore-copies.v1';
const PLAN = 'mentication.foundations.draft.v2';
const OWNERSHIP = 'mentation.web-checkins.v1';
const button = (page, name) => page.getByRole('button', { name, exact: true });
const stage = value => console.log(`Backup restore: ${value}`);
const currentSession = { id: 'shared', created_date: '2026-11-10T12:00:00Z', updated_date: '2026-11-17T12:00:00Z', direction: 'calm', followup: { answer: 'synthetic newer follow-up' } };
const incomingSession = { id: 'shared', created_date: '2026-11-10T12:00:00Z', updated_date: '2026-11-11T12:00:00Z', direction: 'calm', followup: { answer: 'synthetic older follow-up' } };
const current = {
  [SESSION]: JSON.stringify([currentSession, { id: 'device-only', created_date: '2026-11-15T12:00:00Z' }]),
  daybook: JSON.stringify([{ id: 'device-note', text: 'Synthetic newer note' }]),
  [PLAN]: JSON.stringify({ version: 2, state: { responses: { overall: 4 } } }),
  [OWNERSHIP]: JSON.stringify({ token: 'synthetic-device-owner', pendingCancel: true }),
  'mentation.reminders.v1': JSON.stringify({ enabled: false, hour: 9, minute: 10 }),
};
const backup = {
  format: 'mentication-backup', version: 1, createdAt: '2026-11-11T12:00:00Z', data: {
    [SESSION]: JSON.stringify([incomingSession, { id: 'backup-only', created_date: '2026-11-08T12:00:00Z' }]),
    daybook: JSON.stringify([{ id: 'backup-note', text: 'Synthetic older note' }]),
    [PLAN]: JSON.stringify({ version: 2, state: { responses: { overall: 1 } } }),
    'mentation.synthetic-new-group': 'synthetic missing group',
    [OWNERSHIP]: JSON.stringify({ token: 'synthetic-backup-owner', pendingCancel: true }),
    'mentation.reminders.v1': JSON.stringify({ enabled: true, hour: 3, minute: 0 }),
    [COPIES]: JSON.stringify({ version: 1, copies: [] }),
  },
};

async function read(page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), [SESSION, 'daybook', PLAN, OWNERSHIP, 'mentation.reminders.v1', COPIES, 'mentation.synthetic-new-group']);
}
async function setup(page, base) {
  await page.goto(`${base}/settings`);
  await page.evaluate(data => {
    // This dedicated browser test context contains only synthetic records.
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('haven_onboarded', '1');
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
  }, current);
  await page.reload();
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
}
async function pick(page, value = backup, name = 'synthetic-backup.json') {
  await page.locator('input[type="file"]').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
  await page.getByRole('heading', { name: 'Review this restore', exact: true }).waitFor();
}
async function preferBackup(page) {
  await page.getByRole('radio', { name: /^Use the backup’s versions/ }).check();
}
async function restore(page) {
  await Promise.all([page.waitForEvent('load'), button(page, 'Restore selected versions').click()]);
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  await page.getByRole('status').filter({ hasText: /Restore saved on this device|Nothing needed changing/ }).waitFor();
}
async function download(page, name) {
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }));
  const [file] = await Promise.all([page.waitForEvent('download'), button(page, name).click()]);
  const data = JSON.parse(await readFile(await file.path(), 'utf8'));
  await page.getByRole('status').filter({ hasText: 'Backup download requested. Check your downloads or Files before relying on it.' }).waitFor();
  return data;
}
async function restoreFault(page, mode) {
  await page.evaluate(({ mode, sessionKey, oldSessions }) => {
    const set = Storage.prototype.setItem, get = Storage.prototype.getItem;
    let triggered = false, failRead = false;
    window.__restoreBackupStorage = () => { Storage.prototype.setItem = set; Storage.prototype.getItem = get; };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'daybook' && !triggered) {
        triggered = true;
        if (mode === 'verify') { set.call(this, key, value); failRead = true; return; }
        throw Error('Synthetic restore quota failure');
      }
      if (mode === 'rollback' && triggered && key === sessionKey && value === oldSessions) throw Error('Synthetic rollback failure');
      return set.call(this, key, value);
    };
    Storage.prototype.getItem = function (key) {
      if (key === 'daybook' && failRead) { failRead = false; throw Error('Synthetic restore verification failure'); }
      return get.call(this, key);
    };
  }, { mode, sessionKey: SESSION, oldSessions: current[SESSION] });
}

export async function checkBackupRestore(page, base) {
  await page.context().route('**/v1/plan**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  stage('safe-default same-ID and whole-group conflicts, real reload and repeated import');
  await setup(page, base);
  await pick(page);
  assert(await page.getByRole('radio', { name: /^Keep this device’s versions/ }).isChecked());
  assert.match(await page.getByTestId('restore-preview-summary').innerText(), /1 backup-only practices and 1 missing data groups.*1 matching practice records and 2 existing data groups/);
  await restore(page);
  let saved = await read(page);
  assert.deepEqual(JSON.parse(saved[SESSION]).find(value => value.id === 'shared'), currentSession);
  assert.equal(JSON.parse(saved[SESSION]).length, 3);
  assert.equal(saved.daybook, current.daybook); assert.equal(saved[PLAN], current[PLAN]);
  assert.equal(saved[OWNERSHIP], current[OWNERSHIP]);
  assert.equal(saved['mentation.reminders.v1'], current['mentation.reminders.v1']);
  assert.equal(saved[COPIES], null);
  await pick(page); await restore(page);
  assert.deepEqual(await read(page), saved, 'Repeated keep-current import must be idempotent');

  stage('explicit backup versions preserve exportable before-restore values and ownership');
  await setup(page, base); await pick(page); await preferBackup(page);
  await restore(page);
  saved = await read(page);
  assert.deepEqual(JSON.parse(saved[SESSION]).find(value => value.id === 'shared'), incomingSession);
  assert.equal(JSON.parse(saved[SESSION]).length, 3);
  assert.equal(saved.daybook, backup.data.daybook); assert.equal(saved[PLAN], backup.data[PLAN]);
  assert.equal(saved[OWNERSHIP], current[OWNERSHIP]);
  assert.equal(saved['mentation.reminders.v1'], current['mentation.reminders.v1']);
  const copies = JSON.parse(saved[COPIES]).copies;
  assert.equal(copies.length, 1);
  assert.equal(copies[0].data[SESSION], current[SESSION]);
  assert.equal(copies[0].data.daybook, current.daybook);
  const exportedCopy = await download(page, 'Save copy 1');
  assert.deepEqual(exportedCopy, copies[0]);
  for (const key of [OWNERSHIP, 'mentation.reminders.v1', COPIES]) assert.equal(exportedCopy.data[key], undefined);
  const exported = await download(page, 'Save a backup');
  for (const key of [OWNERSHIP, 'mentation.reminders.v1', COPIES]) assert.equal(exported.data[key], undefined);
  await pick(page, exportedCopy); await preferBackup(page); await restore(page);
  saved = await read(page);
  assert.deepEqual(JSON.parse(saved[SESSION]).find(value => value.id === 'shared'), currentSession);
  assert.equal(JSON.parse(saved[SESSION]).length, 3, 'Before-restore copy is not an Undo that deletes new practices');
  assert.equal(saved.daybook, current.daybook);
  assert.equal(JSON.parse(saved[COPIES]).copies.length, 2, 'Restoring an earlier version must retain the previous copy too');
  stage('before-restore copy removal is explicit, cancellable and verified');
  const savedCopies = saved[COPIES];
  page.once('dialog', dialog => dialog.dismiss());
  await button(page, 'Remove copy 1').click();
  assert.equal((await read(page))[COPIES], savedCopies, 'Cancelling removal must retain the copy');
  page.once('dialog', dialog => { assert.match(dialog.message(), /Permanently remove.*Keep an exported copy first/); return dialog.accept(); });
  await button(page, 'Remove copy 1').click();
  await page.getByRole('status').filter({ hasText: 'Before-restore copy removed from this device.' }).waitFor();
  const remainingCopies = JSON.parse((await read(page))[COPIES]).copies;
  assert.equal(remainingCopies.length, 1);
  assert.deepEqual(remainingCopies[0], JSON.parse(savedCopies).copies[1]);
  const removalTab = await page.context().newPage();
  await removalTab.goto(`${base}/settings`);
  await removalTab.evaluate(key => localStorage.removeItem(key), COPIES);
  await removalTab.close();
  await button(page, 'Save copy 1').waitFor({ state: 'hidden' });
  assert.equal(await button(page, 'Remove copy 1').count(), 0, 'Cross-tab removal must not leave stale recovery actions');


  stage('a second tab changes reviewed data: require a new review, not overwrite');
  await setup(page, base); await pick(page); await preferBackup(page);
  const other = await page.context().newPage();
  await other.goto(`${base}/settings`);
  const newest = { ...currentSession, followup: { answer: 'Synthetic change after preview' } };
  await other.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SESSION, value: [newest] });
  await other.close();
  await button(page, 'Restore selected versions').click();
  await page.getByRole('status').filter({ hasText: 'Data changed since this preview.' }).waitFor();
  assert(await page.getByRole('radio', { name: /^Keep this device’s versions/ }).isChecked());
  assert.deepEqual(JSON.parse((await read(page))[SESSION]), [newest]);
  assert.equal((await read(page))[COPIES], null);
  await button(page, 'Cancel restore').click();
  assert.deepEqual(JSON.parse((await read(page))[SESSION]), [newest]);

  for (const mode of ['write', 'verify']) {
    stage(`${mode} failure, verified rollback and safe retry`);
    await setup(page, base); await pick(page); await preferBackup(page); await restoreFault(page, mode);
    await button(page, 'Restore selected versions').click();
    await page.getByRole('status').filter({ hasText: 'Your previous data has been kept.' }).waitFor();
    saved = await read(page);
    for (const key of [SESSION, 'daybook', PLAN, OWNERSHIP]) assert.equal(saved[key], current[key]);
    assert.equal(JSON.parse(saved[COPIES]).copies[0].data[SESSION], current[SESSION]);
    await page.evaluate(() => window.__restoreBackupStorage());
    await restore(page);
    saved = await read(page);
    assert.equal(JSON.parse(saved[SESSION]).length, 3);
    assert.equal(JSON.parse(saved[COPIES]).copies.length, 1, 'Retry must not create duplicate before-restore copies');
  }

  stage('incomplete rollback requires real reload and file reselection before retry');
  await setup(page, base); await pick(page); await preferBackup(page); await restoreFault(page, 'rollback');
  await button(page, 'Restore selected versions').click();
  await page.getByRole('status').filter({ hasText: 'Not every change could be confirmed or rolled back' }).waitFor();
  saved = await read(page);
  assert.equal(JSON.parse(saved[COPIES]).copies[0].data[SESSION], current[SESSION]);
  await page.evaluate(() => window.__restoreBackupStorage());
  assert.equal(await button(page, 'Review again').count(), 0);
  assert.equal(await button(page, 'Restore selected versions').count(), 0);
  assert.equal(await button(page, 'Cancel restore').count(), 0);
  assert(await page.locator('input[type="file"]').isDisabled());
  await page.getByRole('alert').filter({ hasText: 'Keep your original backup file' }).waitFor();
  await Promise.all([page.waitForEvent('load'), button(page, 'Reload app').click()]);
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  assert.equal(await button(page, 'Restore selected versions').count(), 0, 'Reload must not reuse the unreviewed file');
  await pick(page);
  assert(await page.getByRole('radio', { name: /^Keep this device’s versions/ }).isChecked());
  await restore(page);
  assert.equal(JSON.parse((await read(page))[SESSION]).length, 3);

  stage('an unavailable receipt never turns verified restore into a failure');
  await setup(page, base); await pick(page);
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === sessionStorage && key === 'mentation.backup-restore.receipt.v1') throw Error('Synthetic receipt unavailable');
      return set.call(this, key, value);
    };
  });
  await Promise.all([page.waitForEvent('load'), button(page, 'Restore selected versions').click()]);
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  assert.equal(JSON.parse((await read(page))[SESSION]).length, 3);
  assert.equal(await page.getByRole('status').filter({ hasText: /could not be saved|did not finish/ }).count(), 0);

  stage('malformed input and cancellation never mutate history');
  await setup(page, base);
  const before = await read(page);
  await page.locator('input[type="file"]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('not JSON') });
  await page.getByRole('status').filter({ hasText: "That file isn't a Mentication backup." }).waitFor();
  assert.deepEqual(await read(page), before);
  await page.evaluate(() => {
    const text = File.prototype.text;
    File.prototype.text = function () {
      if (this.name !== 'delayed.json') return text.call(this);
      return new Promise(resolve => { window.__releaseBackupRead = async () => resolve(await text.call(this)); });
    };
    window.__restoreBackupFileText = () => { File.prototype.text = text; };
  });
  await page.locator('input[type="file"]').setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await button(page, 'Cancel reading').click();
  await page.evaluate(async () => { await window.__releaseBackupRead(); window.__restoreBackupFileText(); });
  assert.equal(await page.getByRole('heading', { name: 'Review this restore', exact: true }).count(), 0);
  assert.deepEqual(await read(page), before);

  stage('share cancellation and fulfilled handoff are not claimed as saved files');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Synthetic cancelled share', 'AbortError'); } });
  });
  await button(page, 'Save a backup').click();
  await page.getByRole('status').filter({ hasText: 'Sharing was cancelled. No backup save was confirmed.' }).waitFor();
  await page.evaluate(() => {
    window.__backupShareCount = 0;
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => {
      window.__backupShareCount += 1;
      return new Promise(resolve => { window.__finishBackupShare = resolve; });
    } });
  });
  await button(page, 'Save a backup').dblclick();
  assert.equal(await page.evaluate(() => window.__backupShareCount), 1);
  assert.equal(await button(page, 'Save a backup').isEnabled(), false);
  await page.evaluate(() => window.__finishBackupShare());
  await page.getByRole('status').filter({ hasText: 'Backup handed to the share destination. Check that you kept the file somewhere safe.' }).waitFor();
  assert.deepEqual(await read(page), before);
  assert.equal(await page.locator('html').evaluate(element => element.scrollWidth > innerWidth + 1), false, 'Backup controls must fit the mobile viewport');
  await page.goto(`${base}/library`);
  stage('all conflict, recovery, reload and handoff checks passed');
}
