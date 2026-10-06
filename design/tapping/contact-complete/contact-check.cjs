const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const URL = process.env.TAPPING_APP_URL || 'http://localhost:5176';
const OUT = path.resolve('design/tapping/contact-complete/screenshots');
const ids = ['hand', 'crown', 'brow', 'sideEye', 'underEye', 'nose', 'chin', 'collar', 'arm'];
const KEY = 'mentation.eftTapping.draft.v1';
const seed = (index) => ({version:1,stage:'round',concern:'worry',before:6,after:null,index,second:0,duration:0,slow:false,rounds:0,stopped:false,skipped:0,roundSkipped:false});
async function load(page, index) {
  await page.addInitScript(({key,data}) => {if(window.top!==window.self)return;localStorage.clear();localStorage.setItem(key,JSON.stringify(data));},{key:KEY,data:seed(index)});
  const epoch = new Date('2026-10-06T12:00:00Z');
  await page.clock.install({time:epoch});await page.clock.pauseAt(new Date(+epoch+60000));
  await page.goto(`${URL}/design/tapping/index.html`,{waitUntil:'domcontentloaded'});
  await page.locator('.tapping-experience').waitFor();
}
async function top(page) {await page.locator('.tapping-experience').evaluate(el=>{for(let p=el;p;p=p.parentElement)p.scrollTop=0;window.scrollTo(0,0);});}
(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const results=[];
  for(const width of [390,320])for(let index=0;index<9;index++){
    const height=width===320?640:844;
    const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await load(page,index);await page.locator(`.tap-point[data-point="${ids[index]}"]`).waitFor();
    await page.getByRole('button',{name:'Resume my round'}).click();
    assert.equal(await page.locator('.tap-contact-action h2').textContent(),'Place two fingertips here');
    const descriptor=await page.locator('.tap-contact-action p').textContent();assert.ok(descriptor.length>20);
    if(ids[index]==='sideEye')assert.equal(descriptor,'On the bone beside the outer corner of your eye.');
    for(const phase of ['place','tap']){
      if(phase==='tap')for(let t=0;t<(index===0?3:4);t++){await page.clock.runFor(1000);await page.locator('h1').textContent();}
      await top(page);
      const marker=await page.locator('.tap-point-core').boundingBox(),svg=await page.locator('.tap-main-art svg').boundingBox();
      assert.ok(marker.x>svg.x&&marker.x+marker.width<svg.x+svg.width&&marker.y>svg.y&&marker.y+marker.height<svg.y+svg.height,`${ids[index]} marker inside crop`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const stop=await page.getByRole('button',{name:'Stop round'}).boundingBox();assert.ok(stop.y+stop.height<=height,`${width} ${ids[index]} ${phase} stop visible: ${stop.y+stop.height}`);
      assert.equal(await page.locator('.tap-contact-action h2').textContent(),phase==='tap'?'Tap gently':'Place two fingertips here');
      await page.screenshot({path:path.join(OUT,`${ids[index]}-${phase}-${width}.png`),fullPage:true,animations:'disabled',scale:'css'});
    }
    await page.getByRole('button',{name:'Pause',exact:true}).click();const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);await page.clock.runFor(20000);
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).second,KEY),saved.second);
    assert.equal(await page.locator('.tap-contact-action h2').textContent(),'Rest here.');
    await page.getByRole('button',{name:'Resume my round'}).click();await page.clock.runFor(1000);
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).second,KEY),saved.second+1);
    assert.deepEqual(errors,[]);results.push(`${width}px ${ids[index]}: placement, rhythm, crop, controls, pause/resume passed`);await context.close();
  }
  // A delayed image cannot consume placement time; an error pauses, retains the
  // exact textual location, and permits an explicit resume or skip.
  for(const mode of ['delay','error']){
    const context=await browser.newContext({viewport:{width:320,height:640}});const page=await context.newPage();let release;
    if(mode==='delay')await page.route('**/media/tapping/crown-contact.png',async route=>{await new Promise(resolve=>{release=resolve;});await route.continue();});
    else await page.route('**/media/tapping/crown-contact.png',route=>route.abort());
    await load(page,1);if(mode==='delay')await page.getByRole('button',{name:'Resume my round'}).click();
    else await page.getByText('The image couldn’t load.',{exact:false}).waitFor();
    await page.clock.runFor(15000);assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).second,KEY),0);
    if(mode==='delay'){
      release();await page.locator('.tap-point').waitFor();await page.clock.runFor(4000);assert.equal(await page.locator('.tap-contact-action h2').textContent(),'Tap gently');
    }else{
      await page.getByText('The image couldn’t load.',{exact:false}).waitFor();assert.equal(await page.locator('.tap-point').count(),0);assert.equal(await page.locator('.tap-main-art image').count(),0);await top(page);const stop=await page.getByRole('button',{name:'Stop round'}).boundingBox();assert.ok(stop.y+stop.height<=640,'Error-state Stop remains visible');await page.screenshot({path:path.join(OUT,'image-error-320.png'),fullPage:true,animations:'disabled',scale:'css'});
      await page.getByRole('button',{name:'Resume my round'}).click();await page.clock.runFor(1000);assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).second,KEY),1);
    }
    await context.close();results.push(`${mode} image: passed`);
  }
  fs.writeFileSync(path.resolve('design/tapping/contact-complete/browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(results.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
