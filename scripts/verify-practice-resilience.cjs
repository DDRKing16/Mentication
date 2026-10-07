/* Storage denial and retry checks against actual screens. No remote services. */
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.BASE_URL||'http://localhost:5176';const out=process.env.EVIDENCE_DIR||'design/three-passes/resilience';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const id of ['selfCompassion','unhook','makeRoom','happyBump','tomorrowParking']){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(id=>{localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion:true}));if(location.pathname==='/reset'&&!history.state?.usr)history.replaceState({usr:{prebuilt:true,pathway:[id],direction:'calm',audio:'no',reset_phase:'guiding',goal_baseline:{question:'How intense is it right now?',scale:'distress',left:'Calm',right:'Extreme',higherIsBetter:false,direction:'calm',min:0,max:10,value:6,answered:true}},key:'test',idx:0},'',location.href)},id);
 const p=await context.newPage();p.setDefaultTimeout(10000);const r={id,checks:[]};const click=async name=>{await p.getByRole('button',{name,exact:true}).first().click();await p.waitForTimeout(300)};
 const deny=async key=>p.evaluate(key=>{const original=Storage.prototype.setItem;window.restoreWrites=()=>{Storage.prototype.setItem=original};Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Test storage denial','QuotaExceededError');return original.call(this,k,v)}},key);
 try{await p.goto(base+'/reset');
 if(['selfCompassion','unhook','makeRoom'].includes(id)){
  await click('Begin');await click('6 of 10');await p.locator('.cq-choices button').first().click();await p.waitForTimeout(300);
  if(id==='selfCompassion'){await p.locator('.cq-choices button').first().click();await p.waitForTimeout(300);await click('I tried saying these words')}
  if(id==='unhook'){await p.locator('.cq-choices button').first().click();await p.waitForTimeout(300);await click('I tried saying it this way')}
  if(id==='makeRoom'){await click('Something I can see');await click('Try a gentle moment with this anchor');await click('I tried letting the feeling be here')}
  await click('No next step for now');await click('6 of 10');await deny('mentation.carePractices.saved.v1');await click('Save my card on this device');assert.equal(await p.locator('.cq-saved').count(),0);assert.match(await p.locator('[role=alert]').innerText(),/could not|couldn.t|not been saved|not saved/i);r.checks.push('Denied save retains card and displays honest error');await p.screenshot({path:out+'/'+id+'-denied.png',fullPage:true});await p.evaluate(()=>window.restoreWrites());await click('Save my card on this device');await p.locator('.cq-saved').waitFor();const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.carePractices.saved.v1')));assert.equal(Object.keys(saved).length,1);r.checks.push('Retry stores exactly one card');
 }else if(id==='happyBump'){
  await deny('mentation.flagship.active.v1');await click('Start');await p.getByRole('alert').waitFor();assert.match(await p.getByRole('alert').innerText(),/could not be saved/);r.checks.push('Denied draft write is visible while practice remains usable');await p.screenshot({path:out+'/'+id+'-denied.png',fullPage:true});
 }else{
  await click('It can wait');await p.getByRole('textbox',{name:'What can wait?'}).fill('A synthetic note for tomorrow');await click('Ready to put it away');await deny('mentication.tomorrowParking.records.v1');await click('Close and save');await p.locator('.tpl-alert').waitFor();assert.match(await p.locator('.tpl-alert').innerText(),/couldn’t confirm this save/);assert.match(await p.locator('[data-checkpoint]').innerText(),/draft/);r.checks.push('Denied shutter save stays a draft');await p.screenshot({path:out+'/'+id+'-denied.png',fullPage:true});await p.evaluate(()=>window.restoreWrites());await p.getByRole('button',{name:/Try again — close and save/}).click();await p.locator('.tpl-parked-preview').waitFor();r.checks.push('Retry parks retained words');
 }
 r.passed=true;
 }catch(e){r.passed=false;r.error=e.message;await p.screenshot({path:out+'/'+id+'-failure.png',fullPage:true}).catch(()=>{});}
 results.push(r);console.log(r.passed?'PASS':'FAIL',id,r.error||'');fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));await context.close();
}await browser.close();if(results.some(x=>!x.passed))process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
