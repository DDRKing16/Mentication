/* Targeted edits and consent recovery in the production host. Playwright is external tooling. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const key='mentation.flagship.active.v1',base=process.env.CARE_PREVIEW_URL||'http://localhost:5182';
const state=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,key);
const click=async(p,name)=>{await p.waitForTimeout(280);await p.getByRole('button',{name,exact:true}).click();};
const screen=(p,s)=>p.locator(`[data-care-screen="${s}"]`).waitFor();
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const results=[];try {
 for(const id of ['unhook','selfCompassion','makeRoom']) {
  const c=await browser.newContext({viewport:{width:320,height:640},reducedMotion:'reduce'}),p=await c.newPage();
  const fixture={version:1,stage:'practice',careScreen:id==='unhook'?'status':id==='selfCompassion'?'say':'allow',careTrail:id==='unhook'?['frame','action-own','return']:id==='selfCompassion'?['notice','response-own']:['anchor','outside','room-ready'],notice:'A private thought',noticeConfirmed:true,perspective:'Words I chose',responseConfirmed:true,responseRead:id==='selfCompassion',practiceTaken:true,defusionStep:2,action:'Read my notes',actionConfirmed:true,actionStatus:null,anchorType:'object',anchorNoticed:true,allowance:'small'};
  await p.addInitScript(({id,fixture,key})=>{localStorage.setItem('haven_onboarded','1');if(!sessionStorage.getItem('edit-fixture')){sessionStorage.setItem('edit-fixture','1');localStorage.setItem(key,JSON.stringify({interventionId:id,experience:fixture,expiresAt:Date.now()+86400000}));}history.replaceState({usr:{prebuilt:true,pathway:[id],direction:'calm',timeMin:3,audio:'no'},key:'edits',idx:0},'',location.href);},{id,fixture,key});
  await p.goto(`${base}/reset`);await click(p,'Resume practice');await screen(p,fixture.careScreen);
  if(id==='unhook') {
   await click(p,'Go back');await screen(p,'return');await click(p,'Go back');await screen(p,'action-own');await p.getByRole('textbox').fill('Listen to the fan');
   assert.equal((await state(p)).anchorNoticed,false);assert.equal((await state(p)).actionConfirmed,false);assert.equal((await state(p)).actionStatus,null);
   await click(p,'Use this step');await screen(p,'return');assert.match(await p.locator('.cq-body').innerText(),/sound you chose/);
   await p.getByText('Other attention options',{exact:true}).click();await click(p,'Name this anchor');await p.getByRole('textbox').fill('The quiet fan');await click(p,'Use this anchor');await screen(p,'return');assert.equal((await state(p)).anchorNoticed,false);assert.equal((await state(p)).anchorText,'The quiet fan');await click(p,'I tried returning attention');assert.equal((await state(p)).anchorNoticed,true);
  } else if(id==='selfCompassion') {
   await click(p,'Go back');await screen(p,'response-own');await p.getByRole('textbox').fill('New words that fit better');assert.equal((await state(p)).responseRead,false);assert.equal((await state(p)).practiceTaken,false);assert.equal((await state(p)).responseConfirmed,false);
   await click(p,'Use these words');await screen(p,'say');await click(p,'Choose care without the words');await screen(p,'action');assert.equal((await state(p)).practiceTaken,false);
  } else {
   await click(p,'Stop and return to the room');assert.equal((await state(p)).practiceStopped,true);await p.reload();await click(p,'Resume practice');await screen(p,'orient');await click(p,'Consider another gentle moment');await click(p,'Something I can hear');await screen(p,'outside');assert.equal((await state(p)).anchorNoticed,false);assert.equal((await state(p)).allowance,null);
   await click(p,'I noticed a detail of this anchor');await screen(p,'room-ready');assert.equal((await state(p)).allowance,null);await click(p,'Stay with the room instead');await screen(p,'orient');assert.equal((await state(p)).allowance,null);
  }
  results.push({id,editInvalidatesPriorConfirmation:true,exactWordsPreserved:true,explicitReentryConsent:id==='makeRoom'});await c.close();console.log('PASS edits',id);
 }
}finally{await browser.close();fs.writeFileSync('docs/handoffs/care-refinements/after/edit-results.json',JSON.stringify({results},null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
