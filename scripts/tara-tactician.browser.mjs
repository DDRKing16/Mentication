// Isolated component checks; does not register or alter the host application.
// Vite must be running. Optional: PLAYWRIGHT_MODULE, CHROME_PATH, TARA_PREVIEW_URL.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const url = process.env.TARA_PREVIEW_URL || 'http://127.0.0.1:5173/design/tara-tactician/preview.html';
const evidence = process.env.TARA_EVIDENCE_DIR || '/workspace/tara-evidence';
mkdirSync(evidence, { recursive: true });
const results = []; const errors = [];
const key = 'mentation.tara-tactician.v1';
const click = (page, name) => page.getByRole('button', { name, exact: true }).click();
async function pageFor(width = 390, init) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url); await page.getByRole('heading', { level: 1 }).waitFor();
  return { page, context };
}
async function heading(page, text) { await page.getByRole('heading', { level: 1, name: text, exact: true }).waitFor(); }
async function prepare(page) {
  await click(page, 'Prepare for something');
  assert.equal(await page.getByRole('button', { name: 'Finding the words', exact: true }).count(), 0);
  await click(page, 'A conversation');
  assert.equal(await page.getByLabel('What might happen?', { exact: true }).count(), 0);
  await click(page, 'Finding the words');
  await page.getByLabel('What might happen?', { exact: true }).fill('I might lose my place.');
  await click(page, 'That fits — make my plan');
  await page.getByLabel('Do', { exact: true }).fill('Say “I need a moment.”');
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow');
}
async function eventCount(page) { return page.evaluate(() => window.taraReviewEvents.filter(event => event.action === 'completed').length); }
try {
  {
    const { page, context } = await pageFor();
    await noOverflow(page); await page.screenshot({ path: `${evidence}/entry-390.png`, fullPage: true });
    await prepare(page); await noOverflow(page);
    await page.screenshot({ path: `${evidence}/plan-390.png`, fullPage: true });
    await page.reload(); await heading(page, 'A plan you can actually use.');
    assert.equal(await page.getByLabel('Do', { exact: true }).inputValue(), 'Say “I need a moment.”');
    await click(page, 'Go back'); await heading(page, 'What are you facing?');
    assert.equal(await page.getByLabel('What might happen?', { exact: true }).inputValue(), 'I might lose my place.');
    await click(page, 'That fits — make my plan');
    await click(page, 'Rehearse once (optional)');
    await page.getByLabel('Words I want to try (optional)').fill('I need a moment.');
    await click(page, 'I tried it — use my plan');
    await click(page, 'My mind is racing');
    await heading(page, 'A little support, right here.');
    assert.equal(await eventCount(page), 0);
    await page.screenshot({ path: `${evidence}/support-390.png`, fullPage: true });
    await page.reload(); await heading(page, 'A little support, right here.');
    await click(page, 'Back to event'); await heading(page, 'Just the next step.');
    assert.equal(await eventCount(page), 0);
    await page.goBack(); await heading(page, 'A little support, right here.');
    await click(page, 'Back to event'); await click(page, 'Event finished');
    assert.equal(await page.getByLabel('What did you do?').inputValue(), '');
    assert.equal(await page.getByRole('button', { name: 'Confirm my reflection', exact: true }).isDisabled(), true);
    await page.getByLabel('What actually happened? (optional)').fill('I paused, then continued. It was still hard.');
    await page.getByLabel('What did you do?').selectOption('finished');
    await click(page, 'More difficult than I expected');
    await click(page, 'Confirm my reflection'); await heading(page, 'What you want to take with you.');
    assert.equal(await eventCount(page), 0);
    await page.screenshot({ path: `${evidence}/honest-recap-390.png`, fullPage: true });
    await click(page, 'Save recap on this device (optional)');
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), 1);
    await click(page, 'Finish'); assert.equal(await eventCount(page), 1);
    const recorded = await page.evaluate(() => window.taraReviewEvents);
    assert.equal(JSON.stringify(recorded).includes('I paused'), false);
    await page.reload(); await click(page, 'Close recap'); assert.equal(await eventCount(page), 0);
    results.push('390px prepare, two selection reveals, edits, refresh, rehearsal, support/back, actual harder outcome, explicit save and completion, no duplicate learning on recap refresh');
    await context.close();
  }
  for (const [comparison, action] of [['Less difficult than I expected', 'finished'], ['About as I expected', 'finished'], ['Something different happened', 'unknown'], ['I did not test it', 'not-attempted'], ['I’m not sure yet', 'unknown']]) {
    const { page, context } = await pageFor(320);
    await click(page, 'I’m in it now'); await heading(page, 'A little support, right here.');
    assert.equal(await eventCount(page), 0); await noOverflow(page);
    await click(page, 'Back to event'); await click(page, 'I want to step out');
    assert.equal(await page.getByRole('button', { name: 'Stay with support', exact: true }).count(), 1);
    await click(page, 'Step out intentionally');
    assert.equal(await eventCount(page), 0);
    await click(page, 'Event finished');
    assert.equal(await page.getByLabel('What did you do?').inputValue(), 'stepped-out');
    await page.getByLabel('What did you do?').selectOption(action);
    await click(page, comparison); await click(page, 'Confirm my reflection');
    await noOverflow(page);
    assert.equal(await page.getByText(comparison, { exact: true }).count(), 1);
    await click(page, 'Save recap on this device (optional)');
    await click(page, 'Clear Tara data');
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)), true);
    await click(page, 'Delete Tara data');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await page.reload(); await heading(page, 'One small step into something difficult.');
    results.push(`320px live entry, intentional step-out, ${comparison}, ${action}, save/delete/refresh`);
    await context.close();
  }
  {
    const { page, context } = await pageFor(390, () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) { if (key.startsWith('mentation.tara-tactician')) throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, key, value); };
    });
    await prepare(page); await page.getByRole('alert').waitFor();
    assert.equal(await page.getByText('Changes are not confirmed saved.', { exact: true }).count(), 1);
    await click(page, 'Use my plan'); await click(page, 'Event finished');
    await page.getByLabel('What did you do?').selectOption('unknown');
    await click(page, 'I’m not sure yet'); await click(page, 'Confirm my reflection');
    await click(page, 'Save recap on this device (optional)');
    assert.equal(await page.getByRole('button', { name: 'Recap saved on this device', exact: true }).count(), 0);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await noOverflow(page); await page.screenshot({ path: `${evidence}/storage-error-390.png`, fullPage: true });
    results.push('quota error preserves in-memory flow, honest unsaved status and failed optional recap save');
    await context.close();
  }
  {
    const { page, context } = await pageFor(320);
    await prepare(page);
    await page.evaluate(() => document.documentElement.style.fontSize = '24px');
    await noOverflow(page);
    assert.equal(await page.getByLabel('Do', { exact: true }).evaluate(node => node.labels.length), 1);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.tara-reveal') || document.querySelector('.tara-content')).animationName), 'none');
    await page.screenshot({ path: `${evidence}/large-text-320.png`, fullPage: true });
    await click(page, 'Clear Tara data'); await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Clear Tara data', exact: true }).evaluate(node => node === document.activeElement), true);
    results.push('320px large text, labelled input, reduced motion, deletion dialog Escape focus restoration');
    await context.close();
  }
  {
    const { page, context } = await pageFor();
    await prepare(page);
    await page.evaluate(async () => {
      const { deleteAllLocalAppData } = await import('/src/lib/localData.js');
      deleteAllLocalAppData();
    });
    await heading(page, 'One small step into something difficult.');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await page.reload(); await heading(page, 'One small step into something difficult.');
    results.push('app-wide deletion clears Tara storage and mounted in-memory draft without resurrection');
    await context.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${evidence}/browser-results.json`, JSON.stringify({ passed: results, pageErrors: errors }, null, 2));
  console.log(JSON.stringify({ passed: results.length, scenarios: results, pageErrors: errors }, null, 2));
} finally { await browser.close(); }
