// Authored Tara journey and lifecycle checks. Start Vite first; no external calls.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const url = process.env.TARA_PREVIEW_URL || 'http://127.0.0.1:5173/design/tara-tactician/preview.html';
const evidence = process.env.TARA_EVIDENCE_DIR || 'design/tara-tactician/guided-redesign/verification';
mkdirSync(evidence, { recursive: true });
const results = []; const errors = []; const key = 'mentation.tara-tactician.v1';
const click = (page, name) => page.getByRole('button', { name, exact: true }).click();
const choice = (page, name) => page.getByRole('button', { name: new RegExp('^' + name) }).click();
async function pageFor(width = 390, init) {
 const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
 if (init) await context.addInitScript(init);
 const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
 await page.goto(url); await page.getByRole('heading', { level: 1 }).waitFor(); return { page, context };
}
async function heading(page, name) { await page.getByRole('heading', { level: 1, name, exact: true }).waitFor(); }
async function draft(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key))?.draft, key); }
async function edit(page, button, label, value) { await click(page, button); await page.getByRole('textbox', { name: label, exact: true }).fill(value); await click(page, 'Keep this wording'); }
async function noOverflow(page) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); }
async function completed(page) { return page.evaluate(() => window.taraReviewEvents.filter(item => item.action === 'completed').length); }
async function options(page) { await click(page, 'Tara options'); await page.getByRole('dialog', { name: 'Your pace, your choices', exact: true }).waitFor(); }
async function plan(page, persisted = true) {
 await click(page, 'Plan with Tara'); assert.equal(await page.getByRole('button', { name: 'Holding a boundary', exact: true }).count(), 0);
 await choice(page, 'A conversation'); assert.equal(await page.getByRole('button', { name: /^Name one clear limit/ }).count(), 0);
 await choice(page, 'Holding a boundary'); if (persisted) assert.equal((await draft(page)).plan.do, '');
 await choice(page, 'Name one clear limit'); await edit(page, 'Edit my move', 'My first move', 'My private first line.');
 await page.getByText('Make it about my real situation', { exact: true }).click(); await edit(page, 'Name this moment', 'Name this moment', 'My private work conversation');
 await edit(page, 'Edit prediction', 'My prediction', 'My private prediction.');
}
async function reflect(page, action, result) {
 await click(page, 'Return to reflect'); await heading(page, 'How did it go?');
 assert.equal(await completed(page), 0); if (!(await draft(page)).actualActionConfirmed) await choice(page, action); else { await click(page, 'Change what I did'); await choice(page, action); }
 assert.equal(await page.getByRole('button', { name: 'Stepped out intentionally', exact: true }).count(), 0, 'prior choices collapse');
 await choice(page, result); assert.equal(await page.getByRole('button', { name: 'It happened', exact: true }).count(), 0, 'result choices collapse');
 await click(page, 'Keep my reflection'); await heading(page, 'What comes next.');
}
async function seed(page, { phase, version = 2, savedOnly = false }) {
 await page.evaluate(async ({ key, phase, version, savedOnly }) => {
  const { newTaraState, chooseEvent, chooseChallenge } = await import('/src/lib/taraTacticianState.js');
  const state = { ...chooseChallenge(chooseEvent(newTaraState(), 'conversation'), 'Finding the words'), experienceVersion: version, phase, plan: { mind: 'Legacy reminder', notice: 'Legacy cue', do: 'Legacy exact first words', spikes: 'Legacy exact backup' }, comparison: 'more', predictionResult: version === 1 ? '' : 'partly', actual: 'Legacy exact observation', actualActionConfirmed: true, eventStatus: 'unknown', support: 'racing', rehearsed: true };
  delete state.practice; delete state.carryChoice;
  localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, draft: savedOnly ? null : state, recaps: savedOnly ? [state] : [] }));
 }, { key, phase, version, savedOnly }); await page.reload();
}
try {
 for (const width of [390, 320]) {
  const { page, context } = await pageFor(width); if (width === 320) await page.addStyleTag({ content: 'html { font-size:24px!important; }' });
  const main = await page.getByRole('button', { name: 'Plan with Tara', exact: true }).boundingBox(); const alternative = await page.getByRole('button', { name: 'Another way', exact: true }).boundingBox(); assert.equal(alternative.y > main.y + main.height, true); assert.equal(main.y + main.height < 844, true);
  await plan(page); await click(page, 'Try it with Tara');
  assert.equal(await page.getByText('My private work conversation', { exact: true }).count(), 1);
  await choice(page, 'Give myself a pause'); assert.equal((await draft(page)).rehearsed, false); assert.deepEqual((await draft(page)).practice.tried, [false, false]);
  await edit(page, 'Use my own practice words', 'My practice words', 'My private practice pause.'); await click(page, 'I tried it — practise a way back');
  assert.deepEqual((await draft(page)).practice.tried, [true, false]); assert.equal((await draft(page)).plan.do, 'My private first line.');
  await choice(page, 'Repeat the limit'); assert.deepEqual((await draft(page)).practice.tried, [true, false]);
  await edit(page, 'Use my own practice words', 'My practice words', 'My private recovery words.'); await click(page, 'I tried it — keep my pocket plan');
  assert.deepEqual((await draft(page)).practice.tried, [true, true]); assert.equal((await draft(page)).practice.triedWordings[0], 'My private practice pause.'); assert.equal((await draft(page)).practice.triedWordings[1], 'My private recovery words.'); assert.equal((await draft(page)).practice.usability, '');
  await page.getByText('How usable does this feel?', { exact: true }).click(); await choice(page, 'I’m not sure yet'); assert.equal((await draft(page)).practice.usability, 'unsure');
  await click(page, 'Save plan & leave for now'); assert.equal(await completed(page), 0);
  await page.reload(); await heading(page, 'Your pocket plan.'); assert.equal((await draft(page)).situation, 'My private work conversation');
  await click(page, 'Open live support'); await choice(page, 'Find my words'); assert.equal(await page.getByText('My private recovery words.', { exact: true }).count(), 1);
  await click(page, 'Back to my moment'); await page.goBack(); await heading(page, 'Find your way back.'); await page.reload(); await heading(page, 'Find your way back.'); await click(page, 'Back to my moment');
  assert.equal(JSON.stringify(await page.evaluate(() => history.state)).includes('private'), false);
  await reflect(page, 'Took part in all or some', 'Part of it happened');
  assert.equal((await draft(page)).nextStep, ''); assert.equal((await draft(page)).learning, ''); await choice(page, 'Make the next attempt smaller');
  assert.equal((await draft(page)).actual, ''); assert.equal((await draft(page)).comparison, '');
  await edit(page, 'Edit my next step', 'My next small step', 'My private next use.');
  await click(page, 'Save reflection on this device (optional)'); assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), 1);
  await noOverflow(page); await click(page, 'Finish'); assert.equal(await completed(page), 1);
  const events = await page.evaluate(() => window.taraReviewEvents); assert.equal(JSON.stringify(events).includes('private'), false); assert.equal(events.find(item => item.outcome).outcome.predictionResult, 'partly');
  await page.reload(); await click(page, 'Close reflection'); assert.equal(await completed(page), 0);
  results.push(`${width}px full named planning, deliberately chosen move, two confirmed practice beats, edited words, honest usability, save/leave/resume, contextual support, native Back/reload, explicit next-use/save/completion and private outcome`); await context.close();
 }
 for (const [result, value, action] of [['It happened', 'happened', 'Took part in all or some'], ['Part of it happened', 'partly', 'Stepped out intentionally'], ['It did not happen', 'did-not', 'Took part in all or some'], ['I did not test it', 'not-tested', 'Did not attempt it'], ['I’m not sure yet', 'unsure', 'I’m not sure yet']]) {
  const { page, context } = await pageFor(320); await click(page, 'I’m in it now'); assert.equal((await draft(page)).prediction, '');
  await click(page, 'Edit my move'); assert.equal(await page.getByRole('textbox', { name: 'My first move', exact: true }).inputValue(), '“Let me take a moment.”'); await click(page, 'Cancel');
  await choice(page, 'Choose my pace'); await click(page, 'Stay with my plan'); await choice(page, 'Choose my pace'); await click(page, 'Step out intentionally');
  assert.equal(await completed(page), 0); await reflect(page, action, result); assert.equal((await draft(page)).predictionResult, value);
  await click(page, 'Save reflection on this device (optional)'); await options(page); await choice(page, 'Clear Tara data'); await click(page, 'Delete Tara data');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); await page.goBack(); await page.reload(); await heading(page, /Difficult moment.*Clear next move./);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); results.push(`320px immediate support, stay/step out, ${value} without inferred participation, optional save, verified delete and Back/refresh`); await context.close();
 }
 {
  const { page, context } = await pageFor(); await plan(page); await click(page, 'Try it with Tara'); await choice(page, 'Use my first move'); await click(page, 'Keep the plan without trying this');
  assert.equal((await draft(page)).rehearsed, false); assert.deepEqual((await draft(page)).practice.tried, [false, false]);
  await click(page, 'Go back'); await heading(page, 'Try the moment.'); assert.equal((await draft(page)).plan.do, 'My private first line.');
  await click(page, 'Go back'); await heading(page, 'Choose your way in.'); await click(page, 'Keep my plan without practising'); await click(page, 'Open live support');
  await click(page, 'Go back'); await heading(page, 'Your pocket plan.'); assert.equal((await draft(page)).rehearsed, false);
  results.push('Selected but skipped practice remains unpractised; plan-only route and Back preserve authored first move'); await context.close();
 }
 for (const version of [1, 2]) for (const phase of ['prepare', 'plan', 'rehearse', 'tackle', 'support', 'reflect', 'recap']) {
  const { page, context } = await pageFor(); await seed(page, { version, phase });
  assert.equal((await draft(page)).plan.do, 'Legacy exact first words'); assert.equal((await draft(page)).plan.spikes, 'Legacy exact backup');
  assert.equal((await draft(page)).comparison, 'more'); assert.equal((await draft(page)).actual, 'Legacy exact observation'); assert.deepEqual((await draft(page)).practice.tried, [false, false]);
  assert.equal(await completed(page), 0); await noOverflow(page);
  if (phase === 'recap') assert.equal(await page.getByRole('heading', { level: 2, name: version === 1 ? 'More difficult than I expected' : 'Part of it happened', exact: true }).count(), 1);
  results.push(`Legacy v${version} ${phase} resumes private words, exact original outcome and historical practice without inventing new tries`); await context.close();
 }
 {
  const { page, context } = await pageFor(); await seed(page, { version: 1, phase: 'recap', savedOnly: true });
  await page.getByText('Your saved reflections', { exact: true }).click(); await choice(page, 'A conversation'); assert.equal(await page.getByRole('button', { name: 'Save reflection on this device (optional)', exact: true }).count(), 0);
  await click(page, 'Close reflection'); assert.equal(await completed(page), 0); assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft, key), null);
  results.push('Saved legacy reflection revisit is read-only, keeps difficulty semantics and emits no completion'); await context.close();
 }
 {
  const { page, context } = await pageFor(390, () => { window.taraBlockWrites = true; const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'mentation.tara-tactician.v1' && window.taraBlockWrites) throw new DOMException('Quota', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await plan(page, false); await page.getByRole('alert').waitFor(); await click(page, 'Keep my plan without practising'); await click(page, 'Save plan & leave for now');
  assert.equal(await page.getByRole('heading', { name: 'Your pocket plan.', exact: true }).count(), 1); assert.equal(await page.evaluate(() => window.taraReviewEvents.length), 0);
  await page.evaluate(() => { window.taraBlockWrites = false; }); await click(page, 'Try saving again'); await page.reload(); await heading(page, 'Your pocket plan.');
  assert.equal((await draft(page)).plan.do, 'My private first line.'); results.push('Quota failure never claims a saved plan or exits on Save/leave; explicit retry recovers exact authored words'); await context.close();
 }
 {
  const { page, context } = await pageFor(320); await plan(page); const long = 'My full private wording remains exact. '.repeat(60);
  await edit(page, 'Edit my move', 'My first move', long); await click(page, 'Keep my plan without practising'); await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await noOverflow(page); await page.locator('[aria-label="My way in"] summary').click(); assert.equal(await page.locator('[aria-label="My way in"] .tara-long-wording p').textContent(), long);
  await edit(page, 'Edit my move', 'My first move', 'Second deliberate wording.'); await edit(page, 'Edit my move', 'My first move', 'Third deliberate wording.'); await page.reload();
  assert.equal((await draft(page)).plan.do, 'Third deliberate wording.');
  await click(page, 'Edit my move'); assert.equal(await page.getByRole('textbox').evaluate(node => node === document.activeElement), true); await page.getByRole('textbox').fill('Unsaved modal text'); await page.keyboard.press('Escape');
  assert.equal((await draft(page)).plan.do, 'Third deliberate wording.'); assert.equal(await page.getByRole('button', { name: 'Edit my move', exact: true }).evaluate(node => node === document.activeElement), true);
  await options(page); await page.getByRole('button', { name: 'Leave and return later', exact: true }).focus(); await page.keyboard.press('Tab'); assert.equal(await page.getByRole('button', { name: 'Close dialog', exact: true }).evaluate(node => node === document.activeElement), true); await page.keyboard.press('Shift+Tab'); assert.equal(await page.getByRole('button', { name: 'Leave and return later', exact: true }).evaluate(node => node === document.activeElement), true);
  await page.keyboard.press('Escape'); assert.equal(await page.getByRole('button', { name: 'Tara options', exact: true }).evaluate(node => node === document.activeElement), true);
  results.push('Long and repeated authored input survives disclosure/refresh; editor cancel preserves committed words; keyboard trap, Escape and focus restoration'); await context.close();
 }
 {
  const { page, context } = await pageFor(); await plan(page); await page.evaluate(async () => { const { deleteAllLocalAppData } = await import('/src/lib/localData.js'); deleteAllLocalAppData(); });
  await heading(page, /Difficult moment.*Clear next move./); assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); await page.goBack(); await page.reload();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); results.push('App-wide deletion resets mounted state, and Back/refresh cannot resurrect private words'); await context.close();
 }
 {
  const { page, context } = await pageFor(); await plan(page); await page.evaluate(() => { Storage.prototype.removeItem = function() {}; }); await options(page); await choice(page, 'Clear Tara data'); await click(page, 'Delete Tara data');
  assert.equal(await page.getByRole('dialog', { name: 'Clear Tara data?', exact: true }).count(), 1); assert.equal(await page.getByRole('alert').last().innerText(), 'Tara data could not be deleted. Please try again.'); assert.notEqual(await draft(page), null);
  results.push('Silent deletion failure keeps data and confirmation open with an honest error'); await context.close();
 }
 {
  const { page, context } = await pageFor(390, () => localStorage.setItem('mentation.tara-tactician.v1', '{unreadable'));
  await click(page, 'Plan with Tara'); await choice(page, 'A conversation'); assert.equal(await page.evaluate(key => localStorage.getItem(key), key), '{unreadable');
  await page.getByRole('alert').waitFor(); results.push('Unreadable saved data remains unchanged while an in-memory plan can continue'); await context.close();
 }
 {
  const { page, context } = await pageFor(); await seed(page, { version: 2, phase: 'rehearse' });
  await page.evaluate(key => { const value = JSON.parse(localStorage.getItem(key)); delete value.draft.practice; value.draft.rehearsalChoice = 'pause'; value.draft.rehearsalResponse = 'My exact earlier selected response.'; value.draft.rehearsed = false; localStorage.setItem(key, JSON.stringify(value)); }, key); await page.reload();
  assert.equal(await page.getByText('My exact earlier selected response.', { exact: true }).count(), 1); assert.deepEqual((await draft(page)).practice.tried, [false, false]);
  await click(page, 'Keep the plan without trying this'); assert.equal((await draft(page)).rehearsed, false);
  results.push('Legacy selected practice response resumes verbatim without an invented try; skipping preserves historical honesty'); await context.close();
 }
 {
  const { page, context } = await pageFor(); await plan(page);
  const before = await page.evaluate(() => history.state.idx); await click(page, 'Try it with Tara');
  assert.equal(await page.evaluate(() => history.state.idx), before + 1);
  await click(page, 'Go back'); await heading(page, 'Choose your way in.'); await click(page, 'Go back'); await heading(page, 'What feels difficult?');
  assert.equal((await draft(page)).challenge, 'Holding a boundary'); await click(page, 'Go back'); await heading(page, 'What’s coming up?'); await click(page, 'Go back');
  await heading(page, /Difficult moment.*Clear next move./); await click(page, 'Resume my plan');
  assert.equal((await draft(page)).event, 'conversation'); assert.equal((await draft(page)).challenge, 'Holding a boundary'); assert.equal((await draft(page)).plan.do, 'My private first line.');
  results.push('Back returns through question views without erasing selected situation/challenge or latest words; Resume retains context and router history indices advance correctly'); await context.close();
 }
 assert.deepEqual(errors, []); writeFileSync(`${evidence}/browser-results.json`, JSON.stringify({ passed: results, pageErrors: errors, fixtureProvenance: 'Synthetic browser fixtures only. No real user data or claimed real-world success.' }, null, 2)); console.log(JSON.stringify({ passed: results.length, scenarios: results, pageErrors: errors }, null, 2));
} finally { await browser.close(); }
