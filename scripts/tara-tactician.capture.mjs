import { writeFileSync } from 'node:fs';
import { browserFor, click, select, assertScreen, captureFor, prepareAndPractise, reflectAndCarry } from './tara-tactician.browser-support.mjs';
const browser = await browserFor(); const captures = []; const errors = [];
const directory = process.env.TARA_CAPTURE_DIR || 'design/tara-tactician/one-question/after'; const take = captureFor(directory, captures);
try {
 for (const width of [390, 320]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.TARA_PREVIEW_URL || 'http://127.0.0.1:5173/design/tara-tactician/preview.html');
  if (width === 320) await page.addStyleTag({ content: 'html{font-size:24px!important}' });
  const capture = name => take(page, name + '-' + width + (width === 320 ? '-large' : ''));
  await prepareAndPractise(page, capture); await click(page, 'Use my plan'); await assertScreen(page, 'live'); await capture('14-live');
  await select(page, 'Find my words'); await click(page, 'Show support'); await assertScreen(page, 'support'); await capture('15-support'); await click(page, 'Back to my situation');
  await reflectAndCarry(page, capture); await context.close();
 }
 writeFileSync(directory + '/capture-manifest.json', JSON.stringify({ baseMain: 'b4f406c9f3f638bba11d04bebb10df7c60274609', branch: 'codex/get-through-one-question', captures, pageErrors: errors, fixtures: 'Synthetic work-boundary example; explicit authored user choices, not real outcomes.' }, null, 2));
 console.log(JSON.stringify({ captures: captures.length, pageErrors: errors }));
} finally { await browser.close(); }
