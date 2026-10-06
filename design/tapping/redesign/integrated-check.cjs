const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const BASE = process.env.TAPPING_APP_URL || 'http://localhost:5174';
const OUT = path.resolve('design/tapping/redesign/after');
const DRAFT = 'mentation.eftTapping.draft.v1';
const POINTS = ['Side of hand','Top of head','Inner eyebrow','Side of eye','Under eye','Under nose','Chin crease','Below collarbone','Under arm'];
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const checks = [];
  for (const width of [320, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 640 : 844 }, deviceScaleFactor: 2 });
    let page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { if (window.top === window.self) localStorage.setItem('haven_onboarded', '1'); });
    await page.goto(BASE + '/library');
    await page.getByText('Gentle Tapping', { exact: true }).click();
    await page.getByRole('button', { name: 'Body tension' }).waitFor({ timeout: 20000 });
    await page.getByRole('button', {name:'Starting Gentle Tapping. Tap to skip.'}).waitFor({state:'hidden',timeout:20000});
    const resetScroll = () => page.locator('.tapping-experience').evaluate(el => { for (let parent = el; parent; parent = parent.parentElement) parent.scrollTop = 0; window.scrollTo(0, 0); });
    const shot = async name => { await resetScroll(); return page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true, animations: 'disabled', scale: 'css' }); };
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await shot('entry'); await noOverflow();
    await page.getByRole('button', { name: 'Body tension' }).click();
    const question = await page.locator('.tap-checkin h1').textContent();
    await shot('rating'); await noOverflow();
    await page.getByRole('button', { name: '6 out of 10', exact: true }).click();
    assert.match(await page.locator('.tap-ready h1').textContent(), /You set the pace/);
    await shot('ready');
    assert.equal(await page.locator('.tap-settings').count(), 0);
    await page.clock.install();
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
    const advance = async n => { for (let i = 0; i < n; i++) { await page.clock.runFor(1000); await page.locator('.tapping-experience').textContent(); } };
    await page.getByRole('button', { name: 'Begin my round' }).click();
    // No point-advance clicks during this complete guided round.
    for (let i = 0; i < POINTS.length; i++) {
      assert.equal(await page.locator('.tap-round h1').textContent(), POINTS[i]);
      await resetScroll();
      await noOverflow();
      const pauseBox = await page.getByRole('button', { name: 'Pause', exact: true }).boundingBox();
      const stopBox = await page.getByRole('button', { name: 'Stop round', exact: true }).boundingBox();
      assert.ok(pauseBox.y + pauseBox.height <= (width === 320 ? 640 : 844), 'Pause should be in view');
      assert.ok(stopBox.y + stopBox.height <= (width === 320 ? 640 : 844), 'Stop should be in view');
      // Marker and sculpted art share the same coordinate space; verify marker stays inside the active frame.
      const marker = await page.locator('.tap-point-core').boundingBox();
      const svg = await page.locator('.tap-main-art svg').boundingBox();
      assert.ok(marker.x >= svg.x && marker.x + marker.width <= svg.x + svg.width);
      assert.ok(marker.y >= svg.y && marker.y + marker.height <= svg.y + svg.height);
      await shot(`point-${i}`);
      if (i === 2) {
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        const savedSecond = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).second, DRAFT);
        await advance(20);
        assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).second, DRAFT), savedSecond);
        await shot('paused');
        const resumeBox = await page.getByRole('button', { name: 'Resume my round', exact: true }).boundingBox();
        assert.ok(resumeBox.y + resumeBox.height <= (width === 320 ? 640 : 844), 'Resume should be in view');
        await page.getByRole('button', { name: 'Resume my round', exact: true }).click();
      }
      await advance(i === 0 ? 30 : 12);
    }
    assert.equal(await page.locator('.tap-checkin h1').textContent(), question);
    await page.getByRole('button', { name: '3 out of 10', exact: true }).click();
    await shot('result');
    assert.match(await page.locator('.tap-result').textContent(), /rated the discomfort lower/);
    const finish = await page.getByRole('button', { name: 'Finish', exact: true }).boundingBox();
    const save = await page.locator('.tap-result .journey-takeaway summary').boundingBox();
    assert.ok(save.y > finish.y, 'Optional saving must follow the outcome/action');
    await page.getByRole('button', { name: 'Try another gentle round' }).click();
    await advance(5);
    await page.getByRole('button', { name: 'Another way', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await advance(30);
    await page.getByRole('button', { name: 'Return to Gentle Tapping' }).click();
    await page.getByRole('button', { name: 'Resume my round' }).waitFor();
    await shot('alternative-return');
    // Reopen the persisted practice in a fresh real-clock browser context.
    // This also tests a browser restart, without carrying Playwright's clock
    // offset into the shared Framer Motion route threshold.
    const persisted = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    await context.close();
    const returnContext = await browser.newContext({ viewport: { width, height: width === 320 ? 640 : 844 }, deviceScaleFactor: 2 });
    page = await returnContext.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(data => { if (window.top !== window.self) return; if (!sessionStorage.getItem('tapping-test-restored')) { for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value); sessionStorage.setItem('tapping-test-restored', '1'); } }, persisted);
    await page.goto(BASE + '/library');
    await page.getByText('Gentle Tapping', { exact: true }).click();
    await page.getByRole('button', { name: 'Resume my round' }).waitFor({ timeout: 20000 });
    await page.getByRole('button', {name:'Starting Gentle Tapping. Tap to skip.'}).waitFor({state:'hidden',timeout:20000});
    assert.equal(await page.locator('.tap-round h1').textContent(), 'Side of hand');
    await page.getByRole('button', { name: 'Stop round' }).click();
    await page.getByRole('button', { name: 'Skip this rating' }).click();
    assert.equal(await page.locator('.tap-comparison strong').nth(1).textContent(), '—');
    const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), DRAFT);
    assert.equal(restored.before, 6); assert.equal(restored.after, null); assert.equal(restored.rounds, 1); assert.equal(restored.stopped, true);
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await page.getByRole('button', { name: 'Skip and finish' }).waitFor();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), DRAFT), null);
    await page.getByRole('button', { name: 'Skip and finish' }).click();
    await page.getByRole('button', { name: 'Skip and finish' }).waitFor({ state: 'hidden' });
    await page.locator('body').textContent();
    assert.deepEqual(errors, []);
    checks.push(`${width}px: integrated entry, two-activation reveal, all 9 automatic points, in-frame markers, matched question, full round, pause/resume, repeat, alternative return, browser restart paused, interrupted post-rating blank, host finish and goal skip; no horizontal overflow or browser errors.`);
    await returnContext.close();
  }
  console.log(checks.join('\n')); await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
