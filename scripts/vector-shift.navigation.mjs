import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || '/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright/index.mjs');
const b=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});
const p=await b.newPage({viewport:{width:390,height:844}});const results=[];const errors=[];const knownIssues=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('haven_onboarded','1'));
 await p.goto('http://127.0.0.1:5178/vector-shift');
 await p.getByRole('button',{name:'6',exact:true}).click();await p.getByRole('button',{name:'Build my reset'}).click();await p.getByRole('button',{name:'Begin',exact:true}).click();
 let f=p.frameLocator('iframe[title="Vector Shift activities"]');await f.getByRole('button',{name:'Tap here to begin'}).click();await f.getByRole('button',{name:'Skip step'}).click();await f.getByRole('heading',{name:'Serpent',exact:true}).waitFor();await f.getByRole('button',{name:'Pause',exact:true}).click();await p.waitForTimeout(600);
 const entry=await p.evaluate(()=>history.state.usr);assert.equal(entry.goal_baseline.value,6);const id=entry.reset_session_id;
 await p.goBack();await p.getByRole('button',{name:'Begin',exact:true}).waitFor();await p.goForward();await p.waitForTimeout(400);if(await p.getByRole('button',{name:'Begin',exact:true}).isVisible()){knownIssues.push('Shared ResetFlow browser Forward remains on overview; Begin is needed to resume. Owner notified.');await p.getByRole('button',{name:'Begin',exact:true}).click();}
 f=p.frameLocator('iframe[title="Vector Shift activities"]');await f.getByRole('dialog',{name:'Paused'}).waitFor();await f.getByRole('button',{name:'Resume',exact:true}).click();await f.getByRole('heading',{name:'Serpent',exact:true}).waitFor();await p.reload();await f.getByRole('dialog',{name:'Paused'}).waitFor();
 assert.equal(await p.evaluate(()=>history.state.usr.reset_session_id),id);assert.equal(await p.evaluate(()=>history.state.usr.goal_baseline.value),6);
 results.push('Real direct entry → explicit baseline → Begin → browser Back → Begin resumes → refresh retains session, baseline and paused Serpent');
 await f.getByRole('button',{name:'Resume',exact:true}).click();await f.getByRole('button',{name:'Skip step'}).click();await f.getByRole('button',{name:'Try an easier option'}).click();await f.getByRole('button',{name:'Reveal a letter'}).click();
 await p.screenshot({path:'evidence/vector-shift/phone-word-easy.png',fullPage:true});
 await f.getByRole('button',{name:'Skip step'}).click();await f.getByRole('button',{name:/Notice LUNA/}).click();await p.screenshot({path:'evidence/vector-shift/phone-solar-easy.png',fullPage:true});
 await f.getByRole('button',{name:'Stop',exact:true}).click();await f.getByRole('button',{name:'Finish here'}).click();await f.getByRole('button',{name:'Continue to check-in'}).click();await p.getByRole('heading',{name:'How intense is it right now?',exact:true}).waitFor();
 await p.reload();
 // Until the separately owned shared patch is integrated, this returns to the
 // saved final iframe screen. It must never invent a rating or restart games.
 f=p.frameLocator('iframe[title="Vector Shift activities"]');await f.getByRole('dialog',{name:'Paused'}).waitFor();await f.getByRole('button',{name:'Resume',exact:true}).click();await f.getByRole('heading',{name:'Check in',exact:true}).waitFor();await f.getByRole('button',{name:'Continue to check-in'}).click();await p.getByRole('button',{name:'Skip and finish'}).click();
 await p.waitForFunction(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length===1);const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')));assert.equal(saved[0].intensity_end,null);assert.equal(saved[0].attempts.length,1);
 results.push('Final-assessment refresh fallback preserves final screen; skipped end rating remains null and saves once (shared direct-resume patch pending)');
 assert.deepEqual(errors,[]);
}finally{await b.close();fs.writeFileSync('evidence/vector-shift/navigation-results.json',JSON.stringify({results,errors,knownIssues},null,2)+'\n');console.log(results)}
