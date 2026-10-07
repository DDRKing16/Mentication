import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { browserFor, captureFor, key } from './tara-tactician.browser-support.mjs';
const origin = process.env.TARA_APP_ORIGIN || 'http://127.0.0.1:5220';
const production = process.env.TARA_PRODUCTION === '1';
const evidence = process.env.TARA_EVIDENCE_DIR || 'design/tara-tactician/live-support/verification';
mkdirSync(evidence, { recursive: true });
const browser = await browserFor(); const captures = []; const passed = []; const errors = [];
const take = captureFor(evidence, captures); const contexts = [];
const draft = page => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.draft, key);
const exact = (page, name) => page.getByRole('button', { name, exact: true });
const click = async (page, name) => { await exact(page, name).click(); await page.waitForTimeout(280); };
const choice = async (page, name) => { const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); await page.getByRole('button', { name: new RegExp('^' + escaped) }).click(); await page.waitForTimeout(280); };
async function screen(page, id) {
  await page.locator(`[data-flow-screen="${id}"]`).waitFor();
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
  assert.ok(await page.locator('.tara-step textarea').count() <= 1, 'One question per screen');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal overflow');
}
async function open(width = 390, setup) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' }); contexts.push(context);
  await context.addInitScript(() => { if (window !== window.top) return; localStorage.setItem('haven_onboarded', '1'); localStorage.setItem('haven.a11y.v2', JSON.stringify({ reducedMotion: true, ambientSoundscape: false })); });
  if (setup) await context.addInitScript(setup);
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + (production ? '/tara-tactician' : '/design/tara-tactician/preview.html')); await screen(page, 'entry');
  return page;
}
async function firstMove(page) {
  await click(page, 'Get started'); await screen(page, 'timing');
  assert.equal(await page.locator('[data-checkpoint]').count(), 0, 'Navigation does not earn checkpoint');
  await click(page, 'Before the situation'); await screen(page, 'event');
  assert.equal(await page.locator('[data-checkpoint]').count(), 0, 'One progress action is not a checkpoint');
  await click(page, 'Name this moment (optional)'); await page.getByRole('textbox', { name: 'Name this moment', exact: true }).fill('A difficult conversation about extra work'); await click(page, 'Keep this wording');
  await click(page, 'A conversation'); await screen(page, 'challenge');
  assert.equal(await page.locator('[data-checkpoint="1"]').count(), 1, 'Two actual choices reveal a meaningful checkpoint');
  await click(page, 'Holding a boundary'); await screen(page, 'prediction');
  assert.equal(await page.getByRole('textbox').inputValue(), '', 'No assumed worry');
  await page.getByRole('textbox').fill('They may disagree with my boundary.'); await click(page, 'Continue'); await screen(page, 'move');
  await choice(page, 'Name one clear limit'); await screen(page, 'move-confirm');
}
async function plan(page, width) {
  await firstMove(page); await click(page, 'Build my support plan'); await screen(page, 'plan-pause');
  await take(page, `01-plan-pause-${width}`);
  await choice(page, 'Pause where I am'); await screen(page, 'plan-regulation'); await take(page, `02-plan-regulation-${width}`);
  await choice(page, 'Find three ordinary things'); await screen(page, 'plan-affirmation'); await take(page, `03-plan-affirmation-${width}`);
  await choice(page, 'My needs count here'); await screen(page, 'plan-leave'); await take(page, `04-plan-leave-${width}`);
  await page.getByRole('textbox').fill('If safe, end the conversation. Otherwise pause in place and ask for help.'); await click(page, 'Keep this step'); await screen(page, 'plan-help');
  await page.getByRole('textbox').fill('Ask my colleague for help with one next step.'); await click(page, 'Keep this step'); await screen(page, 'plan-check-ins');
  assert.ok((await page.locator('.tara-step').innerText()).includes('do not send notifications or run in the background'));
  await take(page, `05-browser-check-ins-${width}`); await click(page, 'Check in every 20 minutes'); await screen(page, 'check-in-duration');
  assert.equal((await draft(page)).checkIns.startedAt, 0, 'Choosing cadence never activates a reminder');
  await click(page, '60 minutes'); await screen(page, 'practice-choose');
  await choice(page, 'Use my first move'); await screen(page, 'practice-try');
  assert.deepEqual((await draft(page)).practice.tried, [false, false]);
  await click(page, 'I tried this'); await screen(page, 'practice-choose'); await choice(page, 'Repeat the limit'); await click(page, 'I tried this'); await screen(page, 'usability'); await click(page, 'I can use this'); await screen(page, 'ready');
  await take(page, `06-pocket-plan-${width}`);
  assert.equal((await draft(page)).supportPlan.confirmed.length, 5);
  await click(page, 'Save plan & leave for now');
  if (production) await page.waitForURL(origin + '/');
  await page.goto(origin + (production ? '/tara-tactician' : '/design/tara-tactician/preview.html')); await screen(page, 'ready');
  assert.equal((await draft(page)).situation, 'A difficult conversation about extra work');
  await click(page, 'Use my plan'); await screen(page, 'live'); await take(page, `07-live-${width}`);
}
async function reflect(page, action, result, save) {
  await click(page, 'I’m finished or paused — reflect'); await screen(page, 'reflect-action');
  assert.equal((await draft(page)).actualActionConfirmed, false);
  await page.getByRole('radio', { name: action, exact: true }).check(); await click(page, 'Continue'); await screen(page, 'reflect-prediction');
  await page.getByRole('radio', { name: result, exact: true }).check(); await click(page, 'Continue'); await screen(page, 'reflect-observation');
  await page.getByRole('textbox').fill('I paused and asked for help. I am still uncertain about the rest.'); await click(page, 'Continue'); await screen(page, 'next-step');
  assert.equal((await draft(page)).learning, '');
  await click(page, 'Continue'); await screen(page, 'recap');
  await page.getByRole('radio', { name: save ? 'Save a separate reflection' : 'Finish without a separate saved reflection', exact: true }).check();
}
try {
  for (const width of [390, 320]) {
    const page = await open(width); await plan(page, width);
    const quick = page.locator('.tara-live-actions button'); assert.equal(await quick.count(), 3);
    for (const button of await quick.all()) { const box = await button.boundingBox(); assert.ok(box.y + box.height < 844, 'Three immediate support actions visible'); assert.ok(box.height >= 44); }
    await choice(page, 'I need a break'); await screen(page, 'take-break'); await take(page, `08-break-${width}`);
    assert.equal((await draft(page)).eventStatus, 'in-progress'); await page.goBack(); await screen(page, 'live'); await choice(page, 'Help me regulate'); await screen(page, 'regulate'); await take(page, `09-regulate-${width}`);
    await page.reload(); await screen(page, 'regulate'); assert.ok((await draft(page)).supportPlan.regulation.includes('three ordinary'));
    assert.equal(await page.locator('.tara-grounding-orb').evaluate(el => getComputedStyle(el).animationName), 'none');
    await click(page, 'Choose what I need next'); await screen(page, 'live'); await choice(page, 'I need to leave'); await screen(page, 'leave-support'); await take(page, `10-leave-${width}`);
    assert.equal((await draft(page)).eventStatus, 'in-progress', 'Looking at exit help never records leaving');
    assert.equal((await draft(page)).actualActionConfirmed, false);
    await click(page, 'Help me find support'); await screen(page, 'help-support'); await take(page, `11-help-${width}`); await click(page, 'Back to my support');
    await click(page, 'My reminder phrase'); await screen(page, 'affirmation-support'); await take(page, `12-affirmation-${width}`); await click(page, 'Back to my support');
    await click(page, 'Check in now'); await screen(page, 'check-in'); await take(page, `13-check-in-${width}`); await click(page, 'I need a break'); await screen(page, 'take-break');
    assert.equal((await draft(page)).checkIns.lastAnswer, 'break'); assert.equal((await draft(page)).actualActionConfirmed, false);
    await click(page, 'Back to my support'); await click(page, 'Turn check-ins off'); assert.equal((await draft(page)).checkIns.preference, 'off');
    await reflect(page, width === 390 ? 'Stepped out intentionally' : 'I’m not sure yet', width === 390 ? 'It did not happen' : 'I’m not sure yet', width === 390); await take(page, `14-reflection-${width}`); await click(page, 'Finish');
    if (production) {
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]').length === 1);
      const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1')));
      assert.equal(sessions[0].intensity_end, null); assert.equal(sessions[0].intervention_outcome.eventStatus, width === 390 ? 'stepped-out' : 'unknown');
      assert.equal(JSON.stringify(sessions).includes('colleague'), false); assert.equal(JSON.stringify(sessions).includes('boundary'), false);
    } else await page.getByText('Review flow finished.', { exact: true }).waitFor();
    await page.goto(origin + (production ? '/tara-tactician' : '/design/tara-tactician/preview.html')); await screen(page, 'recap'); await click(page, 'Close reflection');
    const count = production ? await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1')).length) : await page.evaluate(() => window.taraReviewEvents.filter(event => event.outcome).length);
    assert.equal(count, production ? 1 : 0, 'Revisit records no duplicate completion');
    passed.push(`${width}px full before/during/after: two-action checkpoints, five chosen steps, optional check-ins, two explicit practice tries, save/leave/resume, three immediate support buttons, Back/refresh, no inferred leaving or benefit, explicit outcome, archive choice, no duplicate/private host outcome`);
  }
  if (!production) {
    const page = await open(); await click(page, 'Get started'); await click(page, 'I’m in it now'); await screen(page, 'live');
    assert.equal((await draft(page)).situation, ''); assert.equal((await draft(page)).checkIns.preference, 'off');
    await choice(page, 'I need to leave'); await screen(page, 'leave-support'); assert.ok((await page.locator('.tara-step').innerText()).includes('If it is not, reduce the demand or seek help where you are.'));
    passed.push('Unprepared live access: immediate support, empty situation, no reminders, safe alternative if leaving is impossible');
    for (const status of ['denied', 'error', 'unverified', 'ended']) {
      const next = await draft(page); next.phase = 'tackle'; next.flowScreen = 'live'; next.checkIns = { ...next.checkIns, preference: 'device', status, startedAt: Date.now(), endsAt: Date.now() + 3600000, nextAt: Date.now() + 1200000 };
      await page.evaluate(({key,next}) => localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, draft: next, recaps: [] })), {key,next}); await page.reload(); await screen(page, 'live');
      assert.ok((await page.locator('.tara-check-in-status').innerText()).includes(status === 'denied' ? 'not granted' : status === 'ended' ? 'window has ended' : 'not confirmed'));
      await click(page, 'Check in now'); await screen(page, 'check-in'); await click(page, 'I’m okay for now'); await screen(page, 'live');
      passed.push(`${status} persisted notification status: honest limitation and usable in-app check-in; no physical-device delivery claimed`);
    }
    const denied = await draft(page); denied.checkIns = {...denied.checkIns,preference:'in-app',status:'in-app',startedAt:Date.now()-35*60000,endsAt:Date.now()+25*60000,nextAt:Date.now()-15*60000};
    await page.evaluate(({key,next})=>localStorage.setItem(key,JSON.stringify({schemaVersion:1,draft:next,recaps:[]})),{key,next:denied}); await page.reload(); await screen(page,'live'); await exact(page,'My check-in is ready').waitFor(); await click(page,'My check-in is ready'); await click(page,'I’m okay for now');
    assert.ok((await draft(page)).checkIns.nextAt > Date.now()); assert.equal(await exact(page,'My check-in is ready').count(),0);
    passed.push('Elapsed-time return offers one overdue check-in and advances to next future slot without catch-up barrage');
    await page.evaluate(() => document.documentElement.style.fontSize='24px'); await screen(page,'live'); await choice(page,'Help me regulate'); await screen(page,'regulate'); await take(page,'15-large-text'); await click(page,'Choose what I need next');
    const blocked = await open(390, () => { const original = Storage.prototype.setItem; window.blockTara = true; Storage.prototype.setItem = function(k,value) { if(k==='mentation.tara-tactician.v1' && window.blockTara) throw new Error('quota'); return original.call(this,k,value); }; });
    await click(blocked,'Get started'); await click(blocked,'I’m in it now'); await screen(blocked,'live'); assert.ok((await blocked.locator('.tara-footer').innerText()).includes('not confirmed saved'));
    await choice(blocked,'I need a break'); await screen(blocked,'take-break'); await click(blocked,'Back to my support'); await blocked.evaluate(()=>window.blockTara=false); await click(blocked,'Try saving again'); assert.equal((await draft(blocked)).eventStatus,'in-progress');
    await click(blocked,'Practice options'); await click(blocked,'Clear saved practice'); await exact(blocked,'Delete practice data').focus(); await blocked.keyboard.press('Escape'); assert.equal(await blocked.getByRole('dialog').count(),0);
    await click(blocked,'Practice options'); await click(blocked,'Clear saved practice'); await click(blocked,'Delete practice data'); await screen(blocked,'entry'); assert.equal(await blocked.evaluate(key=>localStorage.getItem(key),key),null);
    passed.push('Quota failure retains immediate help; explicit retry confirms save; dialog Escape and verified full deletion');
    const archive = await open(); await firstMove(archive); await click(archive,'Use my first move without practising'); await click(archive,'Use my plan'); await reflect(archive,'Did not attempt it','I did not test it',true);
    await archive.evaluate(()=>{const write=Storage.prototype.setItem;window.failArchive=true;Storage.prototype.setItem=function(k,value){if(k==='mentation.tara-tactician.v1'&&window.failArchive&&JSON.parse(value).recaps.length)throw new Error('archive quota');return write.call(this,k,value);};});
    await click(archive,'Finish'); await screen(archive,'recap'); assert.equal(await archive.evaluate(()=>window.taraReviewEvents.filter(e=>e.outcome).length),0);
    await archive.evaluate(()=>window.failArchive=false); await click(archive,'Finish'); await archive.getByText('Review flow finished.',{exact:true}).waitFor();
    passed.push('Unpractised plan and not-attempted/not-tested outcome; archive failure blocks completion until successful retry');
    const base = await draft(page);
    for (const [action, result] of [['Took part in all or some','It happened'], ['Stepped out intentionally','Part of it happened'], ['Did not attempt it','I did not test it'], ['I’m not sure yet','I’m not sure yet'], ['Took part in all or some','It did not happen']]) {
      const sample = { ...base, id: crypto.randomUUID(), phase:'tackle',flowScreen:'live', eventStatus:'in-progress', actualActionConfirmed:false, completionReported:false, prediction:'My own worry to test.', predictionResult:'', actionChoice:'', saved:false, savePreference:'', carryChoice:'', nextStep:'', checkIns:{...base.checkIns, preference:'off',status:'off',startedAt:0,nextAt:0} };
      await page.evaluate(({key,sample})=>localStorage.setItem(key,JSON.stringify({schemaVersion:1,draft:sample,recaps:[]})),{key,sample}); await page.reload(); await screen(page,'live');
      await reflect(page,action,result,false); await click(page,'Finish');
      const outcome = await page.evaluate(()=>window.taraReviewEvents.find(e=>e.outcome)?.outcome);
      assert.ok(outcome); assert.ok(['finished','stepped-out','not-attempted','unknown'].includes(outcome.eventStatus));
      assert.equal(Object.hasOwn(outcome,'supportPlan'),false); assert.equal(JSON.stringify(outcome).includes('colleague'),false);
      passed.push(`Explicit actual action and prediction-result branch: ${action}; ${result}`);
    }
    const fresh = await open(); await firstMove(fresh); await click(fresh,'Build my support plan'); await choice(fresh,'Pause where I am'); await fresh.getByRole('button',{name:'Write my own',exact:true}).click(); await fresh.getByRole('textbox').fill('A custom, unfinished grounding step.'); await click(fresh,'Keep this step'); await fresh.reload(); await screen(fresh,'plan-affirmation');
    assert.equal((await draft(fresh)).supportPlan.regulation,'A custom, unfinished grounding step.'); await fresh.goBack(); await screen(fresh,'plan-regulation');
    await fresh.evaluate(key=>{localStorage.removeItem(key);dispatchEvent(new CustomEvent('mentation:sessions-changed'));},key); await screen(fresh,'entry'); await fresh.goBack(); await screen(fresh,'entry');
    passed.push('Own wording survives interrupted planning, refresh and Back; app-wide clear cannot resurrect draft through history');
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${evidence}/results.json`, JSON.stringify({ production, base: '0561c90e538298023c583654a23db8834f6eed2d', passed, pageErrors: errors, captures, provenance: 'Synthetic user-authored examples and explicit choices. No real user outcomes, notifications or contacts. Native permission/scheduling verified separately with mocked approved adapter; physical OS delivery not tested.' }, null, 2));
  console.log(JSON.stringify({passed:passed.length,scenarios:passed,pageErrors:errors,captures:captures.length},null,2));
} finally { await Promise.all(contexts.map(context=>context.close())); await browser.close(); }
