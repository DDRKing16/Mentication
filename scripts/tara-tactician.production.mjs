// Run after building the isolated preview and serving its output directory.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const url = process.env.TARA_PREVIEW_URL || 'http://127.0.0.1:5180/design/tara-tactician/preview.html';
const evidence = process.env.TARA_EVIDENCE_DIR || 'design/tara-tactician/verification';
mkdirSync(evidence, { recursive: true });
const errors = []; const failures = []; const captures = []; const checks = [];
const click = (page, name) => page.getByRole('button', { name, exact: true }).click();
const key = 'mentation.tara-tactician.v1';
async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready); await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const file = `${name}.png`; await page.screenshot({ path: `${evidence}/${file}`, fullPage: true });
  const bytes = readFileSync(`${evidence}/${file}`);
  captures.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), dimensions: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, rootFontSize: getComputedStyle(document.documentElement).fontSize })) });
}
try {
  for (const width of [390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => failures.push(request.url()));
    await page.goto(url); await page.getByRole('heading', { level: 1 }).waitFor(); await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.tara-character img').evaluate(node => node.complete && node.naturalWidth > 0), true);
    if (width === 320) await page.addStyleTag({ content: 'html { font-size:24px!important; }' });
    await click(page, 'Prepare for something'); await click(page, 'A conversation'); await click(page, 'Finding the words');
    await click(page, 'Rehearse this move (optional)'); await page.getByRole('button', { name: /^Use my move/ }).click();
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft.rehearsed, key), false);
    await click(page, 'I tried it — take this move'); await click(page, 'Make it smaller'); await click(page, 'Back to event');
    await capture(page, `live-production-${width}${width === 320 ? '-large' : ''}`);
    await click(page, 'Event finished'); assert.equal(await page.locator('#tara-event-status option').first().innerText(), 'Choose an answer');
    assert.equal(await page.locator('#tara-event-status option[value=unknown]').count(), 1);
    await capture(page, `reflection-production-${width}${width === 320 ? '-large' : ''}`);
    await page.getByLabel('What did I do?', { exact: true }).selectOption(width === 390 ? 'finished' : 'unknown');
    await click(page, width === 390 ? 'Part of it happened' : 'I’m not sure yet'); await click(page, 'Keep this reflection');
    await click(page, 'Save recap on this device (optional)'); await page.reload(); await page.getByRole('heading', { name: 'What you learned.', exact: true }).waitFor();
    await click(page, 'Finish'); const events = await page.evaluate(() => window.taraReviewEvents);
    assert.equal(events.filter(item => item.action === 'completed').length, 1);
    assert.equal(events.find(item => item.outcome).outcome.predictionResult, width === 390 ? 'partly' : 'unsure');
    assert.equal(events.find(item => item.outcome).outcome.predictionComparison, null);
    assert.equal(events.find(item => item.outcome).outcome.rehearsed, true);
    await page.reload(); await click(page, 'Close recap'); assert.equal(await page.evaluate(() => window.taraReviewEvents.filter(item => item.action === 'completed').length), 0);
    checks.push(`${width}px production assets/fonts/art, prepare/rehearse/explicit practice/live support/return/reflection/save/refresh/finish/revisit; prediction result independent of difficulty; no duplicate completion`);
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  writeFileSync(`${evidence}/production-results.json`, JSON.stringify({ passed: checks, pageErrors: errors, failedRequests: failures, captures, fixtureProvenance: 'Synthetic browser interaction with authored suggested moves. No user data or real-world outcome claim.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, failedRequests: failures, captures }, null, 2));
} finally { await browser.close(); }
