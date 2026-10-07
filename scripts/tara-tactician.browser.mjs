import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { browserFor, key, click, select, draft, assertScreen, advance, edit, captureFor, prepareAndPractise, reflectAndCarry } from './tara-tactician.browser-support.mjs';
const browser = await browserFor();
const url = process.env.TARA_PREVIEW_URL || 'http://127.0.0.1:5173/design/tara-tactician/preview.html';
const evidence = process.env.TARA_EVIDENCE_DIR || 'design/tara-tactician/one-question/verification';
const after = process.env.TARA_CAPTURE_DIR || 'design/tara-tactician/one-question/after';
mkdirSync(evidence, { recursive: true });
const passed = []; const errors = []; const captures = []; const take = captureFor(after, captures);
async function open(width = 390, init, large = width === 320, height = 844) {
 const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
 await context.addInitScript(large => { if (window !== window.top) return; document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.setProperty('font-size', large ? '24px' : '16px', 'important'); }); }, large);
 if (init) await context.addInitScript(init);
 const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); await page.goto(url);
 await page.getByRole('heading', { level: 1 }).waitFor(); return { page, context };
}
const completed = page => page.evaluate(() => window.taraReviewEvents.filter(event => event.outcome).length);
try {
 for (const [width, large, height] of [[390, false, 844], [320, true, 844], [320, false, 640]]) {
  const { page, context } = await open(width, undefined, large, height);
  const capture = height === 844 ? name => take(page, name + '-' + width + (large ? '-large' : '')) : async () => {};
  await prepareAndPractise(page, capture);
  const before = await draft(page); await click(page, 'Save plan & leave for now'); assert.equal(await completed(page), 0);
  await page.reload(); await assertScreen(page, 'ready'); assert.equal((await draft(page)).situation, before.situation); assert.deepEqual((await draft(page)).practice.triedWordings, before.practice.triedWordings);
  await click(page, 'Use my plan'); await assertScreen(page, 'live'); await capture('14-live'); await select(page, 'Find my words'); await click(page, 'Show support'); await assertScreen(page, 'support'); await capture('15-support');
  await click(page, 'Back to my situation'); await page.goBack(); await assertScreen(page, 'support'); await page.reload(); await assertScreen(page, 'support'); await click(page, 'Back to my situation'); await assertScreen(page, 'live');
  assert.equal(JSON.stringify(await page.evaluate(() => history.state)).includes('conversation about'), false);
  await reflectAndCarry(page, capture); assert.equal(await completed(page), 0); await select(page, 'Save a separate reflection'); await click(page, 'Finish');
  assert.equal(await completed(page), 1); const final = await draft(page); assert.equal(final.completionReported, true); assert.equal(final.saved, true);
  const result = await page.evaluate(() => window.taraReviewEvents.find(event => event.outcome).outcome);
  assert.equal(result.predictionResult, 'partly'); assert.equal(result.rehearsed, true); assert.equal(result.eventStatus, 'finished');
  assert.equal(JSON.stringify(result).includes('I can do this part'), false); assert.equal(JSON.stringify(result).includes('named one limit'), false);
  await page.reload(); await assertScreen(page, 'recap'); await click(page, 'Close reflection'); assert.equal(await completed(page), 0);
  passed.push(width + 'px/' + (large ? '150%' : '100%') + '/' + height + 'px complete sequential questions, two explicit tries, edited real words, save/leave/resume, support/native Back/refresh, truthful partial result, next step, explicit separate save and no duplicate completion');
  await context.close();
 }
 for (const [result, label] of [['happened', 'It happened'], ['partly', 'Part of it happened'], ['did-not', 'It did not happen'], ['not-tested', 'I did not test it'], ['unsure', 'I’m not sure yet']]) {
  const { page, context } = await open(320);
  await click(page, 'Get started'); await select(page, 'I’m in it now'); await advance(page, 'live');
  await click(page, 'Practice options'); await click(page, 'Save plan and leave'); await page.reload(); await assertScreen(page, 'live');
  // The immediate route has no invented prediction. Add the user's own via a fixture-only state edit.
  await page.evaluate(key => { const record = JSON.parse(localStorage.getItem(key)); record.draft.prediction = 'My own explicit worry'; record.draft.predictionEdited = true; localStorage.setItem(key, JSON.stringify(record)); }, key); await page.reload();
  await select(page, 'Choose my pace'); await click(page, 'Show support'); await assertScreen(page, 'pace'); await select(page, 'Step out intentionally'); await advance(page, 'live');
  assert.equal((await draft(page)).eventStatus, 'stepped-out'); assert.equal((await draft(page)).actualActionConfirmed, false);
  await click(page, 'I’m finished or paused — reflect'); await select(page, 'Did not attempt it'); await advance(page, 'reflect-prediction'); await select(page, label); await advance(page, 'reflect-observation'); await advance(page, 'next-step'); await advance(page, 'recap');
  assert.equal((await draft(page)).predictionResult, result); assert.equal((await draft(page)).nextStep, ''); assert.equal((await draft(page)).actual, '');
  await select(page, 'Finish without a separate saved reflection'); await click(page, 'Finish'); assert.equal(await completed(page), 1);
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), 0);
  passed.push('320px immediate support and deliberate pause, actual action differs from pause, ' + result + ', empty observation/next-step, no forced saved reflection'); await context.close();
 }
 for (const version of [1, 2, 3]) for (const phase of ['prepare', 'plan', 'rehearse', 'ready', 'tackle', 'support', 'reflect', 'recap']) {
  const { page, context } = await open(390);
  await page.evaluate(({ key, version, phase }) => {
   const state = { schemaVersion: 1, experienceVersion: version, id: 'legacy-' + version + '-' + phase, phase, entryMode: 'prepare', event: 'conversation', prepareView: 'challenge', challenge: 'Finding the words', situation: 'Original private situation', prediction: 'Original private prediction', predictionEdited: true, plan: { mind: 'Original reminder', notice: 'Original signal', do: 'Original first move', spikes: 'Original backup' }, rehearsal: 'Original practice words', rehearsalChoice: 'my-move', rehearsalResponse: 'Original selected response', rehearsed: true, eventStatus: 'unknown', actualActionConfirmed: phase === 'reflect' || phase === 'recap', predictionResult: version >= 2 && phase === 'recap' ? 'unsure' : '', comparison: 'more', actual: 'Original actual observation', learning: 'Original learning', nextStep: 'Original next-use words', saved: false, completionReported: phase === 'recap', practice: { round: 0, step: 'try', responses: ['move', ''], wordings: ['Original selected response', ''], tried: [false, false], triedWordings: ['', ''], usability: '' } };
   if (version < 3) delete state.practice;
   localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, draft: state, recaps: [] }));
  }, { key, version, phase }); await page.reload(); await page.getByRole('heading', { level: 1 }).waitFor();
  const loaded = await draft(page); assert.equal(loaded.situation, 'Original private situation'); assert.equal(loaded.learning, 'Original learning'); assert.equal(loaded.nextStep, 'Original next-use words'); assert.equal(loaded.comparison, 'more'); assert.deepEqual(loaded.practice.tried, [false, false]);
  const shown = await page.locator('[data-flow-screen]').getAttribute('data-flow-screen'); await assertScreen(page, shown);
  if (phase === 'rehearse') assert.equal(await page.getByText('Original selected response', { exact: true }).count(), 1);
  if (phase === 'recap') { await click(page, 'Close reflection'); assert.equal(await completed(page), 0); }
  passed.push('Legacy v' + version + ' ' + phase + ' resumes exact original wording/outcomes and no invented new try'); await context.close();
 }
 {
  const { page, context } = await open(320);
  await click(page, 'Get started'); await select(page, 'Before the situation'); await advance(page, 'event'); await select(page, 'A conversation'); await advance(page, 'challenge'); await select(page, 'Holding a boundary'); await advance(page, 'prediction'); await advance(page, 'move');
  await edit(page, 'Write my own move', 'My first move', 'My exact long wording '.repeat(120)); const wording = (await draft(page)).plan.do; await advance(page, 'move-confirm');
  await page.getByRole('button', { name: 'Go back', exact: true }).click(); await assertScreen(page, 'move'); assert.equal((await draft(page)).plan.do, wording);
  await page.reload(); await assertScreen(page, 'move'); await advance(page, 'move-confirm'); await page.getByText('Read the full wording', { exact: true }).click(); assert.equal(await page.getByText(wording, { exact: true }).count(), 1);
  await click(page, 'Use my plan without practising'); await assertScreen(page, 'ready'); assert.deepEqual((await draft(page)).practice.tried, [false, false]); assert.equal((await draft(page)).rehearsed, false);
  await click(page, 'Use my plan'); await click(page, 'I’m finished or paused — reflect'); await select(page, 'I’m not sure yet'); await advance(page, 'reflect-prediction');
  assert.equal(await page.getByRole('radio').count(), 2, 'No prediction means only untested/unsure, not a fabricated comparison');
  assert.equal(await page.getByText('No prediction recorded.', { exact: true }).count(), 1);
  passed.push('Long exact words, Back/refresh/editable custom move, plan-only route stays unpractised, no invented prediction'); await context.close();
 }
 {
  const { page, context } = await open(390);
  await click(page, 'Get started'); await page.getByRole('radio', { name: 'Before the situation', exact: true }).focus(); await page.keyboard.press('ArrowDown'); assert.equal(await page.getByRole('radio', { name: 'I’m in it now', exact: true }).isChecked(), true);
  await page.keyboard.press('ArrowUp'); assert.equal(await page.getByRole('radio', { name: 'Before the situation', exact: true }).isChecked(), true); await assertScreen(page, 'timing');
  await select(page, 'Before the situation'); await advance(page, 'event'); await click(page, 'Name this moment (optional)'); await page.getByRole('textbox').fill('Cancelled text'); await page.keyboard.press('Escape');
  assert.equal((await draft(page)).situation, ''); assert.equal(await page.getByRole('button', { name: 'Name this moment (optional)', exact: true }).evaluate(node => node === document.activeElement), true);
  passed.push('Native radio arrow keys select without advancing; dialog Escape cancels and restores trigger focus'); await context.close();
 }
 {
  const { page, context } = await open(390, () => { const original = Storage.prototype.setItem; window.blockTara = true; Storage.prototype.setItem = function(k, value) { if (k === 'mentation.tara-tactician.v1' && window.blockTara) throw new Error('quota'); return original.call(this, k, value); }; });
  await click(page, 'Get started'); await select(page, 'Before the situation'); await advance(page, 'event'); await select(page, 'A conversation'); await advance(page, 'challenge'); await select(page, 'Holding a boundary'); await advance(page, 'prediction'); await page.getByRole('textbox').fill('Exact unsaved words');
  assert.equal(await page.getByText('Changes are not confirmed saved.', { exact: true }).count(), 1); assert.equal(await page.getByRole('textbox').inputValue(), 'Exact unsaved words');
  await page.evaluate(() => { window.blockTara = false; }); await click(page, 'Try saving again'); assert.equal((await draft(page)).prediction, 'Exact unsaved words');
  await page.reload(); await assertScreen(page, 'prediction'); passed.push('Quota error keeps in-memory words; explicit retry and refresh restore the exact question and words'); await context.close();
 }
 {
  const { page, context } = await open(390); await click(page, 'Get started'); await select(page, 'I’m in it now'); await advance(page, 'live');
  await page.evaluate(() => { const remove = Storage.prototype.removeItem; window.blockDelete = true; Storage.prototype.removeItem = function(k) { if (k === 'mentation.tara-tactician.v1' && window.blockDelete) return; return remove.call(this, k); }; });
  await click(page, 'Practice options'); await click(page, 'Clear saved practice'); await click(page, 'Delete practice data'); assert.equal(await page.getByRole('dialog').count(), 1); assert.notEqual(await draft(page), null);
  await page.evaluate(() => { window.blockDelete = false; }); await click(page, 'Delete practice data'); await assertScreen(page, 'entry'); assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); await page.goBack(); await assertScreen(page, 'entry'); await page.reload(); await assertScreen(page, 'entry');
  passed.push('Failed deletion stays honest; verified deletion wipes draft/recaps and Back/refresh cannot restore them'); await context.close();
 }
 {
  const { page, context } = await open(390); await click(page, 'Get started'); await select(page, 'Before the situation'); await advance(page, 'event');
  await page.evaluate(key => { localStorage.removeItem(key); dispatchEvent(new CustomEvent('mentation:tara-cleared')); }, key); await assertScreen(page, 'entry'); await page.goBack(); await assertScreen(page, 'entry');
  passed.push('App-wide/shared saved-memory deletion signal clears the mounted question and its history snapshots'); await context.close();
 }
 {
  const { page, context } = await open(390, () => localStorage.setItem('mentation.tara-tactician.v1', '{"protected":"unreadable"}'));
  await click(page, 'Get started'); await select(page, 'Before the situation'); await advance(page, 'event'); assert.equal(await page.evaluate(key => localStorage.getItem(key), key), '{"protected":"unreadable"}');
  passed.push('Unreadable saved data remains protected while the in-memory flow continues'); await context.close();
 }
 {
  const { page, context } = await open(390);
  await click(page, 'Get started'); await select(page, 'Before the situation'); await advance(page, 'event'); await select(page, 'A conversation'); await advance(page, 'challenge'); await select(page, 'Holding a boundary'); await advance(page, 'prediction'); await page.getByRole('textbox').fill('Exact worry to resume'); await advance(page, 'move'); await select(page, 'Name one clear limit'); await advance(page, 'move-confirm'); await click(page, 'Practise this move'); await select(page, 'Use my first move'); await advance(page, 'practice-try'); await click(page, 'I tried this'); await assertScreen(page, 'practice-choose');
  const words = (await draft(page)).practice.triedWordings[0];
  for (let count = 0; count < 20; count++) {
   const previous = await page.locator('[data-flow-screen]').getAttribute('data-flow-screen'); if (previous === 'entry') break;
   await click(page, 'Go back'); await page.waitForFunction(previous => document.querySelector('[data-flow-screen]')?.dataset.flowScreen !== previous, previous);
  }
  await assertScreen(page, 'entry'); await click(page, 'Resume my plan'); await assertScreen(page, 'practice-choose');
  assert.equal((await draft(page)).practice.round, 1); assert.deepEqual((await draft(page)).practice.tried, [true, false]); assert.equal((await draft(page)).practice.triedWordings[0], words); assert.equal((await draft(page)).prediction, 'Exact worry to resume');
  passed.push('Actual Back through all question screens to entry, then Resume restores the unfinished recovery beat, confirmed words and exact worry'); await context.close();
 }
 {
  const { page, context } = await open(390); await prepareAndPractise(page); await click(page, 'Use my plan'); await reflectAndCarry(page); await select(page, 'Save a separate reflection');
  await page.evaluate(() => { const original = Storage.prototype.setItem; window.failArchive = true; Storage.prototype.setItem = function(k, value) { if (k === 'mentation.tara-tactician.v1' && window.failArchive && JSON.parse(value).recaps.length > 0) throw new Error('archive quota'); return original.call(this, k, value); }; });
  await click(page, 'Finish'); await assertScreen(page, 'recap'); assert.equal(await completed(page), 0); assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), 0);
  assert.equal(await page.getByText('Changes are not confirmed saved.', { exact: true }).count(), 1);
  await page.evaluate(() => { window.failArchive = false; }); await click(page, 'Finish'); assert.equal(await completed(page), 1); assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), 1);
  passed.push('Failed explicit reflection save blocks Finish/completion; retry saves exactly one reflection and reports one completion'); await context.close();
 }
 assert.deepEqual(errors, []);
 writeFileSync(evidence + '/browser-results.json', JSON.stringify({ passed, pageErrors: errors, fixtureProvenance: 'Synthetic explicit user actions only; legacy/immediate branch setup is identified in the test. No real outcomes or real user data.' }, null, 2));
 writeFileSync(after + '/capture-manifest.json', JSON.stringify({ baseMain: 'b4f406c9f3f638bba11d04bebb10df7c60274609', branch: 'codex/get-through-one-question', captures, pageErrors: errors, fixtures: 'Synthetic work-boundary example. Full journey uses explicit choices and confirmations; not a real-world outcome.' }, null, 2));
 console.log(JSON.stringify({ passed: passed.length, scenarios: passed, captures: captures.length, pageErrors: errors }, null, 2));
} finally { await browser.close(); }
