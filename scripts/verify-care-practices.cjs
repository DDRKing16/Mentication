/* Integrated browser checks. Run Vite first; Playwright is tooling, not an app dependency.
   CARE_PREVIEW_URL=http://127.0.0.1:5174 node scripts/verify-care-practices.cjs */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.CARE_PREVIEW_URL || 'http://127.0.0.1:5174';
const evidence = process.env.CARE_EVIDENCE_DIR || '/tmp/care-redesign';
fs.mkdirSync(evidence,{recursive:true});
// Keep Self-Compassion's existing interaction regression; the two redesigned cores have their own journeys.
const IDS=['selfCompassion'];
const WIDTHS=process.env.CARE_WIDTHS ? process.env.CARE_WIDTHS.split(',').map(Number) : [320,390,430];
const NAMES={selfCompassion:'Self-Compassion',unhook:'Unhook from the Thought',makeRoom:'Make Room for the Feeling'};
const store='mentation.flagship.active.v1', savedStore='mentation.carePractices.saved.v1';
const errors=[];
const logs=[];
const note=line=>{logs.push(line);console.log(line);};
const click=(p,name)=>p.getByRole('button',{name,exact:true}).click();
async function noOverflow(p){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
async function start(p,id){
  // Exercise the real searchable Library → ResetFlow → experience route.
  await p.goto(`${base}/library`);
  await p.getByLabel('Search practices',{exact:true}).fill(NAMES[id]);
  await p.getByRole('button').filter({hasText:NAMES[id]}).last().click();
  await p.locator(`[data-care="${id}"]`).waitFor();
  // Exercise Self-Compassion with the new stylesheet present, as after visiting either redesigned practice.
  await p.addStyleTag({path:path.resolve(__dirname,'../src/components/experiential-care/experiential-care.css')});
  await p.getByRole('button',{name:'Begin',exact:true}).click({trial:true});
}
async function baseline(p,value){
  await click(p,'Begin');assert.equal(await p.locator('.care-rating [aria-pressed=true]').count(),0);
  const question=await p.locator('.care-rating legend').innerText();
  await click(p,`${value} of 10`);await click(p,'Continue');return question;
}
async function customNotice(p,id){
  await click(p,'Use my own words');
  const labels={selfCompassion:'The critical line',unhook:'The sticky thought',makeRoom:'The feeling'};
  const words={selfCompassion:'I ruined the meeting.',unhook:'They will judge my presentation.',makeRoom:'Worry'};
  await p.getByRole('textbox',{name:labels[id],exact:true}).fill(words[id]);
  await click(p,{selfCompassion:'Try a voice on my side',unhook:'Work with this thought',makeRoom:'Find a steady point nearby'}[id]);
  return words[id];
}
async function practice(p,id){
  await p.locator('.pf-core').waitFor();
  if(id==='selfCompassion'){
    await click(p,'Write a response I can believe');
    await p.getByRole('textbox',{name:'A response I can believe',exact:true}).fill('One hard meeting is not the whole of me. I can repair one thing.');
    await click(p,'Use these words');await click(p,'Gentle');
    assert.match(await p.locator('.pf-response h1').innerText(),/repair one thing/);
    assert.equal(await p.getByText('Try a tone',{exact:true}).count(),1);
  }else if(id==='unhook'){
    const exact=await p.locator('.pf-thought h1').innerText();
    await click(p,'Notice this as a thought');
    assert.equal(await p.locator('.pf-thought h1').innerText(),exact);
    assert.equal(await p.locator('h1').evaluate(e=>document.activeElement===e),true);
    await click(p,'Something I can see');await click(p,'Name what I notice');
    await p.getByLabel('An object or colour nearby',{exact:true}).fill('The blue mug');
    assert.match(await p.locator('.pf-attention').innerText(),/The blue mug/);
    assert.equal(await p.locator('.pf-thought h1').innerText(),exact);
  }else{
    assert.equal(await p.getByRole('button',{name:'A little',exact:true}).isDisabled(),true);
    await click(p,'Something I can see');await click(p,'Name it');
    await p.getByLabel('An object or colour nearby',{exact:true}).fill('The blue mug');
    const feeling=await p.locator('.pf-feeling h1').innerText();
    const before=await p.locator('.pf-feeling').boundingBox();
    const boundary=await p.locator('.pf-space-boundary').boundingBox();
    await click(p,'A little');
    const after=await p.locator('.pf-feeling').boundingBox();
    assert.equal(after.width,before.width);assert.equal(after.height,before.height);
    assert.ok((await p.locator('.pf-space-boundary').boundingBox()).width>boundary.width);
    assert.equal(await p.locator('.pf-feeling h1').innerText(),feeling);
  }
  assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience.practiceTaken,store),false);
}
async function continueAction(p){
  await p.locator('.pf-next summary').click();
  await p.getByLabel('Or my own step',{exact:true}).fill('Open the blue document');
  await p.locator('.pf-next summary').click();
  await p.locator('.pf-primary').focus();await p.keyboard.press('Enter');
}
async function patchStorage(p,mode){
  await p.evaluate(({mode,savedStore})=>{
    window.careOriginalSet ||= Storage.prototype.setItem;
    window.careOriginalRemove ||= Storage.prototype.removeItem;
    Storage.prototype.setItem=function(k,v){if(mode==='save'&&k===savedStore||mode==='draft'&&k==='mentation.flagship.active.v1'||mode==='deleteSaved'&&k===savedStore)throw Error('synthetic storage failure');return window.careOriginalSet.call(this,k,v);};
    Storage.prototype.removeItem=function(k){if(mode==='deleteDraft'&&k==='mentation.flagship.active.v1')throw Error('synthetic deletion failure');return window.careOriginalRemove.call(this,k);};
  },{mode,savedStore});
}
async function integratedCompletion(p,id){
  await click(p,'Finish');await p.locator('[data-care]').waitFor({state:'detached'});
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),store),null);
  await click(p,'Skip and finish');
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length>0);
  const sessions=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]'));
  const text=JSON.stringify(sessions[0]);
  assert.match(text,new RegExp(id));assert.equal(text.includes('I ruined the meeting.'),false);assert.equal(text.includes('They will judge my presentation.'),false);
}
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of WIDTHS)for(const id of IDS){
   const c=await b.newContext({viewport:{width,height:width===320?740:844},reducedMotion:'reduce'});const p=await c.newPage();
   await p.addInitScript(()=>{if(window.top===window)localStorage.setItem('haven_onboarded','1');});p.on('pageerror',e=>errors.push(`${id}/${width}: ${e.message}`));
   await start(p,id);await noOverflow(p);await p.screenshot({path:path.join(evidence,`${id}-after-arrival-${width}.png`),fullPage:true});
   const question=await baseline(p,0);const words=await customNotice(p,id);await practice(p,id);await noOverflow(p);
   // In-app accessibility preferences as well as OS reduced motion.
   await p.evaluate(()=>document.documentElement.classList.add('large-text','high-contrast'));await noOverflow(p);
   await p.evaluate(()=>document.documentElement.classList.remove('large-text','high-contrast'));
   assert.equal(await p.locator('[data-care]').evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none')),true);
   await p.screenshot({path:path.join(evidence,`${id}-after-practice-${width}.png`),fullPage:true});
   // Interrupted practice retains its interactive state and personal anchor, without crediting the action.
   await p.reload();await click(p,'Resume practice');
   assert.equal(await p.locator('h1').evaluate(e=>document.activeElement===e),true);
   const draft=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,store);
   assert.equal(draft.notice,words);assert.equal(draft.actionStatus,null);
   assert.equal(draft.practiceTaken,false);assert.equal(draft.responseRead,false);
   await click(p,'Another way');await p.getByRole('dialog').waitFor();
   await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});
   await continueAction(p,id);assert.equal(await p.locator('.care-rating legend').innerText(),question);
   if(width===320){await click(p,'8 of 10');await click(p,'Skip rating');}
   else{await click(p,'0 of 10');await click(p,'Continue');}
   const result=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,store);
   assert.equal(result.before,0);assert.equal(result.after,width===320?null:0);assert.equal(result.actionStatus,'planned');
   assert.match(await p.locator('.care-takeaway').innerText(),/Open the blue document/);await noOverflow(p);
   await p.screenshot({path:path.join(evidence,`${id}-after-takeaway-${width}.png`),fullPage:true});
   if(width===390){await patchStorage(p,'save');await click(p,'Save this card on my device');await p.getByRole('alert').filter({hasText:'has not been saved'}).waitFor();await patchStorage(p,'normal');}
   await click(p,'Save this card on my device');await p.getByText('Saved on this device. You can find it in Return points.',{exact:true}).waitFor();
   if(width===390){await patchStorage(p,'deleteDraft');await click(p,'Finish');await p.getByRole('alert').filter({hasText:'draft could not be cleared'}).waitFor();assert.equal(await p.locator('[data-care-stage="complete"]').count(),1);assert.notEqual(await p.evaluate(key=>localStorage.getItem(key),store),null);await patchStorage(p,'normal');}
   await integratedCompletion(p,id);
   await p.goto(`${base}/return-points`);assert.match(await p.locator('main').innerText(),/Open the blue document/);
   await p.getByRole('link',{name:'Open practice and saved card',exact:true}).click();await p.locator('[data-care]').waitFor();await click(p,'Open my saved card');
   assert.match(await p.locator('.care-takeaway').innerText(),/Open the blue document/);
   if(width===390){const count=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length);await click(p,'Close card');await p.locator('[data-care]').waitFor({state:'detached'});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length),count);await p.goto(`${base}/return-points`);await p.getByRole('link',{name:'Open practice and saved card',exact:true}).click();await click(p,'Open my saved card');await patchStorage(p,'deleteSaved');await click(p,'Delete saved card');await p.getByRole('alert').filter({hasText:'could not be deleted'}).waitFor();await patchStorage(p,'normal');}
   await click(p,'Delete saved card');assert.equal(await p.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key))[id],{key:savedStore,id}),undefined);
   // Repeat, with both ratings blank and explicit decline. Native keyboard activation remains usable.
   await p.getByRole('button',{name:'Begin',exact:true}).focus();await p.keyboard.press('Enter');await click(p,'Skip rating');
   await click(p,{selfCompassion:'Keep the line in my mind',unhook:'Keep the words in my mind',makeRoom:'Leave the feeling unnamed'}[id]);
   await click(p,{selfCompassion:'Choose care without the words',unhook:'Return to the room',makeRoom:'Too much? Return to the room'}[id]);
   if(id!=='selfCompassion')await click(p,'Choose a next step');
   await click(p,'No next step for now');await click(p,'Skip rating');
   const repeat=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,store);
   assert.equal(repeat.before,null);assert.equal(repeat.after,null);assert.equal(repeat.practiceTaken,false);assert.equal(repeat.actionStatus,'not-now');
   await click(p,'Practise again');await click(p,'Begin');await p.getByRole('button',{name:'10 of 10',exact:true}).focus();await p.keyboard.press('Space');
   assert.equal(await p.getByRole('button',{name:'10 of 10',exact:true}).getAttribute('aria-pressed'),'true');
   if(width===390){
    await patchStorage(p,'deleteDraft');await p.getByRole('button',{name:'Delete draft and leave',exact:true}).last().click();await p.getByRole('alert').filter({hasText:'draft could not be deleted'}).waitFor();await patchStorage(p,'normal');
    await patchStorage(p,'draft');await click(p,'Continue');await p.getByRole('alert').filter({hasText:'could not save your draft'}).waitFor();await patchStorage(p,'normal');
   }
   if(width!==390)await click(p,'Continue');
   await click(p,{selfCompassion:'Keep the line in my mind',unhook:'Keep the words in my mind',makeRoom:'Leave the feeling unnamed'}[id]);
   await click(p,{selfCompassion:'Choose care without the words',unhook:'Return to the room',makeRoom:'Too much? Return to the room'}[id]);
   if(id!=='selfCompassion')await click(p,'Choose a next step');
   await p.locator('.care-action-choices button').first().click();await click(p,'I have done this step');await click(p,'Skip rating');
   const done=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,store);assert.equal(done.actionStatus,'done');assert.equal(done.practiceTaken,false);
   if(width===390&&id==='makeRoom'){
    await click(p,'Practise again');await click(p,'Begin');await click(p,'Skip rating');await click(p,'Leave the feeling unnamed');
    await p.locator('.pf-next summary').click();await p.getByLabel('Or my own step',{exact:true}).fill('Get water while staying connected to the room');await p.locator('.pf-next summary').click();await p.locator('.pf-primary').click();await click(p,'Skip rating');
    const roomOnly=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,store);assert.equal(roomOnly.practiceTaken,false);assert.equal(roomOnly.actionStatus,'planned');assert.equal(roomOnly.allowance,null);
   }
   await click(p,'Delete draft and leave');await p.locator('[data-care]').waitFor({state:'detached'});assert.equal(await p.evaluate(key=>localStorage.getItem(key),store),null);
   await c.close();note(`PASS ${id} ${width}px: library entry, personal interaction, matched/blank ratings, resume, alternatives, save/return/delete, repeat, stopped/done/planned truthfulness, keyboard, reduced motion, large text, high contrast${width===390?', storage failures/retries':''}`);
  }
  assert.deepEqual(errors,[]);
 }finally{await b.close();fs.writeFileSync(path.join(evidence,'browser-checks.txt'),logs.join('\n')+'\n');}
})().then(()=>{
 const result=require('node:child_process').spawnSync(process.execPath,[path.join(__dirname,'verify-experiential-care.cjs')],{stdio:'inherit',env:{...process.env,CARE_PREVIEW_URL:base,CARE_EVIDENCE_DIR:path.join(evidence,'experiential')}});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(`Experiential care checks exited ${result.status}`);
}).catch(e=>{console.error(e);process.exitCode=1;});
