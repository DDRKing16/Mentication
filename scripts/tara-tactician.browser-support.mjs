import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const key = 'mentation.tara-tactician.v1';
export const click = (page, name) => page.getByRole('button', { name, exact: true }).click();
export const select = (page, name) => page.getByRole('radio', { name: new RegExp('^' + name) }).check();
export const draft = page => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.draft, key);
export async function browserFor() {
 const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs');
 return chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
}
export async function assertScreen(page, screen) {
 await page.locator('[data-flow-screen="' + screen + '"]').waitFor();
 assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
 assert.equal(await page.locator('.tara-step fieldset').count() <= 1, true, 'Only one question answer group');
 assert.equal(await page.locator('.tara-step textarea').count() <= 1, true);
 assert.equal(await page.locator('.tara-step [data-primary-action]').count(), 1, 'One obvious primary next action');
 assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal overflow');
 const action = await page.locator('.tara-step [data-primary-action]').boundingBox();
 assert.equal(action.y >= 0 && action.y + action.height <= await page.evaluate(() => innerHeight) + 1, true, 'Primary action reachable in viewport');
}
export async function advance(page, screen) { await click(page, 'Continue'); await assertScreen(page, screen); }
export async function edit(page, button, label, value) {
 await click(page, button); await page.getByRole('textbox', { name: label, exact: true }).fill(value); await click(page, 'Keep this wording');
}
export function captureFor(directory, captures) {
 mkdirSync(directory, { recursive: true });
 return async (page, name, fullAndViewport = true) => {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, rootFontSize: getComputedStyle(document.documentElement).fontSize, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
  const files = [];
  for (const kind of fullAndViewport ? ['full', 'viewport'] : ['full']) {
   const file = name + '-' + kind + '.png'; await page.screenshot({ path: directory + '/' + file, fullPage: kind === 'full' });
   const bytes = readFileSync(directory + '/' + file); files.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  captures.push({ name, prompt: await page.getByRole('heading', { level: 1 }).innerText(), dimensions, files });
 };
}
export async function prepareAndPractise(page, capture = async () => {}) {
 await assertScreen(page, 'entry'); assert.equal(await page.getByRole('heading', { name: 'Let’s get through this', exact: true }).count(), 1);
 assert.equal(await page.locator('.tara-main img').count(), 0, 'No Tara hero at entry'); await capture('01-entry');
 await click(page, 'Get started'); await assertScreen(page, 'timing'); await capture('02-timing');
 assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).isDisabled(), true);
 await select(page, 'Before the situation'); await assertScreen(page, 'timing'); await advance(page, 'event'); await capture('03-situation');
 await edit(page, 'Name this moment (optional)', 'Name this moment', 'A conversation about taking on extra work');
 await select(page, 'A conversation'); await assertScreen(page, 'event'); await advance(page, 'challenge'); await capture('04-challenge');
 await select(page, 'Holding a boundary'); await advance(page, 'prediction'); await capture('05-prediction');
 assert.equal(await page.getByRole('textbox', { name: 'My prediction', exact: true }).inputValue(), '', 'No authored worry silently recorded as mine');
 await page.getByRole('textbox', { name: 'My prediction', exact: true }).fill('They might react badly if I say what I need.'); await advance(page, 'move'); await capture('06-tactic');
 await select(page, 'Name one clear limit'); await assertScreen(page, 'move'); await advance(page, 'move-confirm');
 await edit(page, 'Edit my move', 'My first move', 'I can do this part. I cannot take on the rest.'); await capture('07-chosen-move');
 await click(page, 'Practise this move'); await assertScreen(page, 'practice-choose'); await capture('08-practice-choice');
 await select(page, 'Use my first move'); await assertScreen(page, 'practice-choose'); assert.deepEqual((await draft(page)).practice.tried, [false, false]);
 await advance(page, 'practice-try'); await capture('09-try'); await click(page, 'I tried this'); await assertScreen(page, 'practice-choose');
 assert.deepEqual((await draft(page)).practice.tried, [true, false]); await capture('10-recovery-choice');
 await select(page, 'Repeat the limit'); await advance(page, 'practice-try'); await capture('11-recovery-try'); await click(page, 'I tried this'); await assertScreen(page, 'usability'); await capture('12-usability');
 assert.deepEqual((await draft(page)).practice.tried, [true, true]); await select(page, 'I can use this'); await advance(page, 'ready'); await capture('13-pocket-plan');
}
export async function reflectAndCarry(page, capture = async () => {}, prediction = 'Part of it happened', action = 'Took part in all or some') {
 await click(page, 'I’m finished or paused — reflect'); await assertScreen(page, 'reflect-action'); await capture('16-actual-action');
 await select(page, action); assert.equal((await draft(page)).actualActionConfirmed, false); await advance(page, 'reflect-prediction'); await capture('17-prediction-result');
 await select(page, prediction); await advance(page, 'reflect-observation'); await capture('18-observation');
 await page.getByRole('textbox', { name: 'What actually happened?', exact: true }).fill('I named one limit and paused. The rest is uncertain.'); await advance(page, 'next-step'); await capture('19-next-step');
 assert.equal((await draft(page)).nextStep, ''); assert.equal((await draft(page)).learning, '');
 await select(page, 'Make the next attempt smaller'); await assertScreen(page, 'next-step'); await advance(page, 'recap'); await capture('20-save-reflection');
 assert.equal((await draft(page)).actual, 'I named one limit and paused. The rest is uncertain.');
}
