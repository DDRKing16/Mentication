// Isolated component regression. Vite must be running; no host registration mutation.
// Overrides: PLAYWRIGHT_MODULE, CHROME_PATH, TARA_PREVIEW_URL, TARA_EVIDENCE_DIR.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const url = process.env.TARA_PREVIEW_URL || 'http://127.0.0.1:5174/design/tara-tactician/preview.html';
const evidence = process.env.TARA_EVIDENCE_DIR || '/workspace/tara-practice-regression';
mkdirSync(evidence, { recursive: true });
const results = []; const errors = []; const key = 'mentation.tara-tactician.v1';
const click = (page, name) => page.getByRole('button', { name, exact: true }).click();
async function pageFor(width = 390, init) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  if (init) await context.addInitScript(init);
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(url); await page.getByRole('heading', { level: 1 }).waitFor();
  return { page, context };
}
async function heading(page, text) { await page.getByRole('heading', { level: 1, name: text, exact: true }).waitFor(); }
async function draft(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key))?.draft, key); }
async function edit(page, button, label, value) {
  await click(page, button); await page.getByRole('dialog').waitFor();
  await page.getByRole('textbox', { name: label, exact: true }).fill(value); await click(page, 'Keep this wording');
}
async function prepare(page) {
  await click(page, 'Prepare for something');
  assert.equal(await page.getByRole('button', { name: 'Finding the words', exact: true }).count(), 0);
  await click(page, 'A conversation'); assert.equal(await page.getByRole('button', { name: 'Use this move', exact: true }).count(), 0);
  await click(page, 'Finding the words');
  await edit(page, 'Edit prediction', 'My prediction', 'I might lose my place.');
  await edit(page, 'Edit my move', 'My next move', 'Say “I need a moment.”');
}
async function noOverflow(page) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow'); }
async function eventCount(page) { return page.evaluate(() => window.taraReviewEvents.filter(event => event.action === 'completed').length); }
async function options(page) { await click(page, 'Tara options'); await page.getByRole('dialog').waitFor(); }
async function seed(page, data) {
  await page.evaluate(async ({ key, data }) => {
    const { newTaraState, preparePlan, chooseEvent, chooseChallenge } = await import('/src/lib/taraTacticianState.js');
    const base = preparePlan(chooseChallenge(chooseEvent(newTaraState(), 'conversation'), 'Finding the words'));
    const state = { ...base, ...data.patch };
    if (data.legacy) { delete state.experienceVersion; delete state.predictionResult; }
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, draft: data.savedOnly ? null : state, recaps: data.savedOnly ? [state] : [] }));
  }, { key, data });
  await page.reload();
}
try {
  {
    const { page, context } = await pageFor();
    await prepare(page); await noOverflow(page); await page.reload(); await heading(page, 'One move is enough.');
    assert.equal((await draft(page)).plan.do, 'Say “I need a moment.”');
    await click(page, 'Rehearse this move (optional)'); await page.getByRole('button', { name: /^Use my move/ }).click();
    assert.equal((await draft(page)).rehearsed, false);
    assert.equal(await eventCount(page), 0);
    await click(page, 'Take this move without practising'); await heading(page, 'Your next move.');
    assert.equal((await draft(page)).rehearsed, false);
    await click(page, 'Find my words'); await heading(page, 'A cue for right now.'); await page.reload();
    await heading(page, 'A cue for right now.'); await click(page, 'Back to event'); await page.goBack(); await heading(page, 'A cue for right now.');
    await click(page, 'Back to event');
    assert.equal((await draft(page)).plan.do, 'Say “I need a moment.”');
    assert.equal(JSON.stringify(await page.evaluate(() => history.state)).includes('I need a moment'), false);
    await click(page, 'Event finished'); assert.equal(await eventCount(page), 0);
    assert.equal(await page.getByLabel('What did I do?', { exact: true }).inputValue(), '');
    assert.equal(await page.getByRole('button', { name: 'Keep this reflection', exact: true }).isDisabled(), true);
    await edit(page, 'Add what happened (optional)', 'What actually happened?', 'I paused and returned. It was still difficult.');
    await page.getByLabel('What did I do?', { exact: true }).selectOption('finished'); await click(page, 'Part of it happened');
    await click(page, 'Keep this reflection'); await heading(page, 'What you learned.'); assert.equal(await eventCount(page), 0);
    assert.equal((await draft(page)).comparison, '');
    await click(page, 'Save recap on this device (optional)'); assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), 1);
    await click(page, 'Finish'); assert.equal(await eventCount(page), 1);
    const recorded = await page.evaluate(() => window.taraReviewEvents); assert.equal(JSON.stringify(recorded).includes('I paused'), false);
    assert.equal(recorded.find(item => item.outcome).outcome.predictionResult, 'partly');
    await page.reload(); await click(page, 'Close recap'); assert.equal(await eventCount(page), 0);
    results.push('390px two selection reveals, one-field edits, refresh, selected response unpractised, support refresh/native Back/revisit, opaque history, explicit reflection/save/completion, no duplicate completion');
    await context.close();
  }
  {
    const { page, context } = await pageFor(); await prepare(page); await click(page, 'Rehearse this move (optional)');
    await page.getByRole('button', { name: /^Give myself a pause/ }).click();
    await edit(page, 'Use my own practice words', 'My practice words', 'Let me pause before I answer.');
    assert.equal((await draft(page)).rehearsed, false); await click(page, 'I tried it — take this move');
    assert.equal((await draft(page)).rehearsed, true); assert.equal((await draft(page)).plan.do, 'Let me pause before I answer.');
    await page.reload(); assert.equal((await draft(page)).rehearsed, true); assert.equal(await eventCount(page), 0);
    results.push('Explicit actual rehearsal confirmation carries chosen authored response; selection/edit/refresh alone do not mark practice or complete'); await context.close();
  }
  for (const [label, value, action] of [['It happened', 'happened', 'finished'], ['Part of it happened', 'partly', 'stepped-out'], ['It did not happen', 'did-not', 'finished'], ['I did not test it', 'not-tested', 'not-attempted'], ['I’m not sure yet', 'unsure', 'unknown']]) {
    const { page, context } = await pageFor(320); await click(page, 'I’m in it now'); await heading(page, 'Your next move.');
    assert.equal((await draft(page)).event, ''); assert.equal((await draft(page)).prediction, '');
    if (value === 'happened') {
      await click(page, 'Edit my move');
      assert.equal(await page.getByRole('textbox', { name: 'My next move', exact: true }).inputValue(), '“Let me take a moment.”');
      await click(page, 'Keep this wording');
      assert.equal((await draft(page)).plan.do, '“Let me take a moment.”');
      assert.equal((await draft(page)).plan.mind, ''); assert.equal((await draft(page)).plan.notice, '');
    }
    await click(page, 'Choose my pace'); await click(page, 'Stay with support'); await click(page, 'Back to event');
    await click(page, 'Choose my pace'); await click(page, 'Step out intentionally');
    assert.equal(await eventCount(page), 0); await click(page, 'Event finished');
    assert.equal(await page.getByLabel('What did I do?', { exact: true }).inputValue(), 'stepped-out');
    await page.getByLabel('What did I do?', { exact: true }).selectOption(action); await click(page, label); await click(page, 'Keep this reflection');
    assert.equal((await draft(page)).predictionResult, value); assert.equal((await draft(page)).eventStatus, action);
    await click(page, 'Save recap on this device (optional)'); await noOverflow(page);
    await options(page); await click(page, 'Clear Tara data'); await click(page, 'Delete Tara data');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await page.goBack(); await heading(page, 'One small step into something difficult.');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await page.reload(); await heading(page, 'One small step into something difficult.');
    results.push(`320px live entry, stay/step out, ${value}/${action}, optional save, local deletion and Back/refresh without resurrection`); await context.close();
  }
  for (const phase of ['prepare', 'plan', 'rehearse', 'tackle', 'support', 'reflect', 'recap']) {
    const { page, context } = await pageFor();
    await seed(page, { legacy: true, patch: { phase, support: 'racing', comparison: 'more', eventStatus: 'unknown', actualActionConfirmed: true, plan: { mind: 'Legacy fear', notice: 'Legacy body', do: 'My old move', spikes: 'My old backup' } } });
    assert.equal((await draft(page)).comparison, 'more'); assert.equal((await draft(page)).predictionResult, '');
    assert.equal((await draft(page)).plan.do, 'My old move'); assert.equal(await eventCount(page), 0); await noOverflow(page);
    if (phase === 'recap') assert.equal(await page.getByText('More difficult than I expected', { exact: true }).count(), 1);
    results.push(`Legacy unversioned ${phase} draft resumes authored wording and original difficulty comparison without prediction reinterpretation`); await context.close();
  }
  {
    const { page, context } = await pageFor();
    await seed(page, { savedOnly: true, legacy: true, patch: { phase: 'recap', comparison: 'less', eventStatus: 'finished', actualActionConfirmed: true, saved: true } });
    await page.getByText('Your saved recaps', { exact: true }).click(); await page.getByRole('button', { name: /A conversation.*Less difficult/ }).click();
    assert.equal(await page.getByText('Less difficult than I expected', { exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Save recap on this device (optional)', exact: true }).count(), 0);
    await click(page, 'Close recap'); assert.equal(await eventCount(page), 0);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft, key), null);
    results.push('Saved legacy recap revisit is read-only, preserves original comparison and emits no completion'); await context.close();
  }
  {
    const { page, context } = await pageFor(390, () => {
      window.taraBlockWrites = true; const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) { if (window.taraBlockWrites && key === 'mentation.tara-tactician.v1') throw new DOMException('Quota', 'QuotaExceededError'); return original.call(this, key, value); };
    });
    await prepare(page); await page.getByRole('alert').waitFor(); assert.equal(await page.getByText('Changes are not confirmed saved.', { exact: true }).count(), 1);
    await click(page, 'Use this move'); await click(page, 'Event finished'); await page.getByLabel('What did I do?', { exact: true }).selectOption('unknown');
    await click(page, 'I’m not sure yet'); await click(page, 'Keep this reflection'); await click(page, 'Save recap on this device (optional)');
    assert.equal(await page.getByRole('button', { name: 'Recap saved on this device', exact: true }).count(), 0);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); await page.screenshot({ path: `${evidence}/save-error-390.png`, fullPage: true });
    await page.evaluate(() => { window.taraBlockWrites = false; }); await click(page, 'Try saving again');
    assert.equal((await draft(page)).predictionResult, 'unsure'); await page.reload(); await heading(page, 'What you learned.');
    results.push('Quota failure preserves editable in-memory flow and honest unsaved recap; explicit retry recovers and survives refresh'); await context.close();
  }
  {
    const { page, context } = await pageFor(320); await prepare(page); await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
    await click(page, 'Edit my move'); assert.equal(await page.getByRole('textbox', { name: 'My next move', exact: true }).evaluate(node => node === document.activeElement), true);
    await page.getByRole('textbox', { name: 'My next move', exact: true }).fill('Discard this change'); await page.keyboard.press('Escape');
    assert.equal((await draft(page)).plan.do, 'Say “I need a moment.”');
    assert.equal(await page.getByRole('button', { name: 'Edit my move', exact: true }).evaluate(node => node === document.activeElement), true);
    await click(page, 'Use this move'); await noOverflow(page);
    assert.equal(await page.locator('.tara-move-card').evaluate(node => node.getBoundingClientRect().top < 400), true);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.tara')).fontSize), '24px');
    assert.equal(await page.locator('.tara-live-hub').evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.screenshot({ path: `${evidence}/live-320-large.png`, fullPage: true });
    await options(page); await page.getByRole('button', { name: 'Leave and return later', exact: true }).focus(); await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button', { name: 'Close dialog', exact: true }).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Shift+Tab'); assert.equal(await page.getByRole('button', { name: 'Leave and return later', exact: true }).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Escape'); await click(page, 'Exit Tara'); await page.reload(); await heading(page, 'Your next move.');
    results.push('320px 150% text, early move, reduced motion, editor focus/Escape cancel/restoration, dialog keyboard trap, exit and resume'); await context.close();
  }
  {
    const { page, context } = await pageFor(); await prepare(page);
    await page.evaluate(async () => { const { deleteAllLocalAppData } = await import('/src/lib/localData.js'); deleteAllLocalAppData(); });
    await heading(page, 'One small step into something difficult.'); assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await page.goBack(); await page.reload(); await heading(page, 'One small step into something difficult.');
    results.push('App-wide deletion clears mounted draft and persistent data; Back/refresh does not resurrect it'); await context.close();
  }
  {
    const { page, context } = await pageFor(); await prepare(page);
    await page.evaluate(() => { Storage.prototype.removeItem = function() {}; }); await options(page); await click(page, 'Clear Tara data'); await click(page, 'Delete Tara data');
    assert.equal(await page.getByRole('dialog').count(), 1); assert.equal(await page.getByRole('alert').last().innerText(), 'Tara data could not be deleted. Please try again.');
    assert.notEqual(await draft(page), null); results.push('Silent deletion failure keeps data and confirmation dialog with truthful error'); await context.close();
  }
  {
    const { page, context } = await pageFor(320); await prepare(page);
    const wording = 'I will take one manageable action, then pause and decide what needs to happen next. '.repeat(8);
    await edit(page, 'Edit my move', 'My next move', wording); await click(page, 'Use this move');
    await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; }); await noOverflow(page);
    assert.equal((await draft(page)).plan.do, wording);
    await page.locator('.tara-move-card summary').click(); assert.equal(await page.locator('.tara-move-card .tara-long-wording p').textContent(), wording);
    await page.goBack(); await heading(page, 'One move is enough.'); assert.equal((await draft(page)).plan.do, wording);
    await page.reload(); assert.equal((await draft(page)).plan.do, wording);
    results.push('Long authored move stays intact through disclosure, enlarged mobile text, native Back and refresh'); await context.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${evidence}/browser-results.json`, JSON.stringify({ passed: results, pageErrors: errors }, null, 2));
  console.log(JSON.stringify({ passed: results.length, scenarios: results, pageErrors: errors }, null, 2));
} finally { await browser.close(); }
