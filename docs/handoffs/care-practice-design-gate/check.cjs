const {chromium}=require('playwright');
const fs=require('fs');const out=__dirname;
const base={version:1,stage:'practice',before:6,after:null,notice:'',perspective:'',action:'',clicks:1,practiceTaken:false,actionStatus:null,responseRead:false,responseTone:'steady',defusionStep:0,distance:'near',anchorType:null,anchorText:'',anchorNoticed:false,allowance:null,attentionFocused:false};
const fixtures={selfCompassion:{notice:'I messed everything up.',action:'Take one small step to repair what I can'},unhook:{notice:'They will judge my presentation.',action:'Read the next sentence'},makeRoom:{notice:'Worry',action:'Get a glass of water'}};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const checks=[];
for(const id of Object.keys(fixtures)){
 const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({id,state})=>{if(window.top!==window)return;localStorage.setItem('haven_onboarded','1');if(!sessionStorage.getItem('gate-seeded')){localStorage.setItem('mentation.flagship.active.v1',JSON.stringify({interventionId:id,experience:state,expiresAt:Date.now()+86400000}));sessionStorage.setItem('gate-seeded','1');}history.replaceState({usr:{prebuilt:true,pathway:[id],direction:id==='unhook'?'reset':'calm',intensity:null,timeMin:3,audio:'no'},key:'gate',idx:0},'',location.href);},{id,state:{...base,...fixtures[id]}});
 await p.goto((process.env.CARE_GATE_ORIGIN || 'http://localhost:5175')+'/reset');await p.getByRole('button',{name:'Resume practice',exact:true}).click();await p.locator('.pf-core').waitFor();
 const shot=async state=>{await p.screenshot({path:`${out}/${id}-${state}-390.png`});};await shot('initial');
 if(id==='selfCompassion'){await p.locator('.pf-response-choices>button').first().click();await shot('first-choice');await p.getByRole('button',{name:'Gentle',exact:true}).click();}
 if(id==='unhook'){await p.getByRole('button',{name:'Notice this as a thought',exact:true}).click();await shot('first-choice');await p.getByRole('button',{name:'Something I can see',exact:true}).click();}
 if(id==='makeRoom'){await p.getByRole('button',{name:'Something I can see',exact:true}).click();await shot('first-choice');await p.getByRole('button',{name:'A little',exact:true}).click();}
 await shot('second-choice');
 const layout=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,primaryBottom:document.querySelector('.pf-primary').getBoundingClientRect().bottom,stopBottom:document.querySelector('.pf-stop').getBoundingClientRect().bottom,practiceTaken:JSON.parse(localStorage.getItem('mentation.flagship.active.v1')).experience.practiceTaken,clicks:JSON.parse(localStorage.getItem('mentation.flagship.active.v1')).experience.clicks,animations:[...document.querySelectorAll('.pf-core *')].filter(e=>getComputedStyle(e).animationName!=='none').length}));
 if(layout.overflow||layout.stopBottom>844||layout.practiceTaken||layout.animations)throw Error(id+' layout/honesty '+JSON.stringify(layout));
 await p.reload();await p.getByRole('button',{name:'Resume practice',exact:true}).click();await p.locator('.pf-core').waitFor();
 await p.locator('.pf-primary').focus();await p.keyboard.press('Enter');await p.getByRole('button',{name:'6 of 10',exact:true}).click();await p.getByRole('button',{name:'Continue',exact:true}).click();await p.getByText('6 → 6 / 10 · You reported no change.',{exact:true}).waitFor();await p.locator('.care-comparison').scrollIntoViewIfNeeded();await shot('no-change');
 const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.flagship.active.v1')).experience);if(!after.practiceTaken||after.actionStatus!=='planned'||after.before!==6||after.after!==6)throw Error(id+' data');
 await p.evaluate(()=>{window.gateOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='mentation.carePractices.saved.v1')throw new Error('gate quota simulation');return window.gateOriginalSet.call(this,key,value);};});
 await p.getByRole('button',{name:'Save this card on my device',exact:true}).click();await p.getByText('Saving did not work. Your card has not been saved. Try again.',{exact:true}).waitFor();await p.evaluate(()=>{Storage.prototype.setItem=window.gateOriginalSet;});
 await p.getByRole('button',{name:'Save this card on my device',exact:true}).click();await p.getByText('Saved on this device. You can find it in Return points.',{exact:true}).waitFor();await p.getByRole('button',{name:'Delete saved card',exact:true}).click();await p.getByText('Saved card deleted from this device.',{exact:true}).waitFor();
 await c.close();
 const longText='I keep thinking about what happened in that difficult conversation, and I worry that I will be judged for every word I say next. '.repeat(3).slice(0,300);
 const longState={...base,...fixtures[id],notice:id==='makeRoom'?'Frustration about a difficult conversation that is still unresolved, with uncertainty about what comes next.':longText,perspective:id==='selfCompassion'?'I can look honestly at this difficult conversation and choose one small thing to repair. I can take responsibility while treating myself with care. '.repeat(3).slice(0,300):'',anchorType:id==='selfCompassion'?null:'object',anchorText:id==='selfCompassion'?'':'The blue mug by the window, beside the notebook I can open for the next small part of my work.',defusionStep:id==='unhook'?2:0,allowance:id==='makeRoom'?'small':null,action:'Open the document and write one clear sentence about what happened, then decide on one small repair I can make without judging everything about myself.'};
 const longResults=[];
 for(const enlarged of [false,true]){
  const lc=await b.newContext({viewport:{width:320,height:844},reducedMotion:'reduce'});const lp=await lc.newPage();lp.on('pageerror',e=>errors.push(e.message));
  await lp.addInitScript(({id,state,enlarged})=>{if(window.top!==window)return;localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({largeText:enlarged,highContrast:enlarged,reducedMotion:true}));localStorage.setItem('mentation.flagship.active.v1',JSON.stringify({interventionId:id,experience:state,expiresAt:Date.now()+86400000}));history.replaceState({usr:{prebuilt:true,pathway:[id],direction:id==='unhook'?'reset':'calm',intensity:null,timeMin:3,audio:'no'},key:'long-gate',idx:0},'',location.href);},{id,state:longState,enlarged});
  await lp.goto((process.env.CARE_GATE_ORIGIN || 'http://localhost:5175')+'/reset');await lp.getByRole('button',{name:'Resume practice',exact:true}).click();
  await lp.locator(`[data-care="${id}"][data-care-stage="practice"] .pf-core`).waitFor();
  const name=await lp.locator(id==='selfCompassion'?'.pf-critical p':id==='unhook'?'.pf-thought h1':'.pf-feeling h1').innerText();
  if(!name.includes(longState.notice))throw Error(id+' wrong fixture/core');
  const longOverflow=await lp.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(longOverflow)throw Error(id+' long overflow');
  const persisted=await lp.evaluate(()=>JSON.parse(localStorage.getItem('mentation.flagship.active.v1')).experience);
  if(persisted.stage!=='practice'||persisted.notice!==longState.notice||persisted.action!==longState.action)throw Error(id+' incorrect long stage');
  await lp.screenshot({path:`${out}/${id}-long${enlarged?'-enlarged':''}-320.png`,fullPage:true});
  const primary=lp.locator('.pf-primary');await primary.focus();
  const reachable=await primary.evaluate(e=>({focused:document.activeElement===e,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}));
  if(!reachable.focused||reachable.top<0||reachable.bottom>844)throw Error(id+' action not reachable '+JSON.stringify(reachable));
  await lp.keyboard.press('Tab');if(!(await lp.locator('.pf-stop').evaluate(e=>document.activeElement===e)))throw Error(id+' keyboard safety control unreachable');await lp.keyboard.press('Shift+Tab');
  await lp.screenshot({path:`${out}/${id}-long${enlarged?'-enlarged':''}-action-320.png`});
  await lp.keyboard.press('Enter');await lp.locator('[data-care-stage="rerate"]').waitFor();
  if(!(await lp.evaluate(()=>JSON.parse(localStorage.getItem('mentation.flagship.active.v1')).experience.practiceTaken)))throw Error(id+' keyboard self-report missing');
  longResults.push({safetyKeyboardReachable:true,enlarged,stage:'practice',noticeLength:longState.notice.length,responseLength:longState.perspective.length,actionLength:longState.action.length,noHorizontalOverflow:true,keyboardActionReachable:true});await lc.close();
 }
 if(errors.length)throw Error(id+' runtime '+errors.join('; '));
 checks.push({id,viewport:'390x844',...layout,noChangeReported:true,savedDeleted:true,saveErrorHonest:true,resumeAfterChoices:true,primaryKeyboardEnter:true,longCoreChecks:longResults,errors});
}
fs.writeFileSync(out+'/checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
