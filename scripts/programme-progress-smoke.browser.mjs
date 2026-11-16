import assert from 'node:assert/strict';
const sessionKey='mentation.sessions.v1', programmeKey='mentation.programmes.v1';
const programmeId='calmer-seven', start='2026-11-13T08:00:00Z', now='2026-11-16T12:00:00Z';
const record=(id,date,practice,reason='completed')=>({id,created_date:date,pathway:[practice],completed_pathway:reason==='completed'?[practice]:[],attempts:[{intervention_id:practice,exit_reason:reason,completed_percentage:reason==='completed'?1:reason==='exited'?.3:0}]});
async function seed(page, records, store = {[programmeId]:{startedAt:start}}) {
  await page.evaluate(({records,store,sessionKey,programmeKey})=>{
    localStorage.setItem(sessionKey,JSON.stringify(records));localStorage.setItem(programmeKey,JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('mentation:sessions-changed'));window.dispatchEvent(new CustomEvent('mentation:programmes-changed'));
  },{records,store,sessionKey,programmeKey});
}
export async function checkProgrammeProgress(page,base) {
  await page.clock.setFixedTime(new Date(now));
  await page.goto(`${base}/programmes/${programmeId}`);
  const skipped=record('skip','2026-11-13T10:00:00Z','boxV2','skipped');
  await seed(page,[skipped]);await page.getByRole('button',{name:'Start day 1',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Start day 2',exact:true}).count(),0);
  await seed(page,[record('early','2026-11-13T10:00:00Z','boxV2','exited')]);
  await page.getByRole('button',{name:'Start day 1',exact:true}).waitFor();
  const complete=record('done','2026-11-13T10:00:00Z','boxV2');
  const recent=Array.from({length:205},(_,i)=>record(`noise-${i}`,'2026-11-15T10:00:00Z','happyBump','skipped'));
  await seed(page,[...recent,complete]);await page.getByRole('button',{name:'Start day 2',exact:true}).waitFor();
  await page.locator('li[aria-label="Day 1, done"]').waitFor();
  await page.reload();await page.getByRole('button',{name:'Start day 2',exact:true}).waitFor();
  await page.goto(`${base}/programmes`);await page.getByText('1 of 7 days · in progress',{exact:true}).waitFor();
  await page.goto(base);
  const home=page.frameLocator('iframe[title="MentiCation home"]');
  await home.locator('.week-day[data-day="0"][aria-label="Day 1, completed"]').waitFor();
  await home.locator('.week-day[data-day="1"][aria-current="step"]').waitFor();
  await home.getByRole('button',{name:'Begin',exact:true}).click();
  await page.waitForURL(/\/reset$/);
  assert.deepEqual(await page.evaluate(()=>history.state?.usr?.pathway),['grounding54321V2'],'Home must launch real next day using older retained completion');

  // A stale legacy finished marker cannot hide corrected progress on Home.
  await page.goto(base);await seed(page,[skipped],{[programmeId]:{startedAt:start,finishedAt:'2026-11-15T10:00:00Z'}});
  await home.locator('.week-day[data-day="0"][aria-current="step"]').waitFor();
  assert.equal(await home.locator('.week-day.is-complete').count(),0);

  // Corrupt session or programme data never unlocks a guessed day or resets a start.
  await page.goto(`${base}/programmes/${programmeId}`);
  for(const key of [sessionKey,programmeKey]) {
    await seed(page,[complete]);
    await page.evaluate(key=>{localStorage.setItem(key,'{broken');window.dispatchEvent(new Event('focus'));},key);
    await page.getByRole('alert').getByText('Programme progress could not be checked. Nothing has been replaced.',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:/^Start day /}).count(),0);
    assert.equal(await page.getByRole('button',{name:'Start this programme',exact:true}).count(),0);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{broken');
    await seed(page,[complete]);await page.getByRole('button',{name:'Start day 2',exact:true}).waitFor();
  }
  // Failed metadata write reports uncertainty and never navigates into a guessed start.
  await seed(page,[],{});
  await page.getByRole('button',{name:'Start this programme',exact:true}).waitFor();
  await page.evaluate(key=>{window.__programmeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)return;return window.__programmeSet.call(this,k,v);};},programmeKey);
  await page.getByRole('button',{name:'Start this programme',exact:true}).click();
  await page.getByRole('alert').getByText(/The programme start could not be confirmed/).waitFor();
  assert.equal(await page.getByRole('button',{name:'Start day 1',exact:true}).count(),0);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__programmeSet;delete window.__programmeSet;});
  await page.getByRole('button',{name:'Start this programme',exact:true}).click();
  await page.getByRole('button',{name:'Start day 1',exact:true}).waitFor();
  await page.getByRole('button',{name:'Leave this programme',exact:true}).click();
  await page.getByRole('button',{name:'Start this programme',exact:true}).waitFor();
  // A write may persist even though its verification read fails. Repeated Start
  // and Leave must refresh the verified snapshot instead of stranding stale UI.
  async function failNextVerification() {
    await page.evaluate(key=>{
      const get=Storage.prototype.getItem,set=Storage.prototype.setItem;let verify=false;
      window.__restoreProgrammeStorage=()=>{Storage.prototype.getItem=get;Storage.prototype.setItem=set;};
      Storage.prototype.setItem=function(k,v){const result=set.call(this,k,v);if(k===key)verify=true;return result;};
      Storage.prototype.getItem=function(k){if(k===key&&verify){verify=false;throw Error('synthetic verification failure');}return get.call(this,k);};
    },programmeKey);
  }
  async function recoverStorage() { await page.evaluate(()=>{window.__restoreProgrammeStorage();delete window.__restoreProgrammeStorage;}); }
  await failNextVerification();
  await page.getByRole('button',{name:'Start this programme',exact:true}).click();
  await page.getByRole('alert').getByText(/The programme start could not be confirmed/).waitFor();
  const savedStart=await page.evaluate(key=>JSON.parse(localStorage.getItem(key))['calmer-seven'].startedAt,programmeKey);
  await recoverStorage();
  await page.getByRole('button',{name:'Start this programme',exact:true}).click();
  await page.getByRole('button',{name:'Start day 1',exact:true}).waitFor();
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))['calmer-seven'].startedAt,programmeKey),savedStart);
  await failNextVerification();
  await page.getByRole('button',{name:'Leave this programme',exact:true}).click();
  await page.getByRole('alert').getByText(/Leaving the programme could not be confirmed/).waitFor();
  await recoverStorage();
  await page.getByRole('button',{name:'Leave this programme',exact:true}).click();
  await page.getByRole('button',{name:'Start this programme',exact:true}).waitFor();

  // Actual completion retains next-calendar-day gating and all seven days can finish.
  await seed(page,[record('today','2026-11-16T10:00:00Z','boxV2')]);
  await page.getByText("Today's done. Day 2 opens tomorrow.",{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:/^Start day /}).count(),0);
  const ids=['boxV2','grounding54321V2','progressive-muscle-relaxation-v2','factCheck','boxV2','urgeSurf','progressive-muscle-relaxation-v2'];
  const full=ids.map((id,i)=>record(`day-${i}`,`2026-11-${String(9+i).padStart(2,'0')}T10:00:00Z`,id));
  await page.evaluate(key=>{window.__programmeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key&&JSON.parse(v)['calmer-seven']?.finishedAt)throw Error('synthetic quota');return window.__programmeSet.call(this,k,v);};},programmeKey);
  await seed(page,full,{[programmeId]:{startedAt:'2026-11-08T08:00:00Z'}});
  await page.getByText('You finished it. Well done.',{exact:true}).waitFor();
  await page.getByRole('alert').getByText(/Your completion could not be confirmed/).waitFor();
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key))['calmer-seven'].finishedAt,programmeKey),undefined);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__programmeSet;delete window.__programmeSet;});
  await page.getByRole('button',{name:'Try programme state again',exact:true}).click();
  await page.waitForFunction(key=>Boolean(JSON.parse(localStorage.getItem(key))['calmer-seven'].finishedAt),programmeKey);
  assert.equal(await page.locator('li[aria-label$=", done"]').count(),7);
  await page.reload();await page.getByText('You finished it. Well done.',{exact:true}).waitFor();
  assert.equal(await page.locator('html').evaluate(node=>node.scrollWidth>innerWidth+1),false);
}
