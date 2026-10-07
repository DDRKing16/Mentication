/* Run against a production preview. Playwright is environment tooling, not an app dependency. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.CARE_PREVIEW_URL||'http://localhost:5181';
const out=process.env.CARE_EVIDENCE_DIR||path.resolve('docs/handoffs/care-single-question-flow/after');
const ids=process.env.CARE_IDS?process.env.CARE_IDS.split(','):['selfCompassion','unhook','makeRoom'];
const mainIds=process.env.CARE_COMPAT_ONLY?[]:ids;
const names={selfCompassion:'Self-Compassion',unhook:'Unhook from the Thought',makeRoom:'Make Room for the Feeling'};
const words={selfCompassion:'I ruined the meeting.',unhook:"I'll freeze when I speak.",makeRoom:'Worry about the conversation'};
const action='Open the first page of my notes.';
const response='One difficult meeting is not all of me. I can repair one thing with care.';
const key='mentation.flagship.active.v1',savedKey='mentation.carePractices.saved.v1';
const click=(p,name)=>p.getByRole('button',{name,exact:true}).click();
const state=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).experience,key);
const errors=[],results=[];
fs.mkdirSync(out,{recursive:true});
async function screen(p,name){await p.locator(`[data-care-screen="${name}"]`).waitFor();}
async function check(p){
 await p.evaluate(()=>document.fonts.ready);
 assert.equal(await p.evaluate(()=>['EB Garamond','Hanken Grotesk'].every(family=>[...document.fonts].some(face=>face.family===family&&face.status==='loaded'))),true);
 assert.equal(await p.locator('h1').count(),1);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await p.locator('.cq-screen button').evaluateAll(nodes=>nodes.every(node=>{const r=node.getBoundingClientRect();return r.width>=44&&r.height>=44;})),true);
 const current=p.locator('.cq-screen'),kind=await current.getAttribute('data-screen-kind');
 assert.ok(await current.locator('.cq-choices,.cq-rating,.cq-editor').count()<=1,'Only one active answer group or editor');
 assert.ok(await current.locator('.cq-primary').count()<=1,'At most one prominent forward action');
 if(kind==='practice'){assert.equal(await current.locator('.cq-primary').count(),1);assert.equal(await current.locator('.cq-choices,.cq-rating,.cq-editor').count(),0);}
 assert.equal(await current.evaluate(e=>[...e.querySelectorAll('*')].every(node=>getComputedStyle(node).animationName==='none')),true);
}
async function capture(p,id,width,suffix){await check(p);await p.screenshot({path:path.join(out,`${id}-${suffix||await p.locator('.cq-screen').getAttribute('data-care-screen')}-${width}.png`),fullPage:true});}
async function resume(p,name){
 const previous=await state(p);await p.reload();await click(p,'Resume practice');await screen(p,name);
 const next=await state(p);for(const field of ['careScreen','careTrail','notice','perspective','action','before','after','practiceTaken','actionStatus','anchorType','anchorText','anchorNoticed','responseTone','defusionStep','distance','allowance'])assert.deepEqual(next[field],previous[field]);
 assert.equal(await p.locator(name.endsWith('-own')?'[data-care-editor]':'h1').evaluate(e=>document.activeElement===e),true);
 await check(p);
}
async function storage(p,mode){await p.evaluate(({key,savedKey,mode})=>{window.cqSet||=Storage.prototype.setItem;window.cqRemove||=Storage.prototype.removeItem;Storage.prototype.setItem=function(k,v){if((mode==='saved'||mode==='deleteSaved')&&k===savedKey||mode==='draft'&&k===key)throw Error('synthetic write failure');return window.cqSet.call(this,k,v);};Storage.prototype.removeItem=function(k){if(mode==='deleteDraft'&&k===key)throw Error('synthetic delete failure');return window.cqRemove.call(this,k);};},{key,savedKey,mode});}
async function open(p,id){await p.goto(`${base}/library`);await p.getByLabel('Search practices',{exact:true}).fill(names[id]);await p.getByRole('button').filter({hasText:names[id]}).last().click();await screen(p,'intro');await p.getByRole('button',{name:'Begin',exact:true}).click({trial:true});await p.waitForFunction(()=>document.querySelectorAll('h1').length===1);}
async function ownAction(p,id){
 await click(p,'Choose my own step');await screen(p,'action-own');
 // Typing must remain on the writing screen; no submission on the first character.
 await p.getByLabel('My useful next step',{exact:true}).fill(action);await screen(p,'action-own');assert.equal((await state(p)).actionStatus,null);
 await resume(p,'action-own');await click(p,'Use this step');await screen(p,id==='unhook'?'anchor':'status');
}
async function saveFinish(p,id,width){
 await screen(p,'save');if(width===390){await storage(p,'saved');await click(p,'Save my card on this device');await p.getByRole('alert').filter({hasText:'has not been saved'}).waitFor();await screen(p,'save');assert.equal(await p.locator('[data-care-screen=card]').count(),0);await storage(p,'normal');}
 await click(p,'Save my card on this device');await screen(p,'card');assert.equal(await p.getByText('Saved on this device. You can find it in Return points.',{exact:true}).count(),1);await capture(p,id,width,'card');
 if(width===390){await storage(p,'deleteDraft');await click(p,'Finish');await p.getByRole('alert').filter({hasText:'draft could not be cleared'}).waitFor();await screen(p,'card');await storage(p,'normal');}
 await click(p,'Finish');await p.locator('[data-care]').waitFor({state:'detached'});assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),null);await click(p,'Skip and finish');await p.waitForFunction(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length>0);
 const history=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]'));assert.equal(JSON.stringify(history).includes(words[id]),false);assert.equal(JSON.stringify(history).includes(action),false);
 await p.goto(`${base}/return-points`);await p.getByRole('link',{name:'Open practice and saved card',exact:true}).click();await click(p,'Open my saved card');await screen(p,'card');await click(p,'Close card');await p.locator('[data-care]').waitFor({state:'detached'});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length),history.length);
 await p.goto(`${base}/return-points`);await p.getByRole('link',{name:'Open practice and saved card',exact:true}).click();await click(p,'Open my saved card');await click(p,'Practice options');await screen(p,'options');
 if(width===390){await storage(p,'deleteSaved');await click(p,'Delete saved card');await p.getByRole('alert').filter({hasText:'could not be deleted'}).waitFor();await storage(p,'normal');}
 await click(p,'Delete saved card');await screen(p,'intro');assert.equal(await p.evaluate(({savedKey,id})=>JSON.parse(localStorage.getItem(savedKey))[id],{savedKey,id}),undefined);
}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [320,390])for(const id of mainIds){
  const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(`${id}/${width}: ${e.message}`));await p.addInitScript(()=>{if(window.top===window)localStorage.setItem('haven_onboarded','1');});
  await open(p,id);await capture(p,id,width,'intro');await p.getByRole('button',{name:'Begin',exact:true}).focus();await p.keyboard.press('Enter');await screen(p,'before');
  const question=await p.locator('h1').innerText();await capture(p,id,width,'before');await p.getByRole('button',{name:'6 of 10',exact:true}).focus();await p.keyboard.press('Space');await screen(p,'notice');
  await click(p,'Go back');await screen(p,'before');assert.equal(await p.getByRole('button',{name:'6 of 10',exact:true}).getAttribute('aria-pressed'),'true');await click(p,'6 of 10');
  await click(p,'Use my own words');await screen(p,'notice-own');await p.getByRole('textbox').fill(words[id]);await resume(p,'notice-own');await capture(p,id,width,'notice-own');await click(p,'Use these words');
  const afterNotice=id==='selfCompassion'?'response':id==='unhook'?'pattern':'anchor';await screen(p,afterNotice);assert.equal((await state(p)).practiceTaken,false);
  const beforeAlternative=await state(p);await click(p,'Another way');await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});for(const field of ['careScreen','notice','perspective','practiceTaken','actionStatus'])assert.deepEqual((await state(p))[field],beforeAlternative[field]);
  await capture(p,id,width,afterNotice);await resume(p,afterNotice);
  if(id==='selfCompassion'){
   await click(p,'Write a response I can believe');await p.getByLabel('A response I can believe',{exact:true}).fill(response);await resume(p,'response-own');await click(p,'Use these words');await screen(p,'tone');assert.equal((await state(p)).practiceTaken,false);await capture(p,id,width,'tone');await click(p,'Gentle');await screen(p,'say');await capture(p,id,width,'say');await resume(p,'say');await click(p,'Go back');await screen(p,'tone');assert.equal((await state(p)).perspective,response);await click(p,'Gentle');await click(p,'I tried saying these words');await screen(p,'action');assert.equal((await state(p)).practiceTaken,true);await capture(p,id,width,'action');await ownAction(p,id);
  }else if(id==='unhook'){
   await click(p,'Predicting');await screen(p,'frame');assert.equal((await state(p)).practiceTaken,false);await capture(p,id,width,'frame');await resume(p,'frame');await click(p,'I tried saying it this way');await screen(p,'action');assert.equal((await state(p)).practiceTaken,true);await capture(p,id,width,'action');await ownAction(p,id);await capture(p,id,width,'anchor');await click(p,'Something I can see');await screen(p,'return');await click(p,'Name this anchor');await p.getByLabel('My outside anchor',{exact:true}).fill('The opening line of my notes');await resume(p,'anchor-own');await click(p,'Use this anchor');await screen(p,'return');assert.equal((await state(p)).anchorNoticed,false);await capture(p,id,width,'return');await resume(p,'return');await click(p,'I tried returning attention');await screen(p,'return-next');await capture(p,id,width,'return-next');await click(p,'The thought pulled me back');await screen(p,'re-hook');await capture(p,id,width,'re-hook');await click(p,'Go back');await screen(p,'return-next');await click(p,'The thought pulled me back');await click(p,'I brought attention back');assert.equal((await state(p)).distance,'beside');assert.equal((await state(p)).after,null);await click(p,'Continue to my next step');
  }else{
   await click(p,'The surface supporting me');await screen(p,'outside');await click(p,'Name this anchor');await p.getByLabel('My outside anchor',{exact:true}).fill('My chair');await resume(p,'anchor-own');await click(p,'Use this anchor');await screen(p,'outside');await capture(p,id,width,'outside');await resume(p,'outside');await click(p,'Try a gentle moment with this anchor');await screen(p,'allow');assert.equal((await state(p)).practiceTaken,false);await capture(p,id,width,'allow');await resume(p,'allow');await click(p,'Go back');await screen(p,'outside');assert.equal((await state(p)).notice,words[id]);await click(p,'Try a gentle moment with this anchor');await click(p,'Stop and return to the room');await screen(p,'orient');await click(p,'Go back');await screen(p,'outside');assert.equal((await state(p)).allowance,null);await click(p,'Try a gentle moment with this anchor');await click(p,'I tried letting the feeling be here');await screen(p,'action');assert.equal((await state(p)).practiceTaken,true);await capture(p,id,width,'action');await ownAction(p,id);
  }
  await screen(p,'status');await capture(p,id,width,'status');assert.equal((await state(p)).actionStatus,null);await resume(p,'status');await click(p,'Keep this as my next step');await screen(p,'after');assert.equal(await p.locator('h1').innerText(),question);await click(p,'6 of 10');await screen(p,'save');assert.equal((await state(p)).actionStatus,'planned');await capture(p,id,width,'save');await saveFinish(p,id,width);
  // Repeat: clear previously selected ratings by Back → Skip, and decline before any report.
  await click(p,'Begin');await click(p,'8 of 10');await click(p,'Go back');await click(p,'Skip rating');await click(p,id==='makeRoom'?'Leave the feeling unnamed':id==='unhook'?'Keep the words in my mind':'Keep the line in my mind');
  if(id==='selfCompassion')await click(p,'Choose care without the words');else if(id==='unhook'){await click(p,'Just a thought');await click(p,'Stop and return to the room');await click(p,'Choose a next step');}else{await click(p,'Something I can see');await click(p,'Stay outside the feeling');await click(p,'Choose a next step');}
  await screen(p,'action');await click(p,'No next step for now');await click(p,'9 of 10');await click(p,'Go back');await click(p,'Skip rating');await screen(p,'save');assert.equal((await state(p)).before,null);assert.equal((await state(p)).after,null);assert.equal((await state(p)).practiceTaken,false);assert.equal((await state(p)).actionStatus,'not-now');await click(p,'Continue without saving');await screen(p,'card');assert.equal(await p.getByText('One or both ratings were blank, so there is no score comparison.',{exact:false}).count(),1);
  await click(p,'Practice options');await click(p,'Start fresh');await click(p,'Begin');await click(p,'0 of 10');await click(p,id==='makeRoom'?'Leave the feeling unnamed':id==='unhook'?'Keep the words in my mind':'Keep the line in my mind');
  if(id==='selfCompassion')await click(p,'Choose care without the words');else if(id==='unhook'){await click(p,'Just a thought');await click(p,'Stop and return to the room');await click(p,'Choose a next step');}else{await click(p,'Something I can see');await click(p,'Stay outside the feeling');await click(p,'Choose a next step');}
  await p.locator('.cq-choices button').first().click();await screen(p,'status');await click(p,'I have done this step');await click(p,'0 of 10');assert.equal((await state(p)).practiceTaken,false);assert.equal((await state(p)).actionStatus,'done');await click(p,'Continue without saving');await screen(p,'card');assert.match(await p.locator('.cq-result').innerText(),/0 → 0.*no change/);
  await click(p,'Practice options');if(width===390){await storage(p,'deleteDraft');await click(p,'Delete draft and leave');await p.getByRole('alert').filter({hasText:'could not be deleted'}).waitFor();await storage(p,'normal');await storage(p,'draft');await click(p,'Return to my practice');await p.getByRole('alert').filter({hasText:'could not save your draft'}).waitFor();await storage(p,'normal');await click(p,'Practice options');}
  await click(p,'Delete draft and leave');await p.locator('[data-care]').waitFor({state:'detached'});await c.close();results.push({id,width,fullJourney:true,singleDecision:true,keyboard:true,backAndResume:true,matchedAndBlankRatings:true,saveReturnDelete:true,declinedAndDone:true,storageFailures:width===390});console.log('PASS',id,width);
 }
 // Genuine resumed focused screens, long text, enlarged text, and short phones.
 for(const id of mainIds)for(const largeText of [false,true]){
  const c=await browser.newContext({viewport:{width:320,height:640},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  const notice=('My exact words about this moment, including a longer sentence that must remain readable. ').repeat(4).slice(0,300),careScreen=id==='selfCompassion'?'say':id==='unhook'?'return':'allow';
  const fixture={version:1,stage:'practice',careScreen,careTrail:['before','notice'],notice,perspective:id==='selfCompassion'?notice:'My mind is predicting…',action,actionStatus:null,practiceTaken:false,responseTone:'gentle',defusionStep:2,distance:'beside',anchorType:'support',anchorText:'My chair',allowance:'small',before:null,after:null};
  await p.addInitScript(({id,fixture,largeText,key})=>{if(window.top!==window)return;localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({largeText,highContrast:largeText,reducedMotion:true}));localStorage.setItem(key,JSON.stringify({interventionId:id,experience:fixture,expiresAt:Date.now()+86400000}));history.replaceState({usr:{prebuilt:true,pathway:[id],direction:id==='unhook'?'reset':'calm',timeMin:3,audio:'no'},key:'focused',idx:0},'',location.href);},{id,fixture,largeText,key});
  await p.goto(`${base}/reset`);await click(p,'Resume practice');await screen(p,careScreen);assert.equal((await state(p)).notice,notice);assert.equal(await p.getByText(notice,{exact:true}).count(),1);await capture(p,id,320,`long${largeText?'-enlarged':''}`);const primary=p.locator('.cq-primary');await primary.focus();await p.keyboard.press('Enter');assert.equal((await state(p)).practiceTaken,true);await check(p);await c.close();results.push({id,width:320,height:640,largeText,longInput:300,keyboardPractice:true});console.log('PASS long',id,largeText);
 }
 for(const id of mainIds)for(const width of [320,390]){
  const c=await browser.newContext({viewport:{width,height:640},reducedMotion:'reduce'}),p=await c.newPage();await p.addInitScript(()=>localStorage.setItem('haven_onboarded','1'));await open(p,id);await click(p,'Begin');await click(p,'Skip rating');await p.locator('.cq-choices button').first().click();
  if(id==='selfCompassion'){await p.locator('.cq-choices button').first().click();await click(p,'Gentle');}else if(id==='unhook'){await click(p,'Predicting');await click(p,'I tried saying it this way');await p.locator('.cq-choices button').first().click();await click(p,'Something I can see');}else{await click(p,'Something I can see');await click(p,'Try a gentle moment with this anchor');}
  await check(p);assert.equal(await p.locator('.cq-primary').evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0;}),true,'Normal short-phone practice action is initially visible');await capture(p,id,width,'short-phone');await c.close();results.push({id,width,height:640,primaryInitiallyVisible:true});console.log('PASS short',id,width);
 }
 // Published version-1 drafts and cards lack the new screen/history fields.
 for(const id of ids)for(const mode of ['draft','card','notice-own','action-own']){
  const saved=mode==='card';
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  const expected=mode.endsWith('-own')?mode:saved?'card':id==='selfCompassion'?'say':id==='unhook'?'frame':'allow';
  const old={version:1,stage:mode==='notice-own'?'notice':mode==='action-own'?'action':saved?'complete':'practice',notice:words[id],perspective:id==='selfCompassion'?response:'My mind is predicting…',action:saved||mode==='action-own'?action:'',actionStatus:saved?'planned':null,practiceTaken:false,responseTone:'gentle',defusionStep:id==='unhook'?1:0,distance:'near',anchorType:id==='makeRoom'?'support':null,anchorText:id==='makeRoom'?'My chair':'',allowance:id==='makeRoom'?'small':null,before:0,after:saved?0:null};
  await p.addInitScript(({id,old,saved,key,savedKey})=>{if(window.top!==window)return;localStorage.setItem('haven_onboarded','1');if(saved)localStorage.setItem(savedKey,JSON.stringify({[id]:old}));else{localStorage.setItem(key,JSON.stringify({interventionId:id,experience:old,expiresAt:Date.now()+86400000}));history.replaceState({usr:{prebuilt:true,pathway:[id],direction:id==='unhook'?'reset':'calm',timeMin:3,audio:'no'},key:'legacy',idx:0},'',location.href);}},{id,old,saved,key,savedKey});
  if(saved){await open(p,id);await click(p,'Open my saved card');}else{await p.goto(`${base}/reset`);await click(p,'Resume practice');}
  await screen(p,expected);await check(p);if(saved){const restored=await p.evaluate(({savedKey,id})=>JSON.parse(localStorage.getItem(savedKey))[id],{savedKey,id});assert.deepEqual(restored,old);assert.equal(await p.getByText(old.notice,{exact:true}).count(),1);assert.equal(await p.getByText(old.action,{exact:true}).count(),1);assert.match(await p.locator('.cq-result').innerText(),/did not mark.*tried/);assert.match(await p.locator('.cq-result').innerText(),/0 → 0.*no change/);await click(p,'Close card');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length),0);}else{const restored=await state(p);assert.equal(restored.notice,old.notice);assert.equal(restored.perspective,old.perspective);assert.equal(restored.practiceTaken,false);assert.equal(restored.before,0);assert.equal(restored.actionStatus,old.actionStatus);}await c.close();results.push({id,width:390,legacyVersion:1,saved,mode,exactWords:true,noInventedCredit:true});console.log('PASS legacy',id,mode);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({results,errors},null,2));}})().catch(error=>{console.error(error);process.exitCode=1;});
