const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const OUT = path.resolve('design/tapping/contact-gate/screenshots');
const BEFORE = process.env.TAPPING_BEFORE_URL || 'http://localhost:5174/design/tapping/index.html';
const AFTER = process.env.TAPPING_GATE_URL || 'http://localhost:5175/design/tapping/contact-gate/index.html';
const KEY = 'mentation.eftTapping.draft.v1';
const states = ['entry', 'place', 'tap', 'lower', 'nochange'];
const draftFor = state => ({ version: 1, stage: state === 'place' || state === 'tap' ? 'round' : 'result', concern: 'worry', before: 6, after: state === 'nochange' ? 6 : state === 'lower' ? 3 : null, index: 3, second: 0, duration: 60, slow: false, rounds: state === 'lower' || state === 'nochange' ? 1 : 0, stopped: false, skipped: 0, roundSkipped: false });
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = [];
  for (const width of [390, 320]) for (const version of ['before', 'after']) for (const state of states) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 640 : 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({ key, data, state }) => { if (window.top !== window.self) return; localStorage.clear(); if (state !== 'entry') localStorage.setItem(key, JSON.stringify(data)); }, { key: KEY, data: draftFor(state), state });
    const epoch = new Date('2026-10-06T12:00:00Z'); await page.clock.install({ time: epoch }); await page.clock.pauseAt(new Date(epoch.getTime() + 60000));
    await page.goto(version === 'before' ? BEFORE : AFTER); await page.locator('.tapping-experience').waitFor();
    if (state === 'place' || state === 'tap') {
      await page.getByRole('button', { name: 'Resume my round' }).click();
      if (state === 'tap') { for (let i = 0; i < 4; i++) { await page.clock.runFor(1000); await page.locator('h1').textContent(); } }
      if (version === 'after') {
        assert.equal(await page.locator('.tap-contact-action h2').textContent(), state === 'place' ? 'Place two fingertips here' : 'Tap gently');
        assert.equal(await page.getByText('FIND YOUR PLACE', { exact: true }).count(), 0);
        assert.equal(await page.getByText('LET YOUR HAND SETTLE HERE', { exact: true }).count(), 0);
        assert.equal(await page.locator('.tap-round-title p').count(), 0);
        assert.equal(await page.locator('.tap-point[data-point="sideEye"]').count(), 1);
        assert.equal(await page.getByRole('button', { name: 'Pause', exact: true }).evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
      }
    }
    await page.locator('.tapping-experience').evaluate(el => { for (let p = el; p; p = p.parentElement) p.scrollTop = 0; window.scrollTo(0, 0); });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (state === 'place' || state === 'tap') {
      const stop = await page.getByRole('button', { name: 'Stop round' }).boundingBox();
      assert.ok(stop.y + stop.height <= (width === 320 ? 640 : 844), `${version} ${width} ${state} stop in view`);
      if (version === 'after') {
        const marker = await page.locator('.tap-point-core').boundingBox(), svg = await page.locator('.tap-main-art svg').boundingBox();
        assert.ok(marker.x > svg.x && marker.x + marker.width < svg.x + svg.width && marker.y > svg.y && marker.y + marker.height < svg.y + svg.height);
      }
    }
    if (state === 'nochange') { assert.deepEqual(await page.locator('.tap-comparison strong').allTextContents(), ['6', '6']); assert.match(await page.locator('.tap-result').textContent(), /rating is unchanged/); }
    await page.locator('svg image').evaluateAll(images => Promise.all(images.map(image => { const img = new Image(); img.src = image.getAttribute('href'); return img.decode(); })));
    await page.screenshot({ path: path.join(OUT, `${version}-${state}-${width}.png`), fullPage: true, animations: 'disabled', scale: 'css' });
    assert.deepEqual(errors, []); results.push(`${version} ${width}px ${state}: passed`);
    await context.close();
  }
  console.log(results.join('\n')); await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
