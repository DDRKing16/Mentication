/* Focused rendered regressions. Playwright is supplied by the test environment. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.BASE_URL||'http://localhost:5183',out=process.env.EVIDENCE_DIR||'docs/handoffs/two-action-checkpoints/regressions';
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--mute-audio']});const results=[];
try{for(const width of [320,390]){const c=await browser.newContext({viewport:{width,height:width===320?568:844},reducedMotion:'reduce'});
await c.addInitScript(()=>{localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion:true}));if(location.pathname==='/reset'&&!history.state?.usr)history.replaceState({usr:{prebuilt:true,pathway:['happyBump'],direction:'calm',audio:'no',reset_phase:'guiding'},key:'test',idx:0},'',location.href)});
const p=await c.newPage();p.setDefaultTimeout(10000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
const click=async name=>{await p.getByRole('button',{name,exact:true}).click();await p.waitForTimeout(350)};
const count=async n=>assert.equal(await p.locator('[data-practice-count]').getAttribute('data-practice-count'),String(n));
await p.goto(base+'/reset');await click('Start');await click('Confirm energy: 5');await click("I've had some water");await count(2);
await click('Skip ahead');await click('Skip ahead');await click('Skip ahead');
await click('Put one thing away');await count(2);await p.reload();await count(2);
await p.screenshot({path:`${out}/happy-unconfirmed-task-${width}.png`,fullPage:true});
await click('Make it my one mission');await count(3);await p.getByRole('button',{name:'Done',exact:true}).dblclick();await p.waitForTimeout(400);await count(4);
const pair=await p.locator('.practice-checkpoint-pair').innerText();await p.reload();await count(4);assert.equal(await p.locator('.practice-checkpoint-pair').innerText(),pair);
await p.goBack();await p.waitForTimeout(300);await count(4);await p.goForward();await p.waitForTimeout(300);await count(4);
await p.screenshot({path:`${out}/happy-confirmed-pair-${width}.png`,fullPage:true});
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
results.push({width,height:width===320?568:844,passed:true,checks:['unconfirmed choice excluded before and after reload','skipped light/walk/contact excluded','task confirmation counted once','double-click completion counted once','same pair after Back/Forward/reload']});await c.close();}
}finally{await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
