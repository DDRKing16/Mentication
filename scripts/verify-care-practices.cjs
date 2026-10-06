/* Run with Vite on :5173 and Playwright available. No production route changes. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const harness = path.join(root, '.care-practices-check.html');
fs.writeFileSync(harness, `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Care practice check</title><link rel="icon" href="data:,"><div id="root"></div><script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import Care from '/src/components/care-practices/CarePracticeExperience.jsx';
import '/src/index.css';
import '/node_modules/@fontsource/eb-garamond/latin-400.css';
import '/node_modules/@fontsource/hanken-grotesk/latin-400.css';
const id = new URLSearchParams(location.search).get('id');
window.results=[];window.exits=0;
createRoot(document.getElementById('root')).render(React.createElement(Care,{id,onComplete:r=>window.results.push(r),onExit:()=>window.exits++}));
</script></html>`);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const id of ['selfCompassion', 'unhook', 'makeRoom']) {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR',e.message); });
      page.on('console', m => { if(m.type()==='error') console.error(m.text()); });
      const click = name => page.getByRole('button', { name, exact: true }).click();
      const visit = () => page.goto(`http://localhost:5173/.care-practices-check.html?id=${id}`);
      await visit(); await click('Begin');
      assert.equal(await page.locator('.care-rating [aria-pressed=true]').count(), 0);
      const question = await page.locator('.care-rating legend').textContent();
      await click('0 of 10'); await click('Continue');
      await page.getByLabel(id === 'selfCompassion' ? 'The critical line' : id === 'unhook' ? 'The sticky thought' : 'The feeling', { exact: true }).fill('Synthetic private test');
      await click('Continue');
      await page.locator('.care-choices button').first().click();
      await click(id === 'makeRoom' ? 'Try a little room' : 'Try this response');
      await page.reload(); await click('Resume practice');
      assert.equal(await page.locator('.care-response').count(), 1);
      assert.equal(await page.locator('h1').evaluate(e => document.activeElement === e), true);
      assert.equal(await page.locator('.care-halo').evaluate(e => getComputedStyle(e).animationName), 'none');
      await page.screenshot({ path: `/tmp/${id}-practice-mobile.png`, fullPage: true });
      await page.setViewportSize({ width: 320, height: 640 });
      await page.evaluate(() => document.documentElement.classList.add('large-text'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.evaluate(() => document.documentElement.classList.remove('large-text'));
      await page.setViewportSize({ width: 375, height: 812 });
      if (id === 'makeRoom') { await click('Stop practice and look around'); await click('Choose a next step'); }
      else await click('Choose my next step');
      await page.locator('.care-choices button').first().click(); await click('Keep it as my next step');
      assert.equal(await page.locator('.care-rating legend').textContent(), question);
      await click('0 of 10'); await click('Skip rating');
      assert.match(await page.locator('.care-card').textContent(), /one or both ratings were left blank/);
      // Force quota failure, verify honest feedback, restore and retry.
      await page.evaluate(() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if(k==='mentation.carePractices.saved.v1') throw Error('quota'); return window.originalSet.call(this,k,v); }; });
      await click('Save my card on this device');
      assert.match(await page.getByRole('alert').textContent(), /has not been saved/);
      await page.evaluate(() => { Storage.prototype.setItem = window.originalSet; });
      await click('Save my card on this device');
      await page.getByText('Saved on this device. Find this card here next time.').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: `/tmp/${id}-complete-mobile.png`, fullPage: true });
      await click('Finish');
      const results = await page.evaluate(() => window.results);
      assert.equal(results.length, 1); assert.equal(results[0].outcome.assessment.before, 0); assert.equal(results[0].outcome.assessment.after, null); assert.equal(results[0].outcome.actionStatus, 'planned');
      assert.equal(await page.evaluate(() => localStorage.getItem('mentation.flagship.active.v1')), null);
      await visit(); await click('Open my saved card');
      await click('Delete saved card');
      assert.equal(await page.evaluate(id => JSON.parse(localStorage.getItem('mentation.carePractices.saved.v1'))[id], id), undefined);
      // Repeat with both ratings blank and no typed content; finish is still useful.
      await click('Begin'); await click('Skip rating'); await click('Keep the words in my mind');
      await click(id === 'makeRoom' ? 'Not now — stay with the room' : 'Go straight to a useful action');
      if (id === 'makeRoom') await click('Choose a next step');
      await click('No next step for now'); await click('Skip rating');
      await click('Practise again');
      await page.getByRole('button', { name: 'Begin', exact: true }).focus(); await page.keyboard.press('Enter');
      await page.getByRole('button', { name: '10 of 10', exact: true }).focus(); await page.keyboard.press('Space');
      assert.equal(await page.getByRole('button', { name: '10 of 10', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.evaluate(() => { window.originalRemove=Storage.prototype.removeItem; Storage.prototype.removeItem=()=>{throw Error('blocked');}; });
      await click('Delete draft and leave');
      await page.getByRole('alert').filter({hasText:'could not be deleted'}).waitFor();
      await page.evaluate(() => { Storage.prototype.removeItem=window.originalRemove; });
      await click('Delete draft and leave'); assert.equal(await page.evaluate(() => window.exits), 1);
      // Storage-disabled draft is visible, never a silent save promise.
      await visit(); await click('Begin');
      await page.evaluate(() => { Storage.prototype.setItem = () => { throw Error('blocked'); }; });
      await click('Continue');
      await page.getByRole('alert').filter({ hasText: 'could not save your draft' }).waitFor();
      await context.close();
      console.log(`PASS ${id}: mobile, resume, matched/blank ratings, save failure/retry/delete, repeat, consent, keyboard, reduced motion`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); fs.unlinkSync(harness); }
})().catch(error => { console.error(error); process.exitCode = 1; });
