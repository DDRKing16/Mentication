const assert=require('node:assert/strict');
module.exports=async function(browser,storageState,base,out,width){
 const results=[];
 for(const [did,label] of [['yes','Did it'],['part','Partly'],['no','Not yet']])for(const rated of [false,true]){
  const c=await browser.newContext({storageState,viewport:{width,height:width===320?568:844},reducedMotion:'reduce'}),p=await c.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/good-map');const f=p.frameLocator('iframe');
  const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('goodmap-journey-v4')).state.JST);
  const count=async n=>{assert.equal(await f.locator('[data-practice-count]').getAttribute('data-practice-count'),String(n));assert.equal(await f.locator('[data-checkpoint]').getAttribute('data-checkpoint'),String(Math.floor(n/2)));};
  await f.locator(`[data-did="${did}"]`).waitFor();await count(54);
  await f.locator(`[data-did="${did}"]`).dblclick();await count(55);
  await p.goBack();await f.locator(`[data-did="${did}"]`).waitFor();await count(55);
  await f.locator(`[data-did="${did}"]`).click();await count(55);await p.reload();await f.locator('#gmSkipFollowup').waitFor();await count(55);
  let state=await read();assert.equal(state.checkpointEvents.filter(e=>e.key==='attempt-'+state.attemptId).length,1);assert.equal(state.checkpointEvents.find(e=>e.key==='attempt-'+state.attemptId).detail,label);
  if(rated){await f.locator('[data-rating="4"]').click();await count(55);await f.locator('#jnext').click();await count(56);assert.match(await f.locator('[data-checkpoint]').innerText(),new RegExp(label));}
  else {await f.locator('#gmSkipFollowup').click();await count(55);}
  await p.reload();await f.locator('[data-helpful="skipped"]').waitFor();await count(rated?56:55);
  await f.locator('[data-checkpoint]').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/followup-${did}-${rated?'rated':'skipped'}-${width}.png`,fullPage:true});
  await f.locator('[data-helpful="skipped"]').click();await f.locator('#jnext').click();await count(rated?56:55);state=await read();assert.equal(state.log.length,1);assert.equal(state.log[0].did,did);assert.equal(state.done.length,did==='yes'?1:0);assert.deepEqual(errors,[]);
  results.push({width,did,rated,count:rated?56:55,pairs:rated?28:27,passed:true});await c.close();
 }
 return results;
};
