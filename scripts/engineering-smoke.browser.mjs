import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { checkPracticeDialogs } from './practice-dialog-smoke.browser.mjs';
import { checkJourneyDialogs } from './journey-dialog-smoke.browser.mjs';
const playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browsers = (process.env.SMOKE_BROWSERS || 'chromium').split(',');
const port = Number(process.env.SMOKE_PORT ||4179);
const dialogFailures = [];
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
let serverLog = '';
server.stdout.on('data', data => { serverLog += data; });
server.stderr.on('data', data => { serverLog += data; });
async function context(browser, legacyDialog = false) {
  const value = await browser.newContext({ viewport: { width:390, height:844 }, hasTouch:true });
  await value.addInitScript(legacy => {
    if(window === window.top) localStorage.setItem('haven_onboarded','1');
    if (legacy && window.HTMLDialogElement) {
      for (const method of ['showModal', 'close']) {
        Object.defineProperty(HTMLDialogElement.prototype, method, { configurable:true, value:undefined });
      }
    }
  }, legacyDialog);
  return value;
}
async function ready(page) {
  await page.waitForFunction(() => {
    const home = document.querySelector('section[aria-label="MentiCation home"]');
    return home?.getAttribute('aria-busy') === 'false' && home.querySelector('iframe')?.getAttribute('aria-hidden') === 'false';
  }, null, { timeout:20000 });
}
async function checkHomeDialog(page, base) {
  await page.goto(base); await ready(page);
  const home = page.frameLocator('iframe[title="MentiCation home"]');
  const opener = home.locator('#accessibility-open'), dialog = home.locator('#accessibility-dialog');
  const before = await home.locator('body').evaluate(node => node.style.overflow);
  await opener.click(); await dialog.waitFor({ state:'visible' });
  // A native close event is queued: reopening in the same task must not allow
  // that stale event to tear down the new modal instance.
  await dialog.evaluate(async node => {
    node.querySelector('[data-close]').click();
    document.getElementById('accessibility-open').click();
    await new Promise(resolve => setTimeout(resolve,50));
  });
  assert(await dialog.isVisible(), 'Queued close must not dismiss the reopened Home dialog');
  await page.keyboard.press('Escape'); await dialog.waitFor({ state:'hidden' });
  assert.equal(await home.locator('body').evaluate(node => node.style.overflow), before);
  assert(await opener.evaluate(node => document.activeElement === node && !node.closest('[inert]')));
}

try {
  let listening = false;
  for(let attempt=0;attempt<100;attempt++) {
    if(server.exitCode !== null) throw Error(`Preview exited: ${serverLog}`);
    try { listening = (await fetch(origin)).ok; } catch { /* server starting */ }
    if(listening) break;
    await delay(100);
  }
  assert(listening, `Preview unavailable: ${serverLog}`);
  for(const name of browsers) {
    assert(['chromium','webkit'].includes(name),'Choose chromium or webkit');
    const browser = await playwright[name].launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox'] } : {});
    try {
      const normal=await context(browser), page=await normal.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin); await ready(page);
      assert.equal(await page.locator('html').evaluate(element=>element.scrollWidth>innerWidth+1),false,'Home overflows phone width');
      await page.goto(`${origin}/library`);
      await page.getByRole('textbox', { name: 'Search practices and restoring activities', exact: true }).waitFor();
      assert.equal(await page.locator('iframe[title="MentiCation home"]').count(),0,'Direct Library must not load hidden Home media');
      await page.goto(`${origin}/privacy`);
      await page.getByRole('heading',{name:'Privacy in Mentication',exact:true}).waitFor();
      assert.deepEqual(errors,[],'Ordinary entry produced a browser exception');
      await normal.close();
      const failed=await context(browser), recovery=await failed.newPage();
      await recovery.route('**/home.html*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Unavailable Home test</title>'}));
      await recovery.clock.install(); await recovery.goto(origin);
      await recovery.locator('iframe[title="MentiCation home"]').waitFor({state:'attached'});
      await recovery.clock.fastForward(13000);
      await recovery.getByRole('button',{name:'Retry home',exact:true}).waitFor();
      await recovery.getByRole('button',{name:'Open practices',exact:true}).click();
      await recovery.getByRole('textbox', { name: 'Search practices and restoring activities', exact: true }).waitFor();
      await recovery.goBack();
      await recovery.getByRole('button',{name:'Retry home',exact:true}).waitFor();
      await recovery.unroute('**/home.html*');
      await recovery.getByRole('button',{name:'Retry home',exact:true}).click();
      await recovery.clock.resume(); await ready(recovery);
      assert.equal(await recovery.getByRole('button',{name:'Retry home',exact:true}).count(),0,'Successful retry must remove fallback');
      await failed.close();
      console.log(`PASS ${name}: Home handshake, phone fit, direct Library isolation, privacy, fallback, Back and retry`);
      for (const legacy of [false, true]) {
        for (const [suite, check] of [['practice dialogs', checkPracticeDialogs], ['Journey dialogs', checkJourneyDialogs], ['Home dialog lifecycle', checkHomeDialog]]) {
          const dialogs = await context(browser, legacy), dialogPage = await dialogs.newPage(), dialogErrors = [];
          dialogPage.on('pageerror', error => dialogErrors.push(error.message));
          try {
            await check(dialogPage, origin);
            assert.deepEqual(dialogErrors, [], `${suite} produced browser exceptions`);
            console.log(`PASS ${name} ${legacy ? 'without native dialog APIs' : 'native dialog APIs'}: ${suite}`);
          } catch (error) {
            console.error(`FAIL ${name} ${legacy ? 'legacy' : 'native'} ${suite} at ${dialogPage.url()}`);
            console.error((await dialogPage.locator('body').innerText().catch(() => '')).slice(0,4000));
            dialogFailures.push(`${name} ${legacy ? 'legacy' : 'native'} ${suite}: ${error.message}`);
          } finally { await dialogs.close(); }
        }
      }
    } finally { await browser.close(); }
  }
  assert.deepEqual(dialogFailures, [], 'Dialog smoke checks failed');
} finally { server.kill('SIGTERM'); }
