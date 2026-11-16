import assert from 'node:assert/strict';
const sessionKey='mentation.sessions.v1', activeKey='mentation.flagship.active.v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const button=(page,name)=>page.getByRole('button',{name,exact:true});
async function startScene(page,base) {
  await page.goto(`${base}/library`);
  await page.evaluate(({sessionKey,activeKey})=>{localStorage.setItem(sessionKey,'[]');localStorage.removeItem(activeKey);},{sessionKey,activeKey});
  await page.getByRole('textbox',{name:'Search practices and restoring activities',exact:true}).fill('Change the Scene');
  await page.getByRole('button',{name:/^Change the Scene About/}).click();
  await page.getByRole('heading',{name:'How is your mood right now?',exact:true}).waitFor();
  await button(page,'5').click();await button(page,'Continue').click();
  await page.getByLabel('Current distress',{exact:true}).selectOption('2');await button(page,'Start Change the Scene').click();
  await button(page,'Begin Change the Scene').click();
  // Actual practice confirmations, not an injected completion/token fixture.
  for(const name of ['I moved','I had some water','I spent time outside','I sent a message','I got comfortable','I chose a plan']) {
    await button(page,name).click();await page.waitForTimeout(280);
  }
  await page.getByRole('heading',{name:'Was this useful?',exact:true}).waitFor();
}
async function choose(page,target) {
  if(target==='different') {
    await button(page,'This is not helping').click();await button(page,'Use a different mechanism').click();
  } else {
    const summary=page.getByText('Explore another practice',{exact:true});
    if(!await summary.evaluate(node=>node.parentElement.open))await summary.click();
    await button(page,target==='happyBump'?'Consider Happy Bump':'Consider Dear 2100 · longer journey').click();
  }
}
async function finishGoal(page,target,reload) {
  await button(page,'Skip and finish').waitFor();
  const before=await page.evaluate(()=>history.state?.usr?.reset_completion);
  const token=before?.result?.outcome?.handoffToken;
  assert.match(token,uuid,'Real component generation must produce a secure UUID without randomUUID');
  assert.equal(before.result.navigateTo,`/scene-followup?practice=${target}&session=${token}`);
  if(reload) {
    await page.reload();await button(page,'Skip and finish').waitFor();
    const after=await page.evaluate(()=>history.state?.usr?.reset_completion);
    assert.equal(after.result.navigateTo,before.result.navigateTo,'Refresh must preserve selected destination');
    assert.equal(after.result.outcome.handoffToken,token);
  }
  await button(page,'4').click();await button(page,'Confirm rating: 4').dblclick();
  await page.waitForURL(url=>url.pathname==='/scene-followup'&&url.searchParams.get('practice')===target&&url.searchParams.get('session')===token);
  await page.getByLabel('Current distress',{exact:true}).waitFor();
  const records=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),sessionKey);
  assert.equal(records.length,1,'Repeated completion must not create duplicate sessions');
  assert.equal(records[0].intervention_outcome.handoffToken,token);assert.equal(records[0].intensity_end,4);
  assert.deepEqual(records[0].completed_pathway,['changeScene']);
  return {token,record:records[0]};
}
async function onward(page,target) {
  await page.getByLabel('Current distress',{exact:true}).selectOption('2');await button(page,'Continue').click();
  await page.getByLabel('Current setting',{exact:true}).selectOption('home');await button(page,'Continue').click();
  await page.getByLabel('Time available now',{exact:true}).selectOption('20');
  await button(page,target==='dear2100'?'Continue':'Check what fits').click();
  if(target==='dear2100') {
    await button(page,'Yes, I would like to consider it').click();await button(page,'Check what fits').click();
  }
  await page.getByRole('button',{name:/^Open /}).waitFor();
  if(target!=='different')assert(await button(page,'Open The Happy Bump').isVisible(),'Dear 2100 retains the Happy Bump prerequisite');
  assert.equal(await page.locator('html').evaluate(node=>node.scrollWidth>innerWidth+1),false,'Follow-up must fit phone width');
  await page.getByRole('button',{name:/^Open /}).click();await page.waitForURL(url=>url.pathname==='/reset');
  const entry=await page.evaluate(()=>history.state?.usr);
  assert.equal(entry.goal_baseline.value,4);assert.equal(entry.distress,2);
  if(target==='different')assert(entry.pathway.length===1&&entry.pathway[0]!=='changeScene','Different mechanism must open its actual alternative');
  else assert.deepEqual(entry.pathway,['happyBump'],'Longer journey must start Happy Bump, not bypass it');
}
export async function checkSceneHandoff(page,base) {
  await page.addInitScript(()=>{Object.defineProperty(Crypto.prototype,'randomUUID',{configurable:true,value:undefined});});
  for(const target of ['happyBump','dear2100','different'])for(const reload of [false,true]) {
    await startScene(page,base);await choose(page,target);const saved=await finishGoal(page,target,reload);
    // An exact lookup must survive more than 100 newer records and a refresh.
    if(reload) {
      await page.evaluate(({record,sessionKey})=>{
        const newer=Array.from({length:105},(_,i)=>({id:`newer-${i}`,created_date:new Date(Date.now()+i+1000).toISOString(),pathway:['boxV2']}));
        localStorage.setItem(sessionKey,JSON.stringify([...newer,record]));
      },{record:saved.record,sessionKey});
      await page.reload();await page.getByLabel('Current distress',{exact:true}).waitFor();
      assert.equal(await page.getByText('This Change the Scene check-in is no longer available.',{exact:true}).count(),0);
      const history=await page.evaluate(key=>localStorage.getItem(key),sessionKey);
      await page.evaluate(key=>localStorage.setItem(key,'{broken'),sessionKey);await page.reload();
      await page.getByRole('alert').getByText('Your saved check-in could not be read. Nothing has been removed.',{exact:true}).waitFor();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),sessionKey),'{broken');
      await page.evaluate(({key,history})=>localStorage.setItem(key,history),{key:sessionKey,history});
      await button(page,'Try reading again').click();await page.getByLabel('Current distress',{exact:true}).waitFor();
    }
    await onward(page,target);
  }
  for(const target of ['happyBump','dear2100','different'])for(const failure of ['missing','throwing']) {
    await startScene(page,base);
    const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,activeKey);
    await page.evaluate(failure=>{
      window.__sceneRandom=crypto.getRandomValues;
      Object.defineProperty(crypto,'getRandomValues',{configurable:true,value:failure==='missing'?undefined:function(){throw Error('Synthetic secure random failure');}});
    },failure);
    await choose(page,target);
    await page.getByRole('alert').getByText(/The next practice could not be prepared securely/).waitFor();
    assert.equal(await button(page,'Skip and finish').count(),0,'Secure failure must not advance completion');
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,activeKey),before,'Secure failure must retain confirmed actions');
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),sessionKey),[]);
    await page.evaluate(()=>{Object.defineProperty(crypto,'getRandomValues',{configurable:true,value:window.__sceneRandom});delete window.__sceneRandom;});
    await choose(page,target);await finishGoal(page,target,true);
  }
}
