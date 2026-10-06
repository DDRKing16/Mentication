const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const BASE = process.env.TAPPING_APP_URL || 'http://localhost:5174';
const preview = BASE + '/design/tapping/index.html';
async function installHardware(page) {
  await page.addInitScript(() => {
    window.cueEvents = [];
    const record = (kind, value) => window.cueEvents.push({ kind, value, at: Date.now() });
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: value => { record('vibrate', value); return true; } });
    window.AudioContext = class {
      state = 'suspended'; currentTime = 0; destination = {};
      constructor() { record('context'); }
      async resume() { this.state = 'running'; record('resume'); }
      async close() { this.state = 'closed'; record('close'); }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
      createOscillator() { const frequency = {}; return { frequency, connect() {}, disconnect() {}, start: when => record('tone', { frequency: frequency.value, when }), stop: when => record(when === undefined ? 'cancelTone' : 'endTone', when) }; }
    };
  });
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await installHardware(page); await page.goto(preview);
  await page.getByRole('button', { name: 'Body tension' }).click();
  await page.getByRole('button', { name: 'Skip this rating' }).click();
  assert.equal(await page.evaluate(() => cueEvents.length), 0, 'No hardware before gesture');
  await page.getByRole('button', { name: 'Adjust your round' }).click();
  await page.getByRole('button', { name: 'Soft beat: Off' }).click();
  await page.getByRole('button', { name: 'Touch cues: Off' }).click();
  await page.getByRole('button', { name: 'Soft beat: On' }).waitFor();
  await page.getByRole('button', { name: 'Touch cues: On' }).waitFor();
  await page.clock.install(); await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
  await page.evaluate(() => { cueEvents.length = 0; });
  const events = () => page.evaluate(() => cueEvents);
  const advance = async n => { for (let i = 0; i < n; i++) { await page.clock.runFor(1000); await page.locator('h1').textContent(); } };
  await page.getByRole('button', { name: 'Begin my round' }).click();
  let emitted = await events();
  assert.deepEqual(emitted.filter(e => e.kind === 'tone').map(e => e.value.frequency), [261.63, 220]);
  assert.deepEqual(emitted.filter(e => e.kind === 'vibrate' && Array.isArray(e.value)).map(e => e.value), [[8, 65, 8]]);
  await advance(2); assert.equal((await events()).filter(e => e.kind === 'tone').length, 2, 'Placement is quiet');
  await advance(1);
  emitted = await events(); const beat = emitted.find(e => e.kind === 'tone' && e.value.frequency === 196);
  const hapticBeat = emitted.find(e => e.kind === 'vibrate' && e.value === 8);
  assert.equal(beat.at, hapticBeat.at, 'Audio and touch share one round tick');
  assert.equal(await page.locator('.tap-alive .tap-point-core').count(), 1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  assert.ok((await events()).some(e => e.kind === 'cancelTone'));
  assert.equal((await events()).at(-1).value, 0);
  const pausedCount = (await events()).length; await advance(10); assert.equal((await events()).length, pausedCount);
  await page.getByRole('button', { name: 'Resume my round' }).click();
  assert.equal((await events()).length, pausedCount, 'Resume does not replay an emitted tick');
  assert.equal(await page.locator('.tap-alive').count(), 0, 'Visual resume also waits for the next shared tick');
  await advance(1); assert.equal((await events()).filter(e => e.kind === 'tone').length, 4);
  assert.equal(await page.locator('.tap-alive').count(), 1);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.getByRole('button', { name: 'Resume my round' }).waitFor();
  const hiddenCount = (await events()).length; await advance(15); assert.equal((await events()).length, hiddenCount);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.getByRole('button', { name: 'Resume my round' }).click();
  await page.getByRole('button', { name: 'Stop round' }).click();
  const stoppedCount = (await events()).length; await advance(10); assert.equal((await events()).length, stoppedCount);
  await page.getByRole('button', { name: 'Skip this rating' }).click();
  await page.getByRole('button', { name: 'Try another gentle round' }).click();
  assert.equal((await events()).filter(e => e.kind === 'tone').length, 6, 'Repeat has exactly one double point cue');
  await advance(30);
  assert.equal(await page.locator('h1').textContent(), 'Top of head');
  assert.equal((await events()).filter(e => e.kind === 'tone').length, 35, 'Transition emits no expired point beat or overlapping extra cue');
  await page.getByRole('button', { name: 'Another way', exact: true }).click();
  const alternativeCount = (await events()).length; await advance(10); assert.equal((await events()).length, alternativeCount);
  await page.getByRole('button', { name: 'Return to Gentle Tapping' }).click();
  await page.getByRole('button', { name: 'Exit tapping' }).click();
  const exitCount = (await events()).length; await advance(15); assert.equal((await events()).length, exitCount);
  assert.ok((await events()).some(e => e.kind === 'close'));
  await page.close();
  for (const mode of ['unavailable', 'reduced']) {
    const p = await browser.newPage({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
    await p.addInitScript(() => { Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined }); window.AudioContext = undefined; window.webkitAudioContext = undefined; });
    await p.goto(preview); await p.getByRole('button', { name: 'A worry' }).click(); await p.getByRole('button', { name: 'Skip this rating' }).click(); await p.getByRole('button', { name: 'Adjust your round' }).click();
    if (mode === 'reduced') { assert.equal(await p.getByRole('button', { name: 'Touch cues: Off' }).isDisabled(), true); }
    else { await p.getByRole('button', { name: 'Touch cues: Off' }).click(); await p.getByText('Touch cues are unavailable on this device.', { exact: false }).waitFor(); }
    await p.getByRole('button', { name: 'Soft beat: Off' }).click(); await p.getByText('Sound is unavailable.', { exact: false }).waitFor();
    await p.getByRole('button', { name: 'Begin my round' }).click(); await p.getByRole('button', { name: 'Stop round' }).waitFor();
    if (mode === 'reduced') { assert.equal(await p.locator('.tapping-experience').evaluate(el => getComputedStyle(el.querySelector('.tap-point-core')).animationName), 'none'); }
    await p.close();
  }
  const silent = await browser.newPage();
  await installHardware(silent); await silent.goto(preview + '?silent=1');
  await silent.getByRole('button', { name: 'A worry' }).click(); await silent.getByRole('button', { name: 'Skip this rating' }).click(); await silent.getByRole('button', { name: 'Adjust your round' }).click();
  assert.equal(await silent.getByRole('button', { name: 'Soft beat: Off' }).isDisabled(), true);
  await silent.getByRole('button', { name: 'Begin my round' }).click();
  assert.equal(await silent.evaluate(() => cueEvents.some(e => e.kind === 'context')), false, 'Silent reset never creates audio hardware');
  await silent.evaluate(async () => { const feedback = await import('/src/lib/feedback.js'); feedback.installFeedback(); });
  await silent.getByRole('button', { name: 'Another way', exact: true }).click();
  assert.equal(await silent.evaluate(() => cueEvents.some(e => e.kind === 'tone')), false, 'Silent reset also mutes shared UI feedback');
  await silent.getByRole('button', { name: 'Return to Gentle Tapping' }).click();
  await silent.close();
  console.log('PASS: explicit gesture activation, independent optional sound/touch, synchronized beat, quiet placement, distinct double point change, immediate cancellation on pause/stop/hidden/alternative/exit/unmount, no replay on resume/repeat, unsupported, silent reset and reduced-motion fallback. Native vibration shape tested with injected APIs in Vitest; physical device sensation not verified.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
