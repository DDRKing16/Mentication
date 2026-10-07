import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { browserFor, key, click, select, draft, assertScreen, advance, captureFor, prepareAndPractise, reflectAndCarry } from './tara-tactician.browser-support.mjs';
const browser = await browserFor();
const origin = process.env.TARA_APP_ORIGIN || 'http://127.0.0.1:4173';
const evidence = process.env.TARA_EVIDENCE_DIR || 'design/tara-tactician/one-question/verification/production';
mkdirSync(evidence, { recursive: true });
const passed = []; const errors = []; const failedRequests = []; const navigationCancellations = []; const externalRequests = []; const captures = [];
const take = captureFor(evidence, captures); const sessions = page => page.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]'));
try {
 for (const width of [390, 320]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(width => { if (window !== window.top) return; localStorage.setItem('haven_onboarded', '1'); localStorage.setItem('haven.a11y.v2', JSON.stringify({ reducedMotion: true, ambientSoundscape: false })); document.addEventListener('DOMContentLoaded', () => document.documentElement.style.setProperty('font-size', width === 320 ? '24px' : '16px', 'important')); }, width);
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { const failure = { url: request.url(), error: request.failure()?.errorText }; const homeLoads = ['/home.html', '/media/brand/mentation-primary.png', '/audio/home-ambient.mp3'].map(path => origin + path); if (failure.error === 'net::ERR_ABORTED' && homeLoads.includes(failure.url)) navigationCancellations.push(failure); else failedRequests.push(failure); });
  page.on('response', response => { if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
  page.on('request', request => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto(origin + '/tara-tactician'); await assertScreen(page, 'entry');
  const capture = async name => { if (['01-entry', '08-practice-choice', '13-pocket-plan', '16-actual-action', '20-save-reflection'].includes(name)) await take(page, 'production-' + name + '-' + width, false); };
  await prepareAndPractise(page, capture); await click(page, 'Save plan & leave for now'); await page.waitForURL(origin + '/'); assert.equal((await sessions(page)).length, 0);
  await page.goto(origin + '/tara-tactician'); await assertScreen(page, 'ready'); assert.equal((await draft(page)).situation, 'A conversation about taking on extra work');
  await click(page, 'Use my plan'); await assertScreen(page, 'live'); await select(page, 'Find my words'); await click(page, 'Show support'); await assertScreen(page, 'support');
  assert.equal(await page.locator('.tara-coach img').evaluate(node => node.complete && node.naturalWidth > 0), true);
  await click(page, 'Back to my situation'); await page.goBack(); await assertScreen(page, 'support'); await page.reload(); await assertScreen(page, 'support'); await click(page, 'Back to my situation');
  await reflectAndCarry(page, capture, width === 390 ? 'Part of it happened' : 'I’m not sure yet', width === 390 ? 'Took part in all or some' : 'I’m not sure yet');
  await select(page, width === 390 ? 'Save a separate reflection' : 'Finish without a separate saved reflection'); await click(page, 'Finish');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]').length === 1);
  const records = await sessions(page); assert.equal(records.length, 1); assert.equal(records[0].intensity_end, null); assert.equal(JSON.stringify(records).includes('taking on extra work'), false); assert.equal(JSON.stringify(records).includes('named one limit'), false);
  assert.equal(records[0].intervention_outcome.predictionResult, width === 390 ? 'partly' : 'unsure'); assert.equal(records[0].intervention_outcome.eventStatus, width === 390 ? 'finished' : 'unknown'); assert.equal(records[0].intervention_outcome.rehearsed, true);
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).recaps.length, key), width === 390 ? 1 : 0);
  await page.goto(origin + '/tara-tactician'); await assertScreen(page, 'recap'); await click(page, 'Close reflection'); assert.equal((await sessions(page)).length, 1);
  passed.push(width + 'px compiled actual host route: one prompt/answer group/primary action, two explicit tries, save/leave/resume, support/Back/refresh, actual vs prediction result, explicit saved vs unsaved reflection, one coarse session with nullable intensity and no private words or duplicate');
  await context.close();
 }
 assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []); assert.deepEqual(externalRequests, []);
 writeFileSync(evidence + '/production-results.json', JSON.stringify({ passed, pageErrors: errors, failedRequests, navigationCancellations, externalRequests, captures, fixtureProvenance: 'Synthetic explicit user actions only, including nullable uncertainty and separate save preference. Not real user data or an observed real-world outcome.' }, null, 2));
 console.log(JSON.stringify({ passed: passed.length, scenarios: passed, pageErrors: errors, failedRequests, navigationCancellations, externalRequests, captures: captures.length }, null, 2));
} finally { await browser.close(); }
