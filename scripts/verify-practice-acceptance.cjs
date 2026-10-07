/* Real browser journeys; no provider calls or remote writes. Playwright is environment tooling. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const base=process.env.BASE_URL || 'http://localhost:5176';const out=process.env.EVIDENCE_DIR || path.resolve('design/three-passes/acceptance-repair');
fs.mkdirSync(out,{recursive:true});const results=[];const widths=(process.env.WIDTHS || '320,390,1280').split(',').map(Number);
const selected=(process.env.JOURNEYS || 'selfCompassion,unhook,makeRoom,factCheck,changeScene,happyBump,nextAction,tomorrowParking,grounding54321V2,pmr,taraTactician,nightChannel,goodMap,vectorShift').split(',');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of widths)for(const id of selected){const record={id,width,actions:[],checkpoints:[],screens:[],accessibility:[],errors:[]};const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',...(process.env.RECORD==='1' && width===390?{recordVideo:{dir:path.join(out,'recordings'),size:{width:390,height:844}}}:{})});
await context.addInitScript(id=>{localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion:true,largeText:location.search.includes('large-text')}));if(location.pathname==='/reset'&&!history.state?.usr){history.replaceState({usr:{prebuilt:true,pathway:[id==='pmr'?'progressive-muscle-relaxation-v2':id],direction:'calm',audio:'no',reset_phase:'guiding',goal_baseline:{question:'How intense is it right now?',scale:'distress',left:'Calm',right:'Extreme',higherIsBetter:false,direction:'calm',min:0,max:10,value:6,answered:true}},key:'practice',idx:0},'',location.href)}},id);
const p=await context.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>record.errors.push(e.message));let page=p;
const routes={signalLock:'/signal-lock',nightChannel:'/night-channel',goodMap:'/good-map',vectorShift:'/reset'};
const traceStarted=Date.now();let progress=0;const seen=new Set();
const observe=async(label,kind='navigation',delta=0)=>{progress+=delta;const receipts=await page.locator('[data-checkpoint]').filter({visible:true}).evaluateAll(nodes=>nodes.map(n=>({pair:Number(n.dataset.checkpoint),count:n.dataset.practiceCount?Number(n.dataset.practiceCount):null,text:n.innerText})));const expected=Math.floor(progress/2);const row={sequence:record.actions.length+1,elapsedMs:Date.now()-traceStarted,label,kind,progress,expectedPair:expected,receipts};record.actions.push(row);
 for(const r of receipts){assert.ok(r.pair<=expected,`${label}: premature pair ${r.pair}, expected ${expected}`);if(!seen.has(r.pair)){seen.add(r.pair);record.checkpoints.push({firstAppearanceAt:row.sequence,progress,pair:r.pair,text:r.text});await p.screenshot({path:path.join(out,`${id}-pair-${r.pair}-${width}.png`),fullPage:true});}}
 if(delta && progress%2===0){assert.ok(receipts.some(r=>r.pair===expected),`${label}: missing pair ${expected} at progress ${progress}`);}
};
const click=async(name,earned=false)=>{const b=page.getByRole('button',{name,exact:true}).first();const label=await b.innerText();await b.click();await p.waitForTimeout(400);await observe(label,earned?'decision or confirmed practice':'navigation',earned?1:0)};
const first=async(selector,earned=false)=>{const button=page.locator(selector).first();const label=await button.innerText();await button.click();await p.waitForTimeout(400);await observe(label,earned?'decision or confirmed practice':'navigation',earned?1:0)};
const fill=async(name,text)=>{await page.getByRole('textbox',{name,exact:true}).fill(text);await p.waitForTimeout(150);await observe(`Type in ${name}`,'typing')};
const reload=async()=>{await p.reload();await p.waitForTimeout(800);if(routes[id]){page=await (await p.locator('iframe').elementHandle()).contentFrame();await page.waitForLoadState();}await observe('Refresh','navigation')};
const snap=async(name)=>{record.screens.push({name,headings:await page.locator('h1,h2').filter({visible:true}).allTextContents()});record.accessibility.push({name,unnamedButtons:await page.locator('button').filter({visible:true}).evaluateAll(buttons=>buttons.filter(b=>!b.getAttribute('aria-label')&&!b.getAttribute('aria-labelledby')&&!b.getAttribute('title')&&!b.innerText.trim()).map(b=>b.outerHTML.slice(0,240)))});await p.screenshot({path:path.join(out,`${id}-${name}-${width}.png`),fullPage:true});};
const fits=async()=>{assert.equal(await page.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');};
try{
await p.goto(base+(routes[id]||'/reset')+(process.env.LARGE_TEXT==='1'?'?large-text=1':''));await p.waitForTimeout(800);
if(routes[id]){const frame=await p.locator('iframe').elementHandle();page=await frame.contentFrame();await page.waitForLoadState();}
await observe('Entry loaded');

if(['selfCompassion','unhook','makeRoom'].includes(id)){
 await click('Begin');await click('6 of 10',true);await first('.cq-choices button',true);
 if(id==='selfCompassion'){await first('.cq-choices button',true);await click('I tried saying these words',true);}
 if(id==='unhook'){await first('.cq-choices button',true);await click('I tried saying it this way',true);}
 if(id==='makeRoom'){await click('Something I can see',true);await click('Try a gentle moment with this anchor');await click('I tried letting the feeling be here',true);}
 await first('.cq-choices button',true);
 if(id==='unhook'){await click('Something I can see',true);await click('I tried returning attention',true);await click('Continue to my next step');}
 await click('Keep this as my next step',true);await click('6 of 10',true);await snap('carry-card');await click('Save my card on this device');await reload();await click('Resume practice');
}else if(id==='factCheck'){
 await click('I made a mistake.');await click('Continue',true);await click('7',true);await click('Interpretation',true);
 await fill('What makes it seem true?','I sent the wrong attachment.');await click('Continue',true);
 await fill('What points another way?','I can send the right one.');await click('Continue',true);await snap('evidence');
 await click('Yes, this fits',true);await snap('balanced');
}else if(id==='changeScene'){
 await click(/Begin Change the Scene/);for(let i=0;i<6;i++)await first('.scene-primary',true);await snap('six-actions');await reload();
}else if(id==='happyBump'){
 await click('Start');await click('Confirm energy: 5',true);await click("I've had some water",true);await click('I did that',true);await click('1 min',true);await click('Walk indoors',true);await click('I took a shorter walk',true);await click('Skip ahead');await click('Put one thing away',true);await reload();await click('Done',true);await click('I kept going',true);await click('Confirm energy: 5',true);await click('No change',true);await snap('unchanged-energy');
}else if(id==='nextAction'){
 await click('Tidy my desk',true);await click('Done ✓',true);await snap('step-complete');await reload();
}else if(id==='tomorrowParking'){
 await click('It can wait',true);await fill('What can wait?','Check the project notes tomorrow');await click('Ready to put it away',true);await snap('draft');await reload();
}else if(id==='grounding54321V2'){
 await page.getByRole('button',{name:'I noticed — next sense',exact:true}).dblclick();await p.waitForTimeout(400);await observe('Double tap noticed (one advancement)','confirmed practice',1);
 for(let i=0;i<3;i++)await click('I noticed — next sense',true);await snap('four-senses');await reload();
}else if(id==='pmr'){
 await click(/Release only/,true);await click(/Full · seven areas/,true);await reload();await click('Begin release only');
 // Run the real requestAnimationFrame playback; do not advance state or skip guidance.
 const started=Date.now();let last=[];
 while(Date.now()-started<420000){
  const active=await p.evaluate(()=>{const all=Object.keys(localStorage).map(k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}});return all.find(v=>v?.interventionId==='progressive-muscle-relaxation-v2'&&v?.experience)?.experience});
  if(active){for(const region of (active.released||[]).filter(v=>!last.includes(v))){await observe(`Release guidance completed: ${region}`,'hands-free guidance',1);}last=active.released||[];
   if(active.phase==='outcome')break;}
  await p.waitForTimeout(200);
 }
 assert.equal(last.length,7,'Seven release regions completed without extra taps');await snap('all-guidance-complete');record.realElapsedMs=Date.now()-started;
}else if(id==='taraTactician'){
 await click('Get started');await click('Before the situation',true);await click('A conversation',true);await click('Finding the words',true);await click('Continue');await first('.tara-answer-choice',true);await click('Practise this move');await first('.tara-answer-choice',true);await click('I tried this',true);await snap('first-practice');
 await first('.tara-answer-choice',true);await click('I tried this',true);await snap('backup-practice');await reload();
}else if(id==='nightChannel'){
 await first('.night-sound-choices button',true);await click('15 minutes',true);await click('Tune In');await snap('listening');
}else if(id==='goodMap'){
 await click(/Start sorting/);for(let i=0;i<4;i++){await page.locator('.tray[data-v="3"]').click();await p.waitForTimeout(600);await observe('Sort: I need this','decision',1);}await click('Undo');progress--;await observe('Undo removed the fourth sort','undo');await snap('undo');
}else if(id==='vectorShift'){
 await page.getByText('Tap here to begin',{exact:true}).click();await p.waitForTimeout(400);await observe('Begin visual task');
 await page.getByText('Activity options',{exact:true}).click();await observe('Open Activity options');await click('Try an easier option',true);await click('I noticed a colour or shape — continue',true);
 for(let i=0;i<3;i++)await click(`Collect a light at your pace (${i}/3)`,true);
 await click('Z',true);const z=page.getByRole('button',{name:'Z',exact:true});assert.equal(await z.isDisabled(),true);const zb=await z.boundingBox();await p.mouse.click(zb.x+zb.width/2,zb.y+zb.height/2);await observe('Repeat click on disabled Z','repeated choice');
 // Every letter choice is logged; reveal uses the same production handler as the letter keyboard.
 for(let i=0;i<26;i++){if(!(await page.getByRole('button',{name:'Reveal a letter',exact:true}).isVisible()))break;await click('Reveal a letter',true);await p.waitForTimeout(1300);}
 await page.getByRole('button',{name:/^Notice .* — then tap here$/}).first().waitFor();
 for(let i=0;i<6;i++)await click(/^Notice .* — then tap here$/,true);
 await snap('six-features');await reload();await click('Resume');await snap('resumed-features');
}
await fits();assert.deepEqual(record.errors,[]);record.passed=true;
}catch(error){record.passed=false;record.failure=error.message;await snap('failure').catch(()=>{});console.log('FAIL',id,width,error.message.slice(0,260))}
results.push(record);fs.writeFileSync(path.join(out,'interaction-traces.json'),JSON.stringify(results,null,2));if(record.passed)console.log('PASS',id,width);await context.close();if(p.video()){record.recording=path.relative(out,await p.video().path());fs.writeFileSync(path.join(out,'interaction-traces.json'),JSON.stringify(results,null,2));}}
await browser.close();if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
