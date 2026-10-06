/* Run with Playwright available in the execution environment; no app dependency added. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install();await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+100));
const base=process.env.TAPPING_PREVIEW_URL||'http://localhost:5173/design/tapping/index.html';
const out=process.env.TAPPING_SCREENSHOTS||'/tmp/tapping-screenshots';fs.mkdirSync(out,{recursive:true});
const shot=async name=>page.screenshot({path:`${out}/${name}.png`,fullPage:true,animations:'disabled'});
// Step timers need React to commit between ticks. No accelerated protocol in production.
const advance=async seconds=>{for(let i=0;i<seconds;i++){await page.clock.runFor(1000);await page.locator('h1').textContent();}};
await page.goto(base);await shot('01-entry');
await page.getByRole('button',{name:'Body tension'}).click();await shot('02-before');
await page.getByRole('button',{name:'6 out of 10',exact:true}).click();
assert.match(await page.locator('h1').textContent(),/You set the pace/);await shot('03-ready');
await page.getByRole('button',{name:'Begin my round'}).click();await shot('04-hand');
await advance(30);assert.equal(await page.locator('h1').textContent(),'Top of head');
await advance(12);assert.equal(await page.locator('h1').textContent(),'Inner eyebrow');await advance(4);await shot('05-eyebrow');
await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await page.getByRole('progressbar').getAttribute('aria-valuenow');await advance(20);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),paused);await shot('06-paused');
await page.getByRole('button',{name:'Resume my round',exact:true}).click();await advance(8);assert.equal(await page.locator('h1').textContent(),'Side of eye');
await advance(48);assert.equal(await page.locator('h1').textContent(),'Below collarbone');await shot('07-collarbone');
await advance(12);assert.equal(await page.locator('h1').textContent(),'Under arm');await shot('08-underarm');await advance(12);
assert.equal(await page.locator('h1').textContent(),'How intense is the discomfort right now?');
await page.getByRole('button',{name:'3 out of 10',exact:true}).click();await shot('09-result');assert.match(await page.locator('.tap-result').textContent(),/lower/);
await page.getByRole('button',{name:'Try another gentle round'}).click();assert.equal(await page.locator('h1').textContent(),'Side of hand');
await page.getByRole('button',{name:'Stop round',exact:true}).click();await page.getByRole('button',{name:'Skip this rating'}).click();
assert.match(await page.locator('.tap-result').textContent(),/No comparison/);await page.getByRole('button',{name:'Finish',exact:false}).click();
let result=JSON.parse(await page.locator('pre').textContent());assert.equal(result.before,6);assert.equal(result.after,null);assert.equal(result.roundsCompleted,1);assert.equal(result.stopped,true);
await page.goto(base);await page.getByRole('button',{name:'Just help me ground'}).click();await page.getByRole('button',{name:'Skip this rating'}).click();await page.getByRole('button',{name:'Begin my round'}).click();await page.getByRole('button',{name:'Stop round'}).click();await page.getByRole('button',{name:'Skip this rating'}).click();await page.getByRole('button',{name:'Try a different approach'}).click();
result=JSON.parse(await page.locator('pre').textContent());assert.equal(result.before,null);assert.equal(result.after,null);assert.equal(result.completed,false);assert.equal(result.mode,'grounding');assert.equal(result.changeCourse,true);
await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);await page.getByRole('button',{name:'Body tension'}).click();await page.getByRole('button',{name:'Skip this rating'}).click();await page.getByRole('button',{name:'Begin my round'}).click();assert.equal(await page.locator('.tap-ripple').evaluate(e=>getComputedStyle(e).animationName),'none');
await page.evaluate(()=>localStorage.removeItem('mentation.eftTapping.draft.v1'));await page.goto(base);await page.locator('h1').focus();await page.keyboard.press('Tab');assert.match(await page.evaluate(()=>document.activeElement.textContent),/Body tension/);await page.keyboard.press('Enter');assert.match(await page.locator('h1').textContent(),/How intense/);
for(const width of [320,390,430,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
assert.deepEqual(errors,[]);console.log('PASS: mobile timed journey; exact before/after; pause/resume; repeat; stop; skip blanks; grounding mode; change-course payload; keyboard; reduced motion; 320/390/430/768 overflow; no browser errors.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
