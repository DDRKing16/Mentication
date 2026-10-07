/* Vite + environment-provided Playwright/Chromium. No app dependency or service added. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.CARE_PREVIEW_URL || 'http://localhost:5176';
const out = process.env.CARE_EVIDENCE_DIR || path.resolve('docs/handoffs/unhook-make-room-redesign/after');
fs.mkdirSync(out, { recursive: true });
const key = 'mentation.flagship.active.v1', savedKey = 'mentation.carePractices.saved.v1';
const names = { unhook: 'Unhook from the Thought', makeRoom: 'Make Room for the Feeling' };
const words = { unhook: "I'll freeze when I speak.", makeRoom: 'Worry about the conversation' };
const actions = { unhook: 'Read the opening line of my notes.', makeRoom: 'Get a glass of water before the conversation.' };
const click = (p, name) => p.getByRole('button', { name, exact: true }).click();
const state = p => p.evaluate(key => JSON.parse(localStorage.getItem(key)).experience, key);
const errors = [], results = [];
async function layout(p) {
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await p.locator('.xr-experience button').evaluateAll(nodes => nodes.every(node => { const r=node.getBoundingClientRect(); return r.height>=44 && r.width>=44; })), true);
}
async function shot(p, id, name, width, stage, phase) {
  assert.equal(await p.locator(`[data-care=${id}][data-care-stage=${stage}]`).count(), 1);
  if (phase) await p.locator(`[data-${id === 'unhook' ? 'unhook' : 'room'}-phase=${phase}]`).waitFor();
  await layout(p); await p.screenshot({ path: path.join(out, `${id}-${name}-${width}.png`), fullPage: true });
}
async function resume(p, id, phase) {
  const previous = await state(p); await p.reload(); await click(p, 'Resume practice');
  if (phase) await p.locator(`[data-${id === 'unhook' ? 'unhook' : 'room'}-phase=${phase}]`).waitFor();
  const next = await state(p);
  for (const field of ['notice', 'perspective', 'action', 'practiceTaken', 'actionStatus', 'anchorType', 'anchorText', 'anchorNoticed', 'allowance', 'defusionStep', 'distance']) assert.deepEqual(next[field], previous[field]);
  assert.equal(await p.locator('h1').evaluate(e => document.activeElement === e), true);
}
async function storage(p, mode) {
  await p.evaluate(({ mode, key, savedKey }) => {
    window.xrSet ||= Storage.prototype.setItem; window.xrRemove ||= Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { if (['save', 'deleteSaved'].includes(mode) && k === savedKey || mode === 'draft' && k === key) throw Error('synthetic write failure'); return window.xrSet.call(this, k, v); };
    Storage.prototype.removeItem = function (k) { if (mode === 'delete' && k === key) throw Error('synthetic deletion failure'); return window.xrRemove.call(this, k); };
  }, { mode, key, savedKey });
}
async function entry(p, id, rating = 6) {
  await p.goto(`${base}/library`); await p.getByLabel('Search practices', { exact: true }).fill(names[id]); await p.getByRole('button').filter({ hasText: names[id] }).last().click(); await p.locator(`[data-care=${id}]`).waitFor();
  await shot(p, id, 'arrival', p.viewportSize().width, 'arrival');
  await click(p, 'Begin'); assert.equal(await p.locator('.care-rating [aria-pressed=true]').count(), 0);
  const question = await p.locator('.care-rating legend').innerText();
  if (rating === null) await click(p, 'Skip rating'); else { await click(p, `${rating} of 10`); await click(p, 'Continue'); }
  await click(p, 'Use my own words'); await p.getByRole('textbox', { name: id === 'unhook' ? 'The sticky thought' : 'The feeling', exact: true }).fill(words[id]);
  await click(p, id === 'unhook' ? 'Work with this thought' : 'Find a steady point nearby'); return question;
}
async function chooseOwn(p, action) { await click(p, 'Choose my own step'); await p.getByLabel('My useful next step', { exact: true }).fill(action); assert.equal(await p.getByLabel('My useful next step', { exact: true }).inputValue(), action); await click(p, 'Use this step'); }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const width of [320, 390]) for (const id of ['unhook', 'makeRoom']) {
      const c = await b.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' }); const p = await c.newPage(); p.on('pageerror', e => errors.push(`${id}/${width}: ${e.message}`));
      await p.addInitScript(() => { if (window.top === window) localStorage.setItem('haven_onboarded', '1'); });
      const question = await entry(p, id);
      const beforeAlternative = await state(p); await click(p, 'Another way'); await p.getByRole('dialog').waitFor(); await p.keyboard.press('Escape'); await p.getByRole('dialog').waitFor({state:'hidden'}); const afterAlternative = await state(p); for (const field of ['stage','notice','perspective','action','actionStatus','practiceTaken','anchorType','anchorText','anchorNoticed','allowance','defusionStep','distance','before','after']) assert.deepEqual(afterAlternative[field],beforeAlternative[field]);
      if (id === 'unhook') {
        await p.getByRole('button', { name: /^Predicting/ }).focus(); await p.keyboard.press('Space');
        assert.equal((await state(p)).practiceTaken, false); assert.equal((await state(p)).notice, words[id]);
        await shot(p, id, 'phrase', width, 'practice', 'notice'); await resume(p, id, 'notice');
        await p.getByRole('button', { name: 'I tried saying it this way', exact: true }).focus(); await p.keyboard.press('Enter');
        assert.equal((await state(p)).practiceTaken, true); await shot(p, id, 'direction', width, 'practice', 'direction'); await resume(p, id, 'direction');
        await chooseOwn(p, actions[id]); await click(p, 'Something I can see'); await click(p, 'Name what I notice'); await p.getByLabel('My outside anchor', { exact: true }).fill('The opening line on my notes');
        assert.equal((await state(p)).anchorNoticed, false); await resume(p, id, 'attention');
        await shot(p, id, 'attention', width, 'practice', 'attention'); await click(p, 'I tried returning attention');
        assert.equal((await state(p)).actionStatus, 'planned'); assert.equal((await state(p)).notice, words[id]); await shot(p, id, 'returned', width, 'practice', 'attention');
        await click(p, 'The thought pulled me back'); assert.match(await p.locator('.uh-words').innerText(), new RegExp('freeze')); await shot(p, id, 'pulled', width, 'practice', 'attention');
        await click(p, 'I brought attention back'); assert.equal((await state(p)).distance, 'beside'); assert.equal((await state(p)).before, 6); assert.equal((await state(p)).after, null);
        await click(p, 'Go back'); await p.locator('[data-care-stage=notice]').waitFor(); assert.equal(await p.getByRole('textbox', { name: 'The sticky thought', exact: true }).inputValue(), words[id]); await click(p, 'Work with this thought');
        await click(p, 'Check in and finish');
      } else {
        assert.equal(await p.getByRole('button', { name: 'Try a gentle moment with this anchor', exact: true }).isDisabled(), true);
        await click(p, 'Something I can see'); await click(p, 'Name what I notice'); await p.getByLabel('My outside anchor', { exact: true }).fill('The edge of my desk');
        assert.equal((await state(p)).practiceTaken, false); await shot(p, id, 'anchor', width, 'practice', 'anchor'); await resume(p, id, 'anchor');
        await click(p, 'Try a gentle moment with this anchor'); assert.equal((await state(p)).practiceTaken, false); await shot(p, id, 'allow', width, 'practice', 'allow'); await resume(p, id, 'allow');
        const feelingFont = await p.locator('.mr-feeling h1').evaluate(e => getComputedStyle(e).fontSize);
        await click(p, 'I tried letting the feeling be here'); assert.equal((await state(p)).practiceTaken, true);
        await chooseOwn(p, actions[id]); assert.equal(await p.locator('.mr-feeling h1').evaluate(e => getComputedStyle(e).fontSize), feelingFont); assert.equal(await p.locator('.mr-feeling h1').innerText(), words[id]);
        await resume(p, id); await shot(p, id, 'action', width, 'action'); await click(p, 'Go back'); await p.locator('[data-room-phase=allow]').waitFor(); await click(p, 'Go straight to my next step');
        await p.locator('.mr-action .xr-primary').focus(); await p.keyboard.press('Enter');
      }
      assert.equal(await p.locator('.care-rating legend').innerText(), question); await click(p, '6 of 10'); await click(p, 'Continue');
      await p.getByText('6 → 6 / 10 · You reported no change.', { exact: true }).waitFor(); const completed = await state(p); assert.equal(completed.practiceTaken, true); assert.equal(completed.actionStatus, 'planned');
      await shot(p, id, 'finish', width, 'complete');
      if (width === 390) { await storage(p, 'save'); await click(p, 'Save this card on my device'); await p.getByRole('alert').filter({ hasText: 'has not been saved' }).waitFor(); await storage(p, 'normal'); }
      await click(p, 'Save this card on my device'); await p.getByText('Saved on this device. You can find it in Return points.', { exact: true }).waitFor();
      if (width === 390) { await storage(p, 'delete'); await click(p, 'Finish'); await p.getByRole('alert').filter({ hasText: 'draft could not be cleared' }).waitFor(); assert.equal(await p.locator('[data-care-stage=complete]').count(), 1); await storage(p, 'normal'); }
      await click(p, 'Finish'); await p.locator('[data-care]').waitFor({ state: 'detached' }); assert.equal(await p.evaluate(key => localStorage.getItem(key), key), null); await click(p, 'Skip and finish');
      await p.waitForFunction(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]').length > 0);
      const sessions = await p.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]')); const encoded = JSON.stringify(sessions); assert.equal(encoded.includes(words[id]), false); assert.equal(encoded.includes(actions[id]), false);
      await p.goto(`${base}/return-points`); assert.match(await p.locator('main').innerText(), id === 'unhook' ? /opening line/ : /glass of water/); await p.getByRole('link', { name: 'Open practice and saved card', exact: true }).click(); await click(p, 'Open my saved card'); await click(p, 'Close card'); await p.locator('[data-care]').waitFor({ state: 'detached' });
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]').length), sessions.length);
      await p.goto(`${base}/return-points`); await p.getByRole('link', { name: 'Open practice and saved card', exact: true }).click(); await click(p, 'Open my saved card'); if(width===390){await storage(p,'deleteSaved');await click(p,'Delete saved card');await p.getByRole('alert').filter({hasText:'saved card could not be deleted'}).waitFor();await storage(p,'normal');} await click(p, 'Delete saved card'); await p.getByRole('button', { name: 'Begin', exact: true }).waitFor();
      // Repeat with blank ratings and an immediate stop before any report.
      await click(p, 'Begin'); await click(p, '8 of 10'); await click(p, 'Skip rating'); await click(p, id === 'unhook' ? 'Keep the words in my mind' : 'Leave the feeling unnamed'); await click(p, id === 'unhook' ? 'Stop and return to the room' : 'Too much? Return to the room');
      assert.equal((await state(p)).practiceTaken, false); await click(p, 'End practice'); await click(p, '9 of 10'); await click(p, 'Skip rating'); const stopped = await state(p); assert.equal(stopped.before, null); assert.equal(stopped.after, null); assert.equal(stopped.practiceTaken, false); await p.getByText('One or both ratings were blank, so there is no score comparison.', { exact: true }).waitFor();
      if (width === 390) { await storage(p, 'delete'); await click(p, 'Delete draft and leave'); await p.getByRole('alert').filter({ hasText: 'draft could not be deleted' }).waitFor(); await storage(p, 'normal'); await storage(p, 'draft'); await click(p, 'Practise again'); await p.getByRole('alert').filter({ hasText: 'could not save your draft' }).waitFor(); await storage(p, 'normal'); }
      // An explicit done report is separate from choosing an option or trying the practice.
      if (await p.locator('[data-care-stage=arrival]').count() === 0) await click(p, 'Practise again');
      await click(p, 'Begin'); await click(p, 'Skip rating'); await click(p, id === 'unhook' ? 'Keep the words in my mind' : 'Leave the feeling unnamed');
      if (id === 'unhook') { await p.locator('.uh-patterns button').last().click(); await click(p, 'I tried saying it this way'); await p.locator('.xr-action-choices button').first().click(); await click(p, 'Something I can see'); await click(p, 'I tried returning attention'); await click(p, 'I have done this step'); assert.equal((await state(p)).actionStatus,'done'); await click(p, 'Check in and finish'); }
      else { await click(p, 'Stay outside the feeling and choose a step'); await p.locator('.xr-action-choices button').first().click(); assert.equal((await state(p)).practiceTaken,false); await click(p, 'I have done this step'); }
      await click(p, 'Skip rating'); const done = await state(p); assert.equal(done.actionStatus,'done'); assert.equal(done.before,null); assert.equal(done.after,null); assert.equal(done.practiceTaken,id==='unhook');
      await c.close(); results.push({ id, width, explicitDone: true, sharedAlternative: true, touchTargets: true, fullJourney: true, exactWords: true, selfReportsOnly: true, stopBlankRepeat: true, interruptedBack: true, savedReturnDelete: true, storageFailures: width === 390 }); console.log('PASS', id, width);
    }
    // Genuine new-core long-input captures. New contexts prevent pagehide overwriting seeded drafts.
    for (const id of ['unhook', 'makeRoom']) for (const largeText of [false, true]) {
      const c = await b.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' }); const p = await c.newPage(); p.on('pageerror', e => errors.push(e.message));
      const notice = (id === 'unhook' ? 'I worry that everyone will judge what I say, and I may lose my place when I begin speaking. ' : 'Worry about an unresolved conversation, with uncertainty about what I want to say next. ').repeat(4).slice(0, 300);
      const fixture = { version: 1, stage: 'practice', before: null, after: null, notice, perspective: id === 'unhook' ? `My mind is predicting: “${notice}”`.slice(0, 300) : 'I can let this feeling be here.', action: id === 'unhook' ? 'Read the first sentence of the document I chose, with attention on one word at a time rather than the prediction about what might happen.' : '', actionStatus: id === 'unhook' ? 'planned' : null, practiceTaken: id === 'unhook', defusionStep: id === 'unhook' ? 2 : 0, distance: 'beside', anchorType: 'object', anchorText: 'The edge of the desk by the window, next to the notes for the task I want to return to.', anchorNoticed: false, allowance: id === 'makeRoom' ? 'small' : null, clicks: 4 };
      await p.addInitScript(({ id, fixture, largeText, key }) => { if (window.top !== window) return; localStorage.setItem('haven_onboarded', '1'); localStorage.setItem('haven.a11y.v2', JSON.stringify({ largeText, highContrast: largeText, reducedMotion: true })); localStorage.setItem(key, JSON.stringify({ interventionId: id, experience: fixture, expiresAt: Date.now() + 86400000 })); history.replaceState({ usr: { prebuilt: true, pathway: [id], direction: id === 'unhook' ? 'reset' : 'calm', intensity: null, timeMin: 3, audio: 'no' }, key: 'long', idx: 0 }, '', location.href); }, { id, fixture, largeText, key });
      await p.goto(`${base}/reset`); await click(p, 'Resume practice'); await p.locator(`[data-${id === 'unhook' ? 'unhook' : 'room'}-phase=${id === 'unhook' ? 'attention' : 'allow'}]`).waitFor(); assert.equal((await state(p)).notice, notice);
      assert.equal(await p.locator(id === 'unhook' ? '.uh-words p' : '.mr-feeling h1').innerText(), notice); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.equal(await p.locator('.xr-experience').evaluate(e => [...e.querySelectorAll('*')].every(n => getComputedStyle(n).animationName === 'none')), true);
      await shot(p, id, `long${largeText ? '-enlarged' : ''}`, 320, 'practice', id === 'unhook' ? 'attention' : 'allow');
      const main = p.locator('.xr-primary').first(); await main.focus(); assert.equal(await main.evaluate(e => document.activeElement === e), true); await p.screenshot({ path: path.join(out, `${id}-long${largeText ? '-enlarged' : ''}-action-320.png`) }); await p.keyboard.press('Enter');
      if (id === 'unhook') assert.equal((await state(p)).anchorNoticed, true); else await p.locator('[data-care-stage=action]').waitFor();
      await layout(p); results.push({ id, width: 320, largeText, longCore: true, noticeLength: notice.length, keyboardAction: true, reducedMotion: true }); await c.close(); console.log('PASS long', id, largeText);
    }
    assert.deepEqual(errors, []);
  } finally { await b.close(); fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ results, errors }, null, 2)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
