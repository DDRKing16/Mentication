// Run against the task-owned Vite server. Requires the already-installed Playwright.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/vector-shift.browser.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright/index.mjs');
const base=process.env.VECTOR_TEST_URL || 'http://127.0.0.1:5178';
const out='evidence/vector-shift';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio','--no-first-run']});
const results=[];const errors=[];
const record=(name)=>{results.push(name);console.log('PASS',name)};
async function pageFor(width=390){const p=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));return p}
async function waitHeading(p,text){await p.getByRole('heading',{name:text,exact:true}).waitFor()}
async function snapshot(p,name){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow');await p.screenshot({path:`${out}/${name}.png`,fullPage:true})}
async function raw(p,id,seed){if(seed)await p.addInitScript(({id,seed})=>{if(new URLSearchParams(location.search).get('session')===id)sessionStorage.setItem(`vector-shift:v2:${id}`,JSON.stringify(seed))},{id,seed});await p.goto(`${base}/vector-shift/index.html?session=${id}&audio=off`);if(seed)await p.getByRole('button',{name:'Resume',exact:true}).click()}

async function read(p,id){return p.evaluate(id=>JSON.parse(sessionStorage.getItem(`vector-shift:v2:${id}`)),id)}
try{
  const p=await pageFor();await raw(p,'phone-easy');await snapshot(p,'phone-start');
  await p.getByRole('button',{name:'Tap here to begin'}).click();await waitHeading(p,'Align');
  await p.getByRole('group',{name:/Alignment field/}).press('ArrowLeft');
  await p.getByRole('button',{name:'Pause',exact:true}).click();await p.waitForTimeout(600);
  const alignBefore=(await read(p,'phone-easy')).align;await p.waitForTimeout(700);assert.equal((await read(p,'phone-easy')).align,alignBefore);
  await p.keyboard.press('Shift+Tab');assert.equal(await p.locator(':focus').textContent(),'Finish here');
  await snapshot(p,'phone-paused');await p.reload();await p.getByRole('dialog',{name:'Paused'}).waitFor();await p.getByRole('button',{name:'Resume',exact:true}).click();await snapshot(p,'phone-align');
  record('Align keyboard, pause freezes clock, focus stays in dialog, refresh resumes paused');
  await p.getByRole('button',{name:'Try an easier option'}).click();await p.getByRole('button',{name:/I noticed a colour/}).click();
  await waitHeading(p,'Serpent');await snapshot(p,'phone-serpent-easy');
  for(let n=0;n<3;n++)await p.getByRole('button',{name:/Collect a light/}).click();
  await waitHeading(p,'Word match');await p.getByRole('button',{name:'Reveal a letter',exact:true}).click();
  await p.getByRole('button',{name:'Pause',exact:true}).click();await p.waitForTimeout(600);const letters=(await read(p,'phone-easy')).en;assert.ok(letters.length>0);
  await p.reload();await p.getByRole('button',{name:'Resume',exact:true}).click();await p.waitForTimeout(550);assert.deepEqual((await read(p,'phone-easy')).en,letters);
  await snapshot(p,'phone-word-easy');
  for(let n=0;n<7;n++){if(await p.getByRole('button',{name:'Reveal a letter',exact:true}).count())await p.getByRole('button',{name:'Reveal a letter',exact:true}).click();}
  await waitHeading(p,'Solar scan');await p.getByRole('button',{name:/Notice LUNA/}).click();await p.getByRole('button',{name:/Notice SATURN/}).click();await snapshot(p,'phone-solar-easy');
  await p.getByRole('button',{name:'Back',exact:true}).click();await waitHeading(p,'Word match');await p.getByRole('button',{name:'Skip step'}).click();await waitHeading(p,'Solar scan');await p.waitForTimeout(1700);await waitHeading(p,'Solar scan');
  await p.getByRole('button',{name:/I've looked/}).click();await waitHeading(p,'Reflect');
  await p.getByRole('button',{name:'Stop',exact:true}).click();await p.getByRole('button',{name:'Resume',exact:true}).click();await waitHeading(p,'Reflect');
  for(const name of ['Nothing stood out','Too demanding',"I'd prefer to stay here",'Choose later',"I'm not sure"]){await p.getByRole('button',{name,exact:true}).click();await p.waitForTimeout(1000)}
  await waitHeading(p,'Check in');assert.match(await p.locator('body').innerText(),/No feedback selected/);
  await p.getByRole('button',{name:'Felt worse',exact:true}).click();await snapshot(p,'phone-ending-worse');
  assert.match(await p.locator('[role=status]').innerText(),/reported feeling worse/);record('All easier activities, word refresh, back/skip cancels delayed transition, stop/resume and all reflections');await p.close();

  const desktop=await pageFor(1440);
  await raw(desktop,'original-align',{e:2,align:99,hold:23.9});await desktop.getByRole('button',{name:'Pause',exact:true}).click();await desktop.waitForTimeout(4500);await waitHeading(desktop,'Align');await desktop.getByRole('button',{name:'Resume',exact:true}).click();await waitHeading(desktop,'Serpent');record('Original alignment completion waits during pause and advances after resume');
  await raw(desktop,'original-games',{e:3,np:[{x:9,y:9},{x:8,y:9},{x:7,y:9}],jt:{x:10,y:9},score:14,direction:{x:1,y:0},be:'BREATHE'});
  await waitHeading(desktop,'Word match');record('Original serpent target collision and 15-target completion');
  // All guessed letters exercise the original keyboard, with wrong guesses and repeats.
  await snapshot(desktop,'desktop-word-original');
  await desktop.waitForTimeout(600);const word=(await read(desktop,'original-games')).be;
  for(const letter of `ZX${word}`){const button=desktop.getByRole('button',{name:letter,exact:true});if(await button.isEnabled())await button.click()}
  await waitHeading(desktop,'Solar scan');await snapshot(desktop,'desktop-solar-original');
  const points=[['left',64,41],['left',70,58],['left',54,62],['left',18,20],['left',48,72],['right',84,18],['left',42,36],['left',50,55],['left',55,48],['right',88,71]];
  const boards=desktop.locator('.cursor-crosshair');
  for(const [side,x,y] of points){const board=boards.nth(side==='left'?0:1);const box=await board.boundingBox();await board.click({position:{x:box.width*x/100,y:box.height*y/100}})}
  await waitHeading(desktop,'Reflect');await snapshot(desktop,'desktop-reflect');await desktop.getByRole('button',{name:'Skip step'}).click();await waitHeading(desktop,'Check in');await snapshot(desktop,'desktop-ending-unanswered');
  record('Original word guessing, all 10 solar differences and reflection skip');await desktop.close();

  const definitions={ground:{question:'How intense is it right now?',scale:'disconnection',left:'Present',right:'Gone',higherIsBetter:false},calm:{question:'How intense is it right now?',scale:'distress',left:'Calm',right:'Extreme',higherIsBetter:false},lift:{question:'How is your mood right now?',scale:'mood',left:'Very low',right:'Great',higherIsBetter:true}};
  for(const [direction,after,helpfulness] of [['ground',6,'same'],['ground',8,'worse'],['ground',null,null],['calm',6,'unsure'],['lift',8,'helpful']]){
    const host=await pageFor();const id=`host-${direction}-${after}-${helpfulness}`;
    await host.addInitScript(()=>localStorage.setItem('haven_onboarded','1'));await host.goto(`${base}/reset`);
    const baseline={...definitions[direction],direction,min:0,max:10,value:6,answered:true};
    const entry={prebuilt:true,pathway:['vectorShift'],direction,intensity:6,goal_baseline:baseline,whereFelt:'both',timeMin:5,audio:'no',reset_phase:'guiding',reset_session_id:id};
    await host.evaluate(entry=>history.replaceState({usr:entry,key:'test'},'',location.href),entry);await host.reload();
    const f=host.frameLocator('iframe[title="Vector Shift activities"]');await f.getByRole('button',{name:'Stop',exact:true}).click();await f.getByRole('button',{name:'Finish here'}).click();
    if(helpfulness)await f.getByRole('button',{name:({same:'No change',worse:'Felt worse',unsure:'Not sure',helpful:'Helpful'})[helpfulness],exact:true}).click();
    // Same-window spoof must not finish the iframe's activity.
    await host.evaluate(id=>window.postMessage({type:'vector-shift:complete',sessionId:id},location.origin),id);assert.equal(await host.locator('iframe').count(),1);
    await host.evaluate(()=>{window.vectorCompletionMessages=0;window.addEventListener('message',event=>{if(event.data?.type==='vector-shift:complete'&&event.source!==window)window.vectorCompletionMessages++})});
    await f.getByRole('button',{name:'Continue to check-in'}).evaluate(button=>{button.click();button.click()});
    await host.getByRole('heading',{name:baseline.question,exact:true}).waitFor();
    await host.getByText(baseline.left,{exact:true}).waitFor();await host.getByText(baseline.right,{exact:true}).waitFor();
    if(after===null)await host.getByRole('button',{name:'Skip and finish'}).click();else{await host.getByRole('button',{name:String(after),exact:true}).click();await host.getByRole('button',{name:`Confirm rating: ${after}`}).click()}
    await host.waitForFunction(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length===1);
    const sessions=await host.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')));assert.equal(sessions.length,1);assert.equal(await host.evaluate(()=>window.vectorCompletionMessages),1);assert.equal(sessions[0].attempts.length,1);assert.equal(sessions[0].intensity_end,after);assert.deepEqual(sessions[0].goal_baseline,baseline);
    const expected=helpfulness==='worse'?'worse':helpfulness==='helpful'?'better':after===null?'not_answered':'same';assert.equal(sessions[0].attempts[0].response,expected);
    if(helpfulness===null)assert.equal(sessions[0].attempts[0].helpfulness_response,undefined);
    record(`Host ${direction}: baseline 6 → ${after??'unanswered'}, feedback ${helpfulness??'unanswered'}, identical scale, one session/attempt`);await host.close();
  }
  const entry=await pageFor();await entry.addInitScript(()=>localStorage.setItem('haven_onboarded','1'));await entry.goto(`${base}/vector-shift`);await entry.waitForURL(/reset/);await entry.getByRole('heading',{name:'How intense is it right now?',exact:true}).waitFor();assert.equal(await entry.locator('iframe[title="Vector Shift activities"]').count(),0);assert.match(await entry.locator('body').innerText(),/How intense|How are|right now/i);assert.equal(await entry.getByRole('button',{name:'Build my reset'}).isEnabled(),false);await snapshot(entry,'phone-explicit-baseline');record('Direct route without an answered baseline stays in shared check-in');await entry.close();
  assert.deepEqual(errors,[]);record('No browser runtime errors; phone/desktop screenshots have no horizontal overflow');
}finally{await browser.close();fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify({results,errors},null,2)+'\n')}
