import assert from 'node:assert/strict';

const KEY = 'mentation.sessions.v1';
const NOW = new Date('2026-11-17T12:00:00Z');
const button = (page, name) => page.getByRole('button', { name, exact: true });
const records = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]'), KEY);
const count = async (page, value) => {
  const badge = page.getByTestId('reset-week-count');
  await badge.waitFor();
  assert.equal((await badge.innerText()).trim(), `${value} reset${value === 1 ? '' : 's'} this week`);
};

// Good Map remains a curated ResetPlayer pathway. Its standalone Library route
// is a different experience; seed only the supported prebuilt routing entry,
// never a done phase or fabricated completion. Every save below uses real UI.
async function openReset(page, base, sessions = []) {
  await page.goto(`${base}/library`);
  await page.evaluate(({ key, sessions }) => {
    localStorage.setItem(key, JSON.stringify(sessions));
    localStorage.setItem('haven.a11y.v2', JSON.stringify({ reducedMotion: true, ambientSoundscape: false }));
    history.replaceState({ ...history.state, usr: {
      prebuilt: true, pathway: ['goodMap'], direction: 'lift', intensity: 5,
      distress: 2, timeMin: 10, audio: 'no', noAudio: true,
      whereFelt: 'both', reset_phase: 'pathway',
    } }, '', '/reset?step=0');
  }, { key: KEY, sessions });
  await page.reload();
  await button(page, 'Begin').click();
  await button(page, 'Finish here').waitFor();
}
async function reflection(page) {
  await button(page, 'Finish here').click();
  await button(page, 'Skip check-in').click();
  await button(page, 'Finish for now').click();
  await page.getByRole('heading', { name: 'Would you use this reset again?', exact: true }).waitFor();
}
async function finish(page) {
  await button(page, 'Done').click();
  await button(page, 'Do it again').waitFor();
}
async function restoreStorage(page, monitorWrites = false) {
  await page.evaluate(monitor => window.__restoreResetWeekStorage?.(monitor), monitorWrites);
}
async function failStorage(page, mode) {
  await page.evaluate(({ key, mode }) => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    let verify = false, afterWriteReads = null;
    window.__resetWeekWriteCount = 0;
    window.__readResetWeekRecords = () => JSON.parse(get.call(localStorage, key) || '[]');
    window.__restoreResetWeekStorage = (monitor = false) => {
      Storage.prototype.getItem = get;
      Storage.prototype.setItem = monitor ? function (name, value) {
        if (name === key) window.__resetWeekWriteCount += 1;
        return set.call(this, name, value);
      } : set;
    };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) window.__resetWeekWriteCount += 1;
      if (name === key && mode === 'write') throw Error('Synthetic session write failure');
      const result = set.call(this, name, value);
      if (name === key && mode === 'verify') verify = true;
      if (name === key && mode === 'after-save') afterWriteReads = 0;
      return result;
    };
    Storage.prototype.getItem = function (name) {
      // writeVerified gets the first post-write read. Only subsequent
      // listAll reads fail, so this is a confirmed save, not an uncertain one.
      if (name === key && mode === 'after-save' && afterWriteReads !== null && afterWriteReads++ >= 1) {
        throw Error('Synthetic post-verification history failure');
      }
      if (name === key && (mode === 'read' || verify)) {
        verify = false;
        throw Error('Synthetic session read failure');
      }
      return get.call(this, name);
    };
  }, { key: KEY, mode });
}

export async function checkResetWeek(page, base) {
  await page.clock.setFixedTime(NOW);
  await openReset(page, base);
  await reflection(page);
  await finish(page);
  await count(page, 1);
  const first = await records(page);
  assert.equal(first.length, 1);
  assert.deepEqual(first[0].completed_pathway, [], 'Weekly resets count saved sessions, not only completed practices');

  // Real browser Back AND Forward retain the same completed session. Back to
  // reflection and pressing Done again must not create another history record.
  await page.goBack();
  await button(page, 'Done').waitFor();
  await button(page, 'Done').click();
  assert.deepEqual(await records(page), first, 'Repeated completion must not save again');
  await page.goForward();
  await button(page, 'Do it again').waitFor();
  await count(page, 1);
  assert.deepEqual(await records(page), first, 'Forward must not replay completion');

  // No goto/reload between these saves: restart exercises the same mounted
  // ResetFlow and beginGuided must release its previous saved-session guard.
  await button(page, 'Do it again').click();
  await page.getByRole('heading', { name: 'How is your mood right now?', exact: true }).waitFor();
  await button(page, '5').click();
  await button(page, 'Continue').click();
  await page.getByRole('combobox', { name: 'Current distress', exact: true }).selectOption('2');
  await button(page, 'Start The Good Map').click();
  await reflection(page);
  await finish(page);
  await count(page, 2);
  const second = await records(page);
  assert.equal(second.length, 2);
  assert.equal(new Set(second.map(item => item.id)).size, 2, 'Restart must use a distinct session ID');

  const many = Array.from({ length: 61 }, (_, index) => ({
    id: `synthetic-week-${index}`, created_date: new Date(NOW.getTime() - index * 60000).toISOString(),
    pathway: ['goodMap'], completed_pathway: [], attempts: [],
  }));
  many.push({ id: 'synthetic-old', created_date: '2026-11-01T12:00:00Z', pathway: ['goodMap'] });
  await openReset(page, base, many);
  await reflection(page); await finish(page); await count(page, 62);
  assert.equal((await records(page)).length, 63, 'Old records must remain stored but outside the weekly count');

  for (const mode of ['write', 'verify']) {
    await openReset(page, base);
    await reflection(page);
    await failStorage(page, mode);
    await button(page, 'Done').click();
    await page.getByRole('alert').filter({ hasText: 'We could not confirm that its history record was saved' }).waitFor();
    assert.equal(await page.getByTestId('reset-week-count').count(), 0, 'Unconfirmed save must not show completion count');
    await restoreStorage(page);
    const uncertain = await records(page);
    assert.equal(uncertain.length, mode === 'verify' ? 1 : 0, 'Verification failure differs from a rejected write');
    await button(page, 'Retry saving history').click();
    await count(page, 1);
    const saved = await records(page);
    assert.equal(saved.length, 1, 'Retry must not double-count');
    if (uncertain.length) assert.equal(saved[0].id, uncertain[0].id, 'Retry must verify/upsert the same uncertain session');
  }

  await openReset(page, base);
  await reflection(page);
  await failStorage(page, 'after-save');
  await button(page, 'Done').click();
  await page.getByRole('status').filter({ hasText: 'Your reset was saved, but the weekly count couldn’t be read.' }).waitFor();
  assert.equal(await button(page, 'Retry saving history').count(), 0, 'Confirmed save plus count-read failure must not ask to save again');
  assert.equal(await page.getByTestId('reset-week-count').count(), 0);
  const confirmed = await page.evaluate(() => window.__readResetWeekRecords());
  assert.equal(confirmed.length, 1, 'Write verification succeeded before history reads failed');
  assert.equal(await page.evaluate(() => window.__resetWeekWriteCount), 1);
  await restoreStorage(page, true);
  await button(page, 'Try weekly count again').click();
  await count(page, 1);
  assert.deepEqual(await records(page), confirmed);
  assert.equal(await page.evaluate(() => window.__resetWeekWriteCount), 1, 'Weekly-count retry must perform zero additional writes');
  await restoreStorage(page);

  // A later read failure must hide a previously known number, not replace it
  // with zero or leave a stale success badge. Retry is read-only.
  await failStorage(page, 'read');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('mentation:sessions-changed')));
  await page.getByRole('status').filter({ hasText: 'Your reset was saved, but the weekly count couldn’t be read.' }).waitFor();
  assert.equal(await page.getByTestId('reset-week-count').count(), 0);
  await page.waitForTimeout(4700);
  assert(await button(page, 'Try weekly count again').isVisible(), 'A count error must not auto-return Home before recovery');
  await restoreStorage(page);
  await button(page, 'Try weekly count again').click();
  await count(page, 1);
  assert.equal((await records(page)).length, 1, 'Count retry must never create another session');
  await page.goto(`${base}/library`);
}
