/* Real browser journeys; no provider calls or remote writes. Playwright is environment tooling. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const base=process.env.BASE_URL || 'http://localhost:5175';const out=process.env.EVIDENCE_DIR || path.resolve('design/three-passes/pass1');
fs.mkdirSync(out,{recursive:true});const results=[];const widths=(process.env.WIDTHS || '320,390,1280').split(',').map(Number);
const selected=(process.env.JOURNEYS || 'selfCompassion,unhook,makeRoom,factCheck,changeScene,happyBump,nextAction,tomorrowParking,grounding54321V2,pmr,taraTactician,signalLock,nightChannel,goodMap,vectorShift,boxV2,urgeSurf').split(',');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of widths)for(const id of selected){const record={id,width,actions:[],checkpoints:[],screens:[],accessibility:[],errors:[]};const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',...(process.env.RECORD==='1' && width===390?{recordVideo:{dir:path.join(out,'recordings'),size:{width:390,height:844}}}:{})});
await context.addInitScript(id=>{localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion:true,largeText:location.search.includes('large-text')}));if(location.pathname==='/reset'&&!history.state?.usr){history.replaceState({usr:{prebuilt:true,pathway:[id==='pmr'?'progressive-muscle-relaxation-v2':id],direction:'calm',audio:'no',reset_phase:'guiding',goal_baseline:{question:'How intense is it right now?',scale:'distress',left:'Calm',right:'Extreme',higherIsBetter:false,direction:'calm',min:0,max:10,value:6,answered:true}},key:'practice',idx:0},'',location.href)}},id);
const p=await context.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>record.errors.push(e.message));let page=p;
const click=async(name)=>{await page.getByRole('button',{name,exact:true}).first().click();record.actions.push(typeof name==='string'?name:name.source);await p.waitForTimeout(350)};
const first=async(selector)=>{const button=page.locator(selector).first();record.actions.push(await button.innerText());await button.click();await p.waitForTimeout(350)};
const checkpoint=async(count)=>{const receipt=page.locator('[data-checkpoint]').filter({visible:true}).last();await receipt.waitFor();const actual=Number(await receipt.getAttribute('data-checkpoint'));if(count!==undefined)assert.equal(actual,count);record.checkpoints.push({afterAction:record.actions.length,pair:actual,text:await receipt.innerText()});};
const snap=async(name)=>{record.screens.push({name,headings:await page.locator('h1,h2').filter({visible:true}).allTextContents()});record.accessibility.push({name,unnamedButtons:await page.locator('button').filter({visible:true}).evaluateAll(buttons=>buttons.filter(b=>!b.getAttribute('aria-label')&&!b.getAttribute('aria-labelledby')&&!b.getAttribute('title')&&!b.innerText.trim()).map(b=>b.outerHTML.slice(0,240)))});await p.screenshot({path:path.join(out,`${id}-${name}-${width}.png`),fullPage:true});};
const fits=async()=>{assert.equal(await page.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');};
try{
const routes={signalLock:'/signal-lock',nightChannel:'/night-channel',goodMap:'/good-map',vectorShift:'/reset'};
await p.goto(base+(routes[id]||'/reset')+(process.env.LARGE_TEXT==='1'?'?large-text=1':''));await p.waitForTimeout(800);
if(routes[id]){const frame=await p.locator('iframe').elementHandle();page=await frame.contentFrame();await page.waitForLoadState();}
if(['selfCompassion','unhook','makeRoom'].includes(id)){
 await click('Begin');await click('6 of 10');await first('.cq-choices button');await checkpoint(1);await snap('first-reveal');
 if(id==='selfCompassion'){await first('.cq-choices button');await page.getByRole('heading',{name:'Say the response slowly.'}).waitFor();await snap('practice-object');await click('I tried saying these words');}
 if(id==='unhook'){await first('.cq-choices button');await snap('practice-object');await click('I tried saying it this way');}
 if(id==='makeRoom'){await click('Something I can see');await click('Try a gentle moment with this anchor');await snap('practice-object');await click('I tried letting the feeling be here');}
 await checkpoint(2);await first('.cq-choices button');
 if(id==='unhook'){await click('Something I can see');await click('I tried returning attention');await click('Continue to my next step');}
 await click('Keep this as my next step');await click('6 of 10');await snap('carry-card');await checkpoint();
 await click('Save my card on this device');assert.match(await page.locator('.cq-result').innerText(),/no change/i);
 const before=await page.locator('.cq-card').innerText();await p.reload();await click('Resume practice');assert.equal(await page.locator('.cq-card').innerText(),before);await fits();
 await click('Go back');await page.locator('.cq-rating').waitFor();await p.goBack();await p.waitForTimeout(150);record.backAndRefresh=true;
}else if(id==='factCheck'){
 await click('I made a mistake.');await click('Continue');await click('7');await checkpoint(1);await click('Interpretation');
 await page.getByRole('textbox',{name:'What makes it seem true?'}).fill('I sent the wrong attachment.');await click('Continue');
 await page.getByRole('textbox',{name:'What points another way?'}).fill('I can send the right one.');await click('Continue');await checkpoint(2);await snap('evidence');
 await p.reload();await page.locator('[data-tof-stage=ruling]').waitFor();await fits();record.backAndRefresh=true;
}else if(id==='changeScene'){
 await click(/Begin Change the Scene/);await first('.scene-primary');await first('.scene-primary');await checkpoint(1);await snap('first-reveal');
 const count=await page.locator('[data-practice-count]').getAttribute('data-practice-count');await click('Skip this action');assert.equal(await page.locator('[data-practice-count]').getAttribute('data-practice-count'),count);
 await p.reload();await checkpoint(1);await click('Go back');await fits();record.skipsExcluded=true;record.backAndRefresh=true;
}else if(id==='happyBump'){
 await click('Start');await click('Confirm energy: 5');await click("I've had some water");await checkpoint(1);await snap('first-reveal');
 await first('.happy-bump-primary');await click('1 min');await checkpoint(2);await click('Walk indoors');await checkpoint(2);await click('I took a shorter walk');await click('Skip ahead');await click('Put one thing away');await snap('mission');
 await p.reload();await page.getByRole('heading',{name:'Put one thing away'}).waitFor();await click('Done');await checkpoint();await click('I kept going');await click('Confirm energy: 5');await click('No change');await snap('final-card');await checkpoint();assert.match(await page.locator('.happy-bump-reveal-shift').innerText(),/5 → 5/);record.shortRouteCompleted=true;record.backAndRefresh=true;
}else if(id==='nextAction'){
 await click('Tidy my desk');await snap('current-task');await click('Done ✓');await checkpoint(1);await snap('first-reveal');await p.reload();await page.locator('[data-nes-screen]').waitFor();await fits();record.backAndRefresh=true;
}else if(id==='tomorrowParking'){
 await click('It can wait');await page.getByRole('textbox',{name:'What can wait?'}).fill('Check the project notes tomorrow');await click('Ready to put it away');await checkpoint(1);await snap('draft-reveal');
 assert.match(await page.locator('[data-checkpoint]').innerText(),/draft/);await p.reload();await checkpoint(1);record.backAndRefresh=true;
}else if(id==='grounding54321V2'){
 await page.getByRole('button',{name:'I noticed — next sense',exact:true}).dblclick();record.actions.push('Double tap noticed (one advancement)');await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>history.state.usr.reset_grounding.noticed.length),1);record.doubleTapGuard=true;await click('I noticed — next sense');await checkpoint(1);await snap('first-reveal');await click('Skip this sense');assert.equal(await page.locator('[data-practice-count]').getAttribute('data-practice-count'),'2');await p.reload();await checkpoint(1);record.skipsExcluded=true;record.backAndRefresh=true;
}else if(id==='pmr'){
 await click(/Release only/);await click(/Short · three areas/);await checkpoint(1);await snap('route');await click('Begin release only');await click('Pause PMR');await p.reload();await page.getByRole('button',{name:'Resume PMR'}).waitFor();await click('Resume PMR');await click('Stop and check in');record.backAndRefresh=true;
}else if(id==='taraTactician'){
 await click('Get started');await click('Before the situation');await click('A conversation');await click('Finding the words');await checkpoint(1);await snap('first-reveal');await click('Continue');await first('.tara-answer-choice');await click('Practise this move');await first('.tara-answer-choice');await checkpoint(2);await snap('practice-words');await click('I tried this');await checkpoint(3);await snap('practice');await p.reload();await page.locator('.tara').waitFor();record.backAndRefresh=true;
}else if(id==='signalLock'){
 await click(/Follow the signal/);await click('First signal');await click('Second signal');record.checkpoints.push({afterAction:3,pair:1,text:await page.locator('#reveal-label').innerText()});await snap('first-reveal');await click('First signal');await click('Second signal');await snap('second-reveal');await p.reload();const frame=await p.locator('iframe').elementHandle();page=await frame.contentFrame();await page.getByRole('button',{name:/Continue the signal/}).waitFor();record.backAndRefresh=true;
}else if(id==='nightChannel'){
 await first('.night-sound-choices button');await click('15 minutes');await checkpoint(1);await snap('listening-ticket');await click('Tune In');await snap('listening');
}else if(id==='goodMap'){
 await click(/Start sorting/);await page.locator('.tray[data-v="3"]').click();record.actions.push('I need this');await p.waitForTimeout(600);await page.locator('.tray[data-v="1"]').click();record.actions.push('Nice to have');await p.waitForTimeout(600);await checkpoint(1);await snap('first-reveal');await click('Undo');assert.equal(await page.locator('[data-checkpoint]').count(),0);record.undoRemovesReward=true;
}else if(id==='vectorShift'){
 await page.getByText('Tap here to begin',{exact:true}).click();record.actions.push('Begin visual task');await page.getByText('Activity options',{exact:true}).click();await click('Try an easier option');await click('I noticed a colour or shape — continue');await click('Collect a light at your pace (0/3)');await click('Collect a light at your pace (1/3)');await checkpoint(2);await snap('lights');
}else if(id==='boxV2'){
 await page.locator('.box-v2-player').waitFor();await snap('opening');await p.waitForTimeout(33500);await checkpoint(1);await snap('two-rounds');record.handsFree=true;if(process.env.FULL_TIMERS==='1'){await p.waitForTimeout(32500);await checkpoint(2);await snap('four-rounds');}
}else if(id==='urgeSurf'){
 await click('Start a 60-second pause');await p.waitForTimeout(17500);await checkpoint(1);await snap('guided-reveal');await page.getByRole('button',{name:/Pause/}).first().click();await p.reload();record.backAndRefresh=true;
}
await fits();assert.deepEqual(record.errors,[]);record.passed=true;
}catch(error){record.passed=false;record.failure=error.message;await snap('failure').catch(()=>{});console.log('FAIL',id,width,error.message.slice(0,260))}
results.push(record);fs.writeFileSync(path.join(out,'interaction-traces.json'),JSON.stringify(results,null,2));if(record.passed)console.log('PASS',id,width);await context.close();if(p.video()){record.recording=path.relative(out,await p.video().path());fs.writeFileSync(path.join(out,'interaction-traces.json'),JSON.stringify(results,null,2));}}
await browser.close();if(results.some(r=>!r.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
