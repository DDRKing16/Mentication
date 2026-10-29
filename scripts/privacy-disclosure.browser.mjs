import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { browserFor } from './tara-tactician.browser-support.mjs';
const origin = process.env.PRIVACY_APP_ORIGIN || 'http://127.0.0.1:5230';
const evidence = process.env.PRIVACY_EVIDENCE_DIR || '/tmp/mentation-privacy';
const browser = await browserFor(), errors = [], results = [];
try {
  for (const width of [320, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    page.on('pageerror', error => errors.push(error.message));
    // Do not inject storage access into the app's sandboxed Home iframe.
    await page.addInitScript(() => { if (window === window.top) localStorage.setItem('haven_onboarded', '1'); });
    await page.goto(origin + '/settings');
    const backupSummary = page.getByText('Your saved history, notes and plans are stored on this device.', { exact: false });
    await backupSummary.waitFor();
    assert.match(await backupSummary.innerText(), /Optional website background check-ins use a server/);
    assert.match(await backupSummary.innerText(), /Deleting app data does not delete exported copies/);
    assert.equal(await page.getByText('Everything lives only on this phone.', { exact: false }).count(), 0);
    await page.goto(origin + '/privacy');
    await page.getByRole('heading', { name: 'Privacy in Mentication' }).waitFor();
    for (const textScale of [1, 2]) {
      await page.evaluate(scale => { document.documentElement.style.fontSize = `${16 * scale}px`; }, textScale);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.getByText('Browser notification ownership', { exact: false }).count(), 1);
      results.push({ width, textScale, noHorizontalOverflow: true });
    }
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.waitForURL(url => url.pathname !== '/privacy');
    await page.close();
  }
  assert.deepEqual(errors, []);
  const report = { results, backNavigation: true, settingsBackupDisclosure: true, pageErrors: errors,
    provenance: 'Local production Vite preview; DOM/layout checks, not physical-device accessibility evidence.' };
  mkdirSync(evidence, { recursive: true });
  writeFileSync(`${evidence}/browser-results.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
