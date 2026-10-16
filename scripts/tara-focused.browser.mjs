import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { browserFor, key } from './tara-tactician.browser-support.mjs';
const origin = process.env.TARA_APP_ORIGIN || 'http://127.0.0.1:5220';
const evidence = process.env.TARA_EVIDENCE_DIR || 'docs/section-one-focused/scenarios';
mkdirSync(evidence, { recursive: true });
const browser = await browserFor(); const results = []; const errors = []; const requests = []; let page;
const read = () => page.evaluate(k => JSON.parse(localStorage.getItem(k))?.draft, key);
const click = async name => { await page.getByRole('button', {name, exact:true}).click(); await page.waitForTimeout(300); };
const choice = async label => { await page.getByRole('button').filter({hasText:label}).first().click(); await page.waitForTimeout(300); };
const screen = async id => {
 await page.locator(`[data-flow-screen="${id}"]`).waitFor();
 assert.equal(await page.getByRole('heading',{level:1}).count(),1);
 assert.ok(await page.locator('.tara-step fieldset').count()<=1);
 assert.ok(await page.locator('.tara-step textarea').count()<=1);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+id);
};
const capture = async name => { await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);}); await page.screenshot({path:`${evidence}/${name}.png`,fullPage:true}); };
async function open(width=390) {
 const context = await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
 await context.addInitScript(()=>{if(window!==window.top)return;localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion:true,ambientSoundscape:false}));});
 page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.postData())requests.push({url:r.url(),body:r.postData()});});
 await page.goto(origin+'/tara-tactician');await screen('entry');return context;
}
const scenarios = [
 {id:'work-boundary',width:390,situation:'Synthetic: declining extra work',event:'A conversation',challenge:'Holding a boundary',move:'Name one clear limit',own:'I can finish the report today; I cannot take another shift.',pause:'Ask for a moment',regulation:'Find three ordinary things',affirmation:'My needs count here',leave:'I need to end this meeting now. I can send my availability tomorrow.',help:'Ask my colleague Jo to help clarify the workload.',action:'Took part in all or some',result:'Part of it happened',observation:'I said the limit. The workload is unchanged.',usability:'I can use this'},
 {id:'hospital-visit',width:320,situation:'Synthetic: first hospital appointment',event:'Something unfamiliar',challenge:'Not knowing what happens',move:'Find out what comes next',own:'Ask reception which waiting area to use.',pause:'Pause where I am',regulation:'Feel what supports me',affirmation:'I do not have to do this perfectly',leave:'Tell reception I need a pause and ask where I can wait safely.',help:'Ask the receptionist to explain the next step; call my sister myself if needed.',action:'Stepped out intentionally',result:'It happened',observation:'I stepped outside after asking reception. I felt worse, not calmer.',usability:'I’m not sure yet'},
 {id:'tax-paperwork',width:390,situation:'Synthetic: starting overdue paperwork',event:'Something I need to do',challenge:'Getting started',move:'Get the first thing ready',own:'Open one envelope and put the deadline on my calendar.',pause:'Take a quiet pause',regulation:'Let one breath settle',affirmation:'I can change the pace',leave:'Put the envelope in my tray and choose a time to return.',help:'Ask the office helpline what document I need first.',action:'Did not attempt it',result:'I did not test it',observation:'I did not open it. No task completion or benefit should be recorded.',usability:'I want to adjust it'}
];
try {
 for(const s of scenarios) {
  const context=await open(s.width);await capture(s.id+'-entry');
  assert.equal(await page.locator('.tara-main img').count(),0);
  await click('Get started');await click('Before the situation');await screen('event');
  await click('Name this moment (optional)');await page.getByRole('textbox').fill(s.situation);await click('Keep this wording');
  await click(s.event);await click(s.challenge);await screen('prediction');
  assert.equal(await page.getByRole('textbox').inputValue(),'');
  await page.getByRole('textbox').fill('Synthetic private worry: I may not know how to continue.');await click('Continue');await choice(s.move);await screen('move-confirm');
  await click('Edit my move');await page.getByRole('textbox').fill('CANCELLED PRIVATE WORDS');await click('Cancel');assert.notEqual((await read()).plan.do,'CANCELLED PRIVATE WORDS');
  await click('Edit my move');await page.getByRole('textbox').fill(s.own);await click('Keep this wording');await capture(s.id+'-first-move');
  await click('Build my support plan');await choice(s.pause);await choice(s.regulation);await choice(s.affirmation);
  await screen('plan-leave');await page.getByRole('textbox').fill(s.leave);await click('Keep this step');await screen('plan-help');await page.getByRole('textbox').fill(s.help);await click('Keep this step');
  await screen('plan-check-ins');assert.match(await page.locator('.tara-step').innerText(),/do not send notifications or run in the background/);await capture(s.id+'-notification-limits');
  await click('No check-ins — practise my plan');await screen('practice-choose');await choice('Use my first move');await screen('practice-try');
  assert.deepEqual((await read()).practice.tried,[false,false]);await capture(s.id+'-rehearsal');await click('I tried this');await screen('practice-choose');
  await page.locator('.tara-step .tara-answer-choice').first().click();await page.waitForTimeout(300);await screen('practice-try');await click('I tried this');await screen('usability');await click(s.usability);await screen('ready');
  assert.deepEqual((await read()).practice.tried,[true,true]);assert.equal((await read()).supportPlan.confirmed.length,5);
  await page.locator('summary').filter({hasText:'My support plan'}).click();await capture(s.id+'-complete-plan');
  if(s.id==='work-boundary') {
   const before=(await read()).supportPlan;await click('Edit my support plan');await click('Write my own');await page.getByRole('textbox').fill('I need two minutes. I will let you know what I can do next.');await click('Keep this step');await click('Keep my first move and finish planning');await screen('ready');
   const after=(await read()).supportPlan;assert.equal(after.pause,'I need two minutes. I will let you know what I can do next.');for(const field of ['regulation','affirmation','leave','help'])assert.equal(after[field],before[field]);
  }
  await click('Save plan & leave for now');await page.waitForURL(origin+'/');await page.goto(origin+'/tara-tactician');await screen('ready');assert.equal((await read()).plan.do,s.own);
  await click('Use my plan');await screen('live');await capture(s.id+'-live');
  for(const b of await page.locator('.tara-live-actions button').all()){const box=await b.boundingBox();assert.ok(box.y+box.height<=844,'Immediate action below viewport');}
  await choice('I need a break');await screen('take-break');await capture(s.id+'-break');await click('Help me settle during the pause');await screen('regulate');await capture(s.id+'-regulate');
  await click('Choose what I need next');await choice('I need to leave');await screen('leave-support');assert.equal((await read()).actualActionConfirmed,false);assert.equal((await read()).eventStatus,'in-progress');await capture(s.id+'-exit');
  await click('Help me find support');await screen('help-support');assert.ok((await page.locator('.tara-step').innerText()).includes(s.help));await capture(s.id+'-help');
  await click('Back to my support');await click('My reminder phrase');await screen('affirmation-support');await capture(s.id+'-affirmation');await click('Back to my support');
  await click('Check in now');await click('Help me regulate');await screen('regulate');await page.reload();await screen('regulate');await click('Choose what I need next');
  assert.equal((await read()).actualActionConfirmed,false);await click('I’m finished or paused — reflect');await screen('reflect-action');
  await page.getByRole('radio',{name:s.action,exact:true}).check();assert.equal((await read()).actualActionConfirmed,false);await click('Continue');
  await page.getByRole('radio',{name:s.result,exact:true}).check();await click('Continue');await page.getByRole('textbox').fill(s.observation);await click('Continue');
  await page.getByRole('radio',{name:'Make the next attempt smaller',exact:true}).check();await click('Continue');await screen('recap');await capture(s.id+'-after');
  await page.getByRole('radio',{name:'Save a separate reflection',exact:true}).check();await click('Finish');await page.waitForURL(origin+'/');
  const sessions=await page.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')));assert.equal(sessions.length,1);assert.equal(sessions[0].intensity_end,null);assert.equal((await read()).actual,s.observation);assert.equal(sessions[0].intervention_outcome.eventStatus,s.action==='Stepped out intentionally'?'stepped-out':s.action==='Did not attempt it'?'not-attempted':'finished');
  assert.ok(!JSON.stringify(sessions).includes('Synthetic'));assert.ok(!JSON.stringify(sessions).includes(s.help));assert.ok(!JSON.stringify(sessions).includes(s.own));assert.ok(!JSON.stringify(sessions).includes(s.observation));assert.ok(!JSON.stringify(await page.evaluate(()=>history.state)).includes('Synthetic'));
  await page.goto(origin+'/tara-tactician');await screen('recap');await click('Close reflection');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')).length),1);
  results.push({scenario:s.id,status:'PASS',outcome:sessions[0].intervention_outcome,observation:s.observation});await context.close();
 }
 const longContext=await open(320);await click('Get started');await click('Before the situation');await click('Something unfamiliar');await click('Not knowing what happens');await click('Continue');await choice('Find out what comes next');await click('Build my support plan');await click('Write my own');
 const longWords='Ask the receptionist where I can wait quietly. Tell them I need a moment and ask whether I can keep my place in the queue. If the waiting room feels too busy, ask whether there is a quieter chair near the door. Keep my appointment letter with me. I can sit down and look at three ordinary things before deciding what to do next. I do not have to explain everything. If I need more time, ask what my options are and whether someone can explain the next step again.';
 await page.getByRole('textbox').fill(longWords);await click('Keep this step');await click('Keep my first move and finish planning');await click('Use my plan');await choice('I need a break');await screen('take-break');await capture('long-pause-after');
 const card=await page.locator('.tara-support-card').boundingBox();const action=await page.getByRole('button',{name:'Help me settle during the pause',exact:true}).boundingBox();
 assert.ok(card.y+card.height<=action.y,'Support words must not be covered by the sticky action');
 assert.ok(!(await page.locator('.practice-checkpoint').innerText()).includes(longWords),'Checkpoint also keeps long support wording concise');
 assert.equal((await read()).supportPlan.pause,longWords);await page.locator('.tara-support-card summary').click();assert.equal(await page.locator('.tara-support-card details p').innerText(),longWords);
 await page.reload();await screen('take-break');assert.equal((await read()).supportPlan.pause,longWords);await longContext.close();results.push({scenario:'long custom support: readable preview, complete expandable words, exact saved text',status:'PASS'});
 const context=await open(320);await click('Get started');await click('I’m in it now');await screen('live');await capture('unprepared-live');assert.equal((await read()).supportPlan.confirmed.length,0);
 await choice('I need to leave');await screen('leave-support');await capture('unprepared-safe-exit');await click('Help me find support');await screen('help-support');await capture('unprepared-help');
 await click('Back to my support');await click('Practice options');await click('Clear saved practice');await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.ok(await read());
 await click('Practice options');await click('Clear saved practice');await click('Delete practice data');await screen('entry');await page.goBack();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);await context.close();
 results.push({scenario:'unprepared support and cancel/delete',status:'PASS'});
 assert.deepEqual(errors,[]);assert.equal(requests.some(r=>JSON.stringify(r).includes('Synthetic')),false);
 writeFileSync(evidence+'/results.json',JSON.stringify({origin,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),results,errors,postRequestsObserved:requests.length,muted:true},null,2));console.log(JSON.stringify(results,null,2));
} catch(error) {if(page&&!page.isClosed()){await capture('FAILURE');writeFileSync(evidence+'/failure.txt',error.stack+'\n'+await page.locator('body').innerText());}throw error;} finally {await browser.close();}
