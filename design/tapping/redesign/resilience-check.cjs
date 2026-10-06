const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const BASE = process.env.TAPPING_APP_URL || 'http://localhost:5174';
const DRAFT = 'mentation.eftTapping.draft.v1';
const draft = {version:1,stage:'result',concern:'worry',before:0,after:0,index:8,second:0,duration:126,rounds:1,skipped:0,stopped:false,slow:false,roundSkipped:false};
(async () => {
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const p = await browser.newPage({viewport:{width:320,height:640}});
  await p.addInitScript(({key,draft})=>{localStorage.setItem('haven_onboarded','1');if (!sessionStorage.getItem('tap-resilience-seeded')) { localStorage.setItem(key,JSON.stringify(draft)); sessionStorage.setItem('tap-resilience-seeded','1'); }},{key:DRAFT,draft});
  await p.goto(BASE+'/library');await p.getByText('Gentle Tapping',{exact:true}).click();await p.locator('.tap-result').waitFor();
  await p.locator('.tap-result .journey-takeaway summary').click();
  const note = p.locator('.tap-result .journey-takeaway textarea');await note.fill('Light touch. Plenty of time.');
  // Force actual shared local persistence failure; verify no false saved acknowledgement.
  await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='mentation.takeaways.v1')throw new Error('Blocked for test');return window.originalSet.call(this,k,v)}});
  await p.getByRole('button',{name:'Save on this device',exact:true}).click();await p.getByRole('alert').filter({hasText:'Could not save'}).waitFor();
  assert.equal(await note.inputValue(),'Light touch. Plenty of time.');assert.equal(await p.evaluate(()=>localStorage.getItem('mentation.takeaways.v1')),null);
  await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);await p.getByRole('button',{name:'Save on this device',exact:true}).click();await p.getByRole('status').filter({hasText:'Saved on this device.'}).waitFor();
  assert.ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.takeaways.v1')).some(x=>x.text==='Light touch. Plenty of time.')));
  await p.evaluate(()=>{Storage.prototype.setItem=function(k,v){if(k==='mentation.takeaways.v1')throw new Error('Blocked for test');return window.originalSet.call(this,k,v)}});
  await p.getByRole('button',{name:'Delete saved note'}).click();await p.getByRole('alert').filter({hasText:'Could not delete'}).waitFor();assert.equal(await note.inputValue(),'Light touch. Plenty of time.');
  await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);await p.getByRole('button',{name:'Delete saved note'}).click();assert.equal(await note.inputValue(),'');
  await p.locator('.tap-storage summary').click();
  await p.evaluate(()=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k==='mentation.eftTapping.draft.v1')throw new Error('Blocked for test');return window.originalRemove.call(this,k)}});
  await p.getByRole('button',{name:'Delete draft and start fresh'}).click();await p.getByRole('alert').filter({hasText:'draft could not be deleted'}).waitFor();assert.equal(await p.locator('.tap-comparison strong').first().textContent(),'0');
  await p.getByRole('button',{name:'Finish',exact:true}).click();await p.getByRole('alert').filter({hasText:'didn’t finish'}).waitFor();assert.equal(await p.locator('.tap-comparison strong').first().textContent(),'0');
  await p.evaluate(()=>Storage.prototype.removeItem=window.originalRemove);
  assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).before,DRAFT),0);
  // An unreadable draft must remain intact until the user explicitly deletes it.
  await p.evaluate(key=>localStorage.setItem(key,'{bad'),DRAFT);await p.reload();await p.getByRole('button',{name:'Body tension'}).waitFor();
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),DRAFT),'{bad');
  await p.locator('.tap-storage summary').click();await p.getByRole('button',{name:'Delete draft and start fresh'}).click();await p.getByRole('button',{name:'Body tension'}).waitFor();
  assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage,DRAFT),'choose');
  // OS and app reduced-motion settings both disable motion, even when a still-light toggle is requested.
  await p.evaluate(()=>localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion:true,largeText:true,highContrast:true})));await p.reload();await p.getByRole('button',{name:'Body tension'}).waitFor();
  await p.getByRole('button',{name:'Body tension'}).click();await p.getByRole('button',{name:'Skip this rating'}).click();await p.getByRole('button',{name:'Adjust your round'}).click();assert.equal(await p.getByRole('button',{name:'Still light: On'}).isDisabled(),true);
  await p.getByRole('button',{name:'Begin my round'}).click();assert.equal(await p.locator('.tap-ripple').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await p.locator('.tap-cue p').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=24, 'Large text must not shrink the tapping phrase');
  await p.getByRole('button',{name:'Exit tapping'}).click();await p.waitForURL(BASE+'/');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length),0);
  console.log('PASS: integrated save failure/retry/delete failure, retained text, no false save; draft-delete/completion failure retains zero; corrupt draft protected and explicitly recoverable; app reduced motion + large text + contrast at 320px; exit without session credit.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
