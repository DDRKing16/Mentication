// Actual compiled app route, not the isolated development fixture. Vite preview
// must be serving a finished npm run build. Supports the usual browser overrides.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const origin = process.env.TARA_APP_ORIGIN || 'http://127.0.0.1:4173';
const evidence = process.env.TARA_EVIDENCE_DIR || 'design/tara-tactician/guided-redesign/verification';
mkdirSync(evidence, { recursive: true });
const errors = []; const failedRequests = []; const navigationCancellations = []; const externalRequests = []; const captures = []; const passed = [];
const key = 'mentation.tara-tactician.v1';
const click = (page, name) => page.getByRole('button', { name, exact: true }).click();
const choice = (page, name) => page.getByRole('button', { name: new RegExp('^' + name) }).click();
const draft = page => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.draft, key);
const sessions = page => page.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]'));
async function capture(page, name) {
 await page.evaluate(() => document.fonts.ready); await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
 const file = `${name}.png`; await page.screenshot({ path: `${evidence}/${file}`, fullPage: true }); const data = readFileSync(`${evidence}/${file}`);
 captures.push({ file, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), dimensions: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, rootFontSize: getComputedStyle(document.documentElement).fontSize, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight })) });
}
try {
 for (const width of [390, 320]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => { if (window !== window.top) return; localStorage.setItem('haven_onboarded', '1'); localStorage.setItem('haven.a11y.v2', JSON.stringify({ reducedMotion: true, ambientSoundscape: false })); });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {
   const failure = { url: request.url(), error: request.failure()?.errorText };
   // Leaving the host home iframe cancels document, art and ambient loads.
   // Only local home-frame browser cancellations are exempt; HTTP errors and
   // failures in the Tara frame always fail. Record every exemption for review.
   const homeLoads = ['/home.html', '/media/brand/mentation-primary.png', '/audio/home-ambient.mp3'].map(path => origin + path);
   if (failure.error === 'net::ERR_ABORTED' && homeLoads.includes(failure.url)) navigationCancellations.push(failure);
   else failedRequests.push(failure);
  });
  page.on('response', response => { if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
  page.on('request', request => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto(`${origin}/tara-tactician`); await page.getByRole('button', { name: 'Plan with Tara', exact: true }).waitFor();
  if (width === 320) await page.addStyleTag({ content: 'html{font-size:24px!important}' }); await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.tara-character img').first().evaluate(node => node.complete && node.naturalWidth > 0), true);
  const button = await page.getByRole('button', { name: 'Plan with Tara', exact: true }).boundingBox(); assert.equal(button.y + button.height < 844, true, 'entry action visible with enlarged text');
  await capture(page, `production-entry-${width}`); await click(page, 'Plan with Tara'); await choice(page, 'A conversation'); await choice(page, 'Holding a boundary'); await choice(page, 'Name one clear limit');
  await click(page, 'Edit my move'); await page.getByRole('textbox', { name: 'My first move', exact: true }).fill('Production private first move.'); await click(page, 'Keep this wording');
  await click(page, 'Try it with Tara'); await choice(page, 'Use my first move'); assert.deepEqual((await draft(page)).practice.tried, [false, false]);
  await click(page, 'I tried it — practise a way back'); await choice(page, 'Repeat the limit'); await click(page, 'I tried it — keep my pocket plan');
  assert.deepEqual((await draft(page)).practice.tried, [true, true]); assert.equal((await draft(page)).practice.triedWordings[0], 'Production private first move.');
  await capture(page, `production-pocket-${width}`); await click(page, 'Save plan & leave for now'); await page.waitForURL(`${origin}/`); assert.equal((await sessions(page)).length, 0);
  await page.goto(`${origin}/tara-tactician`); await page.getByRole('heading', { name: 'Your pocket plan.', exact: true }).waitFor();
  if (width === 320) await page.addStyleTag({ content: 'html{font-size:24px!important}' }); await click(page, 'Open live support'); await choice(page, 'Find my words'); await click(page, 'Back to my moment'); await page.goBack();
  await page.getByRole('heading', { name: 'Find your way back.', exact: true }).waitFor(); await page.reload(); await page.getByRole('heading', { name: 'Find your way back.', exact: true }).waitFor(); await click(page, 'Back to my moment');
  if (width === 320) await page.addStyleTag({ content: 'html{font-size:24px!important}' }); await capture(page, `production-live-${width}`);
  await click(page, 'Return to reflect'); await choice(page, width === 390 ? 'Took part in all or some' : 'I’m not sure yet'); await choice(page, width === 390 ? 'Part of it happened' : 'I’m not sure yet');
  await capture(page, `production-reflection-${width}`); await click(page, 'Keep my reflection'); await choice(page, 'Make the next attempt smaller'); await capture(page, `production-takeaway-${width}`);
  await click(page, 'Save reflection on this device (optional)'); await click(page, 'Finish');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]').length === 1);
  const records = await sessions(page); assert.equal(JSON.stringify(records).includes('Production private'), false); assert.equal(records[0].intensity_end, null);
  assert.equal(records[0].intervention_outcome.predictionResult, width === 390 ? 'partly' : 'unsure'); assert.equal(records[0].intervention_outcome.rehearsed, true);
  await page.goto(`${origin}/tara-tactician`); await page.getByRole('button', { name: 'Close reflection', exact: true }).waitFor(); await click(page, 'Close reflection');
  assert.equal((await sessions(page)).length, 1);
  passed.push(`${width}px compiled actual /tara-tactician→/reset route: visible primary action, fonts/art, named words, two explicit practice beats, save/leave/reopen, support/Back/refresh, truthful reflection and next-use plan, one private-safe completed session and no duplicate on revisit`); await context.close();
 }
 assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []); assert.deepEqual(externalRequests, []);
 writeFileSync(`${evidence}/production-results.json`, JSON.stringify({ passed, pageErrors: errors, failedRequests, navigationCancellations, externalRequests, captures, fixtureProvenance: 'Synthetic automated user choices only; no real user data or claimed real-world result.' }, null, 2)); console.log(JSON.stringify({ passed: passed.length, scenarios: passed, pageErrors: errors, failedRequests, navigationCancellations, externalRequests, captures }, null, 2));
} finally { await browser.close(); }
