/* Production browser checks. Playwright is environment tooling, not an app dependency.
 * NODE_PATH=/tmp/care-browser/node_modules node scripts/verify-care-refinements.cjs
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.CARE_PREVIEW_URL || 'http://localhost:5182';
const out = path.resolve('docs/handoffs/care-refinements/after');
const key = 'mentation.flagship.active.v1', savedKey = 'mentation.carePractices.saved.v1';
const names = {selfCompassion:'Self-Compassion',unhook:'Unhook from the Thought',makeRoom:'Make Room for the Feeling'};
const ids = process.env.CARE_IDS ? process.env.CARE_IDS.split(',') : Object.keys(names);
const results = [], errors = [];
let completed = false;
fs.mkdirSync(out,{recursive:true});
const screen = (p,s) => p.locator(`[data-care-screen="${s}"]`).waitFor();
const state = p => p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,key);
async function click(p,name) { await p.waitForTimeout(280); await p.getByRole('button',{name,exact:true}).click(); }
async function check(p) {
 await p.waitForFunction(()=>document.querySelectorAll('h1').length===1);
 await p.evaluate(()=>document.fonts.ready);
 assert.equal(await p.locator('h1').count(),1);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'no horizontal overflow');
 assert.equal(await p.locator('.cq-screen button:visible').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44;})),true,'44px targets');
 if(await p.locator('.unhook-attention').count()) assert.equal(await p.locator('.unhook-field').evaluate(e=>e.querySelector('.unhook-thought').getBoundingClientRect().bottom <= e.querySelector('.unhook-attention').getBoundingClientRect().top),true,'thought and attention do not overlap');
 if(await p.locator('.room-field').count()) assert.equal(await p.locator('.room-feeling span').evaluate(e=>e.scrollHeight <= e.clientHeight+3),true,'full feeling remains visible');
 assert.equal(await p.locator('.cq-screen').evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none')),true,'reduced motion');
}
async function capture(p,id,width,label) { await check(p); await p.screenshot({path:path.join(out,`${id}-${label}-${width}.png`),fullPage:true}); }
async function resume(p,s) {
 const prev=await state(p);await p.reload();await click(p,'Resume practice');await screen(p,s);
 assert.deepEqual(await state(p),prev,'exact draft restored');
 assert.equal(await p.locator(s.endsWith('-own')?'textarea':'h1').evaluate(e=>document.activeElement===e),true,'focus restored');
 await check(p);
}
async function open(p,id) {
 await p.goto(`${base}/library`);await p.getByLabel('Search practices',{exact:true}).fill(names[id]);
 await p.getByRole('button').filter({hasText:names[id]}).last().click();await screen(p,'intro');
}
async function context(browser,width=390,height=844) {
 const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await c.newPage();
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{if(window.top===window)localStorage.setItem('haven_onboarded','1');});return {c,p};
}
async function storage(p,mode) {
 await p.evaluate(({key,savedKey,mode})=>{window.careSet ||= Storage.prototype.setItem;window.careRemove ||= Storage.prototype.removeItem;Storage.prototype.setItem=function(k,v){if((mode==='saved'||mode==='deleteSaved')&&k===savedKey||mode==='draft'&&k===key)throw Error('synthetic failure');return window.careSet.call(this,k,v);};Storage.prototype.removeItem=function(k){if(mode==='deleteDraft'&&k===key)throw Error('synthetic failure');return window.careRemove.call(this,k);};},{key,savedKey,mode});
}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try {
 for(const width of [320,390])for(const id of ids) {
  const {c,p}=await context(browser,width);await open(p,id);await capture(p,id,width,'intro');
  await p.getByRole('button',{name:'Begin',exact:true}).focus();await p.keyboard.press('Enter');await screen(p,'before');
  await p.waitForTimeout(280);await p.getByRole('button',{name:'6 of 10',exact:true}).focus();await p.keyboard.press('Space');await screen(p,'notice');
  await click(p,'Go back');await screen(p,'before');await click(p,'6 of 10');
  await click(p,'Use my own words');await p.getByRole('textbox').fill('My private words for this moment.');await resume(p,'notice-own');await click(p,'Use these words');
  if(id==='selfCompassion') {
   await screen(p,'response');assert.doesNotMatch(await p.locator('.cq-choices').innerText(),/take responsibility|made a mistake/);
   await capture(p,id,width,'response');await click(p,'Write a response I can believe');await p.getByRole('textbox').fill('This is difficult. I can offer myself some kindness.');await click(p,'Use these words');
   await screen(p,'say');assert.equal((await state(p)).practiceTaken,false);assert.equal((await state(p)).responseRead,false);await resume(p,'say');await capture(p,id,width,'say');await click(p,'I tried saying these words');
  } else if(id==='unhook') {
   await screen(p,'frame');assert.match((await state(p)).perspective,/^I am noticing the thought/);assert.equal((await state(p)).responseConfirmed,false);assert.equal((await state(p)).practiceTaken,false);
   await capture(p,id,width,'frame');await click(p,'Name a pattern (optional)');await click(p,'Predicting');await screen(p,'frame');await resume(p,'frame');await click(p,'I tried saying it this way');
  } else {
   await screen(p,'anchor');await click(p,'The surface supporting me');await screen(p,'outside');assert.equal((await state(p)).anchorNoticed,false);assert.equal((await state(p)).practiceTaken,false);await capture(p,id,width,'outside');
   await click(p,'Name this anchor');await p.getByRole('textbox').fill('My chair');await resume(p,'anchor-own');await click(p,'Use this anchor');
   await click(p,'I noticed a detail of this anchor');await screen(p,'room-ready');assert.equal((await state(p)).anchorNoticed,true);assert.equal((await state(p)).allowance,null);assert.equal((await state(p)).practiceTaken,false);await resume(p,'room-ready');await capture(p,id,width,'room-ready');
   await click(p,'Try a gentle moment');await screen(p,'allow');await capture(p,id,width,'allow');await click(p,'Stop and return to the room');await screen(p,'orient');assert.equal((await state(p)).practiceStopped,true);assert.equal((await state(p)).allowance,null);
   await p.goBack();await screen(p,'room-ready');assert.equal((await state(p)).allowance,null);await click(p,'Try a gentle moment');await screen(p,'allow');await resume(p,'allow');await click(p,'I tried letting the feeling be here');
  }
  await screen(p,'action');assert.equal((await state(p)).practiceTaken,true);
  await click(p,'Choose my own step');await p.getByRole('textbox').fill(id==='unhook'?'Read the first line of my notes.':'Get a glass of water.');await resume(p,'action-own');await click(p,'Use this step');
  if(id==='unhook') {
   await screen(p,'return');assert.match(await p.locator('.cq-body').innerText(),/Find the line you chose/);assert.equal((await state(p)).anchorNoticed,false);await capture(p,id,width,'return');await resume(p,'return');
   await p.getByText('Other attention options',{exact:true}).click();await click(p,'Choose another anchor (optional)');await click(p,'The surface supporting me');await screen(p,'return');assert.match(await p.locator('.cq-body').innerText(),/chair, floor/);
   await click(p,'I tried returning attention');await screen(p,'status');const count=await p.locator('[aria-label="Your practice checkpoint"]').getAttribute('data-practice-count');await capture(p,id,width,'status');
   await click(p,'The thought pulled me back · try returning again');await screen(p,'re-hook');await click(p,'I brought attention back');await screen(p,'status');assert.equal(await p.locator('[aria-label="Your practice checkpoint"]').getAttribute('data-practice-count'),count,'retry does not inflate evidence');
  }
  await screen(p,'status');assert.equal((await state(p)).actionStatus,null);await click(p,'Keep this as my next step');await screen(p,'after');await click(p,'6 of 10');await screen(p,'card');assert.match(await p.locator('.cq-result').innerText(),/no change/);
  if(width===390){await storage(p,'saved');await click(p,'Save my card on this device');await p.getByRole('alert').filter({hasText:'has not been saved'}).waitFor();await storage(p,'normal');}
  await click(p,'Save my card on this device');await capture(p,id,width,'card');assert.equal((await state(p)).actionStatus,'planned');
  if(width===390){await storage(p,'deleteDraft');await click(p,'Finish');await p.getByRole('alert').filter({hasText:'could not be cleared'}).waitFor();await storage(p,'normal');}
  await p.getByRole('button',{name:'Finish',exact:true}).evaluate(b=>{b.click();b.click();});await p.locator('[data-care]').waitFor({state:'detached'});await click(p,'Skip and finish');
  const sessions=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]'));assert.equal(sessions.length,1,'finish deduplicated');assert.equal(JSON.stringify(sessions).includes('My private words'),false,'private words excluded from history');
  await p.goto(`${base}/return-points`);await p.getByRole('link',{name:'Open practice and saved card',exact:true}).click();await click(p,'Open my saved card');await screen(p,'card');await click(p,'Close card');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length),1);
  await p.goto(`${base}/return-points`);await p.getByRole('link',{name:'Open practice and saved card',exact:true}).click();await click(p,'Open my saved card');await click(p,'Practice options');
  if(width===390){await storage(p,'deleteSaved');await click(p,'Delete saved card');await p.getByRole('alert').filter({hasText:'could not be deleted'}).waitFor();await storage(p,'normal');}
  await click(p,'Delete saved card');await screen(p,'intro');assert.equal(await p.evaluate(({id,savedKey})=>JSON.parse(localStorage.getItem(savedKey))[id],{id,savedKey}),undefined);
  // Repeat, decline practice, preserve blank and worse outcomes, mark done separately.
  await click(p,'Begin');await click(p,'Skip rating');await click(p,id==='selfCompassion'?'Keep the line in my mind':id==='unhook'?'Keep the words in my mind':'Leave the feeling unnamed');
  if(id==='selfCompassion')await click(p,'Choose care without the words');
  else if(id==='unhook')await click(p,'Leave the phrase untried');
  else {await click(p,'Something I can see');await click(p,'Stay outside the feeling');await click(p,'Choose a next step');}
  await p.waitForTimeout(280);await p.locator('.cq-choices button').first().click();
  if(id==='unhook')await click(p,'Leave this return untried');await click(p,'Not now');await click(p,'Skip rating');await screen(p,'card');assert.equal((await state(p)).practiceTaken,false);assert.equal((await state(p)).actionStatus,'not-now');assert.match(await p.locator('.cq-result').innerText(),/no score comparison/);
  await click(p,'Go back');await screen(p,'after');await click(p,'9 of 10');await click(p,'Go back');await click(p,'Skip rating');assert.equal((await state(p)).after,null);
  await click(p,'Practice options');await click(p,'Start fresh');await click(p,'Begin');await click(p,'0 of 10');await click(p,id==='selfCompassion'?'Keep the line in my mind':id==='unhook'?'Keep the words in my mind':'Leave the feeling unnamed');
  if(id==='selfCompassion')await click(p,'Choose care without the words');else {if(id==='makeRoom')await click(p,'Something I can see');await click(p,id==='makeRoom'?'Stay outside the feeling':'Stop and return to the room');await click(p,'Choose a next step');}
  await p.waitForTimeout(280);await p.locator('.cq-choices button').first().click();await screen(p,'status');await click(p,'I have done this step');await click(p,'9 of 10');await screen(p,'card');assert.equal((await state(p)).practiceTaken,false);assert.equal((await state(p)).actionStatus,'done');assert.match(await p.locator('.cq-result').innerText(),/more difficulty/);
  await click(p,'Practice options');if(width===390){await storage(p,'deleteDraft');await click(p,'Delete draft and leave');await p.getByRole('alert').filter({hasText:'could not be deleted'}).waitFor();await storage(p,'normal');await storage(p,'draft');await click(p,'Return to my practice');await p.getByRole('alert').filter({hasText:'could not save your draft'}).waitFor();await storage(p,'normal');await click(p,'Practice options');}await click(p,'Delete draft and leave');await p.locator('[data-care]').waitFor({state:'detached'});await c.close();results.push({id,width,fullJourney:true,keyboard:true,refreshBackEdit:true,repeatDelete:true,saveFailures:width===390,privateHistory:true,deduplicated:true,blankUnchangedWorseUntried:true});console.log('PASS journey',id,width);
 }
 // Long unbroken input, enlarged type, keyboard, and short viewports on the real host route.
 for(const id of ids)for(const width of [320,390]) {
  const {c,p}=await context(browser,width,640);const s=id==='selfCompassion'?'say':id==='unhook'?'return':'allow';const long='PrivateLongText'.repeat(30).slice(0,300);
  await p.addInitScript(({id,s,long,key})=>{if(window.top!==window)return;localStorage.setItem('haven.a11y.v2',JSON.stringify({largeText:true,highContrast:true,reducedMotion:true}));if(!sessionStorage.getItem('fixture')){sessionStorage.setItem('fixture','1');localStorage.setItem(key,JSON.stringify({interventionId:id,expiresAt:Date.now()+86400000,experience:{version:1,stage:'practice',careScreen:s,notice:long,perspective:long,action:long,anchorType:'object',anchorNoticed:true,allowance:'small'}}));}history.replaceState({usr:{prebuilt:true,pathway:[id],direction:'calm',timeMin:3,audio:'no'},key:'care',idx:0},'',location.href);},{id,s,long,key});
  await p.goto(`${base}/reset`);await click(p,'Resume practice');await screen(p,s);await capture(p,id,width,'long-enlarged');await p.locator('.cq-primary').focus();await p.keyboard.press('Enter');assert.equal((await state(p)).practiceTaken,true);await check(p);await c.close();results.push({id,width,height:640,longText:300,enlarged:true,keyboard:true});console.log('PASS long',id,width);
 }
 // Existing version-1 drafts: migration changes navigation, never the stored reports.
 for(const [id,oldScreen,expected] of [['unhook','return-next','status'],['makeRoom','allow','outside'],['selfCompassion','say','say']]) {
  const {c,p}=await context(browser);const old={version:1,careScreen:oldScreen,stage:'practice',notice:'Exact legacy words',perspective:'Exact legacy response',action:'Read the next sentence',anchorType:'object',allowance:'small',practiceTaken:false,before:0,after:0};
  await p.addInitScript(({id,old,key})=>{localStorage.setItem(key,JSON.stringify({interventionId:id,experience:old,expiresAt:Date.now()+86400000}));history.replaceState({usr:{prebuilt:true,pathway:[id],direction:'calm',timeMin:3,audio:'no'},key:'legacy',idx:0},'',location.href);},{id,old,key});
  await p.goto(`${base}/reset`);await click(p,'Resume practice');await screen(p,expected);const restored=await state(p);assert.equal(restored.notice,old.notice);assert.equal(restored.perspective,old.perspective);assert.equal(restored.practiceTaken,false);assert.equal(restored.before,0);await check(p);await c.close();results.push({id,legacyScreen:oldScreen,resolvedScreen:expected,noInventedCredit:true});console.log('PASS legacy',id);
 }
 assert.deepEqual(errors,[]);
 completed = true;
}finally {await browser.close();fs.writeFileSync(path.join(out,process.env.CARE_IDS ? `browser-results-${process.env.CARE_IDS}.json` : 'browser-results.json'),JSON.stringify({completed,results,errors},null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
