import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const key = 'mentation.signal-lock.grounding.v1';
const modeKey = '__signal_smoke_crypto_mode';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const frame = page => page.frameLocator('iframe[title="Signal Lock"]');
const inView = element => element.evaluate(node => { const rect = node.getBoundingClientRect(); return rect.top >= -1 && rect.bottom <= innerHeight + 1; });
const record = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function open(page, base, mode, fresh = true) {
  await page.goto(`${base}/library`);
  await page.evaluate(({key, modeKey, mode, fresh}) => {
    sessionStorage.setItem(modeKey, mode);
    if (fresh) localStorage.removeItem(key);
    localStorage.setItem('haven.a11y.v2', JSON.stringify({reducedMotion:true}));
  }, {key, modeKey, mode, fresh});
  await page.goto(`${base}/signal-lock`);
  await frame(page).locator('#motion').waitFor({state:'visible'});
}
async function restoreRandom(page) {
  await frame(page).locator('body').evaluate(() => window.__signalRestoreRandom());
}
async function failRandom(page, mode) {
  await frame(page).locator('body').evaluate((_, mode) => window.__signalFailRandom(mode), mode);
}
async function fullScene(page) {
  const scene = frame(page);
  await scene.locator('#start').click();
  for (let n = 0; n < 6; n++) {
    await scene.locator('#target-one').click();
    await scene.locator('#target-two').click();
  }
  await scene.locator('#complete').click();
  await scene.getByRole('heading', {name:'Scene completed', exact:true}).waitFor();
  const saved = await record(page);
  assert.match(saved.current.id, uuid);
  assert.equal(saved.current.status, 'completed');
  assert.equal(saved.current.pairs, 6);
  assert.equal(saved.current.halfPair, false);
  assert.equal(saved.history.length, 1);
  assert.equal(saved.history[0].id, saved.current.id);
  return saved;
}
// Exact pre-fix app from e479fdce: exercise the reported faults in the same host
// iframe, while keeping deliberately expected exceptions off the candidate page.
async function reproduceBaseline(page, base) {
  const baseline = await page.context().newPage();
  const source = readFileSync(new URL('../tests/signal-lock/fixtures/app-before-secure-id.js', import.meta.url), 'utf8');
  const errors = [];
  baseline.on('pageerror', error => errors.push(error.message));
  try {
    await baseline.addInitScript(() => {
      if (location.pathname.endsWith('/signal-lock/index.html')) Object.defineProperty(crypto, 'randomUUID', {configurable:true, value:undefined});
    });
    await baseline.route('**/signal-lock/app.js', route => route.fulfill({contentType:'application/javascript', body:source}));
    await baseline.goto(`${base}/library`);
    await baseline.evaluate(key => {
      localStorage.removeItem(key);
      localStorage.setItem('haven.a11y.v2', JSON.stringify({reducedMotion:true}));
    }, key);
    const initialFault = baseline.waitForEvent('pageerror', {predicate:error => /randomUUID/.test(error.message)});
    await baseline.goto(`${base}/signal-lock`); await initialFault;
    await frame(baseline).locator('#start').click();
    assert.equal(await frame(baseline).locator('#targets').isVisible(), false, 'Old initial exception leaves the start control unwired');
    assert.equal(await record(baseline), null);
    const legacy = {version:1,id:'signal-legacy-saved-session',createdAt:Date.now(),status:'paused',elapsedMs:0,pairs:0,halfPair:true,feeling:null,endedAt:null};
    await baseline.evaluate(({key, legacy}) => localStorage.setItem(key, JSON.stringify({version:1,current:legacy,history:[]})), {key,legacy});
    await baseline.reload(); await frame(baseline).locator('#resume').waitFor({state:'visible'});
    await frame(baseline).locator('#resume').click(); await frame(baseline).locator('#target-two').click();
    await frame(baseline).locator('#stop').click();
    await frame(baseline).getByRole('heading', {name:'Session ended', exact:true}).waitFor();
    const beforeRepeat = await record(baseline);
    const repeatFault = baseline.waitForEvent('pageerror', {predicate:error => /randomUUID/.test(error.message)});
    await frame(baseline).locator('#again').click(); await repeatFault;
    assert.deepEqual(await record(baseline), beforeRepeat, 'Old repeat throws without starting a new session');
    assert.equal(errors.length, 2);
    assert(errors.every(error => /randomUUID/.test(error)));
  } finally { await baseline.close(); }
}
export async function checkSignalLock(page, base) {
  await reproduceBaseline(page, base);
  console.log("PASS Signal Lock stage: exact baseline initial and repeat faults reproduced");
  // Scope compatibility faults to the actual standalone iframe, not the host.
  await page.addInitScript(modeKey => {
    if (!location.pathname.endsWith('/signal-lock/index.html')) return;
    const mode = sessionStorage.getItem(modeKey) || 'native';
    const random = crypto.getRandomValues.bind(crypto);
    window.__signalRestoreRandom = () => Object.defineProperty(crypto, 'getRandomValues', {configurable:true, value:random});
    window.__signalFailRandom = failure => {
      Object.defineProperty(crypto, 'randomUUID', {configurable:true, value:undefined});
      Object.defineProperty(crypto, 'getRandomValues', {configurable:true, value:failure === 'missing' ? undefined : () => {throw Error('Synthetic secure randomness failure');}});
    };
    if (mode !== 'native') Object.defineProperty(crypto, 'randomUUID', {configurable:true, value:undefined});
    if (['missing','throwing'].includes(mode)) window.__signalFailRandom(mode);
  }, modeKey);

  for (const mode of ['native', 'fallback']) {
    await open(page, base, mode);
    await frame(page).locator('#start').waitFor({state:'visible'});
    if (mode === 'fallback') assert.deepEqual(await frame(page).locator('body').evaluate(() => [typeof crypto.randomUUID, typeof crypto.getRandomValues]), ['undefined','function']);
    const completed = await fullScene(page);
    await frame(page).locator('#again').click();
    await frame(page).locator('#start').waitFor({state:'visible'});
    assert(await inView(frame(page).locator('#start')), 'Restarted scene scrolls its focused start control into view');
    const next = await record(page);
    assert.match(next.current.id, uuid);
    assert.notEqual(next.current.id, completed.current.id, 'Repeating creates a distinct secure identifier');
    assert.equal(next.current.pairs, 0);
    assert.equal(next.current.elapsedMs, 0);
    assert.equal(next.current.status, 'ready');
    assert.deepEqual(next.history, completed.history, 'Repeating preserves earlier outcomes');
    await page.reload(); await frame(page).locator('#start').waitFor({state:'visible'});
    assert.equal((await record(page)).current.id, next.current.id, 'Ready-session reload must retain identity');
    await frame(page).locator('#start').click(); await frame(page).locator('#target-one').click();
    await page.reload(); await frame(page).locator('#resume').waitFor({state:'visible'});
    const resumed = await record(page);
    assert.equal(resumed.current.id, next.current.id);
    assert.equal(resumed.current.status, 'paused');
    assert.equal(resumed.current.halfPair, true);
    await frame(page).locator('#resume').click(); await frame(page).locator('#target-two').click();
    await frame(page).locator('#stop').click();
    await frame(page).getByRole('heading', {name:'Session ended', exact:true}).waitFor();
    const ended = await record(page);
    assert.equal(ended.current.pairs, 1); assert.equal(ended.history.length, 2);
    assert.equal(await frame(page).locator('html').evaluate(node => node.scrollWidth > innerWidth + 1), false, 'Signal Lock fits phone width');
    console.log(`PASS Signal Lock stage: ${mode} completion, repeat and partial reload/resume`);
  }

  for (const failure of ['missing', 'throwing']) {
    await open(page, base, failure);
    await frame(page).locator('#session-error').waitFor({state:'visible'});
    assert.equal(await frame(page).locator('#session-error-message').getAttribute('role'), 'alert');
    assert.match(await frame(page).locator('#session-error-message').innerText(), /secure/i);
    assert((await frame(page).locator('#retry-session').boundingBox()).height >= 44, 'Retry has a touch-sized target');
    assert.equal(await frame(page).locator('#start').isVisible(), false);
    assert.equal(await frame(page).locator('#targets').isVisible(), false);
    assert.equal(await record(page), null, 'Startup failure must not invent or save a weak-identity session');
    assert(await page.getByRole('button', {name:'Home', exact:true}).isVisible(), 'Host exit remains available');
    assert.equal(await frame(page).locator('html').evaluate(node => node.scrollWidth > innerWidth + 1), false, 'Failure and retry fit phone width');
    await restoreRandom(page); await frame(page).locator('#retry-session').click();
    await frame(page).locator('#start').waitFor({state:'visible'});
    assert.equal(await frame(page).locator('#session-error').isVisible(), false);
    assert.match((await record(page)).current.id, uuid);
    const completed = await fullScene(page);
    await failRandom(page, failure);
    await frame(page).locator('#again').click();
    await frame(page).locator('#session-error').waitFor({state:'visible'});
    assert(await frame(page).getByRole('heading', {name:'Scene completed', exact:true}).isVisible());
    assert(await frame(page).locator('#session-error-message').evaluate(node => document.activeElement === node), 'Repeat failure moves focus to its explanation');
    assert(await inView(frame(page).locator('#session-error-message')), 'Repeat failure scrolls its explanation into view');
    assert.deepEqual(await record(page), completed, 'Repeat failure must preserve the completed session and history');
    await restoreRandom(page); await frame(page).locator('#retry-session').click();
    await frame(page).locator('#start').waitFor({state:'visible'});
    assert(await inView(frame(page).locator('#start')), 'Restarted scene scrolls its focused start control into view');
    const next = await record(page);
    assert.match(next.current.id, uuid); assert.notEqual(next.current.id, completed.current.id);
    assert.deepEqual(next.history, completed.history);
    await frame(page).locator('#start').click(); await frame(page).locator('#target-one').click();
    // The init fault is reapplied on reload. Existing IDs do not need entropy to resume.
    await page.reload(); await frame(page).locator('#resume').waitFor({state:'visible'});
    assert.equal(await frame(page).locator('#session-error').isVisible(), false);
    assert.equal((await record(page)).current.id, next.current.id);
    assert.equal((await record(page)).current.halfPair, true);
    await frame(page).locator('#resume').click(); await frame(page).locator('#target-two').click();
    await frame(page).locator('#stop').click();
    await frame(page).getByRole('heading', {name:'Session ended', exact:true}).waitFor();
    assert.equal((await record(page)).current.pairs, 1);
    console.log(`PASS Signal Lock stage: ${failure} entropy startup/retry, repeat preservation and saved resume`);
  }

  // Exercise the teardown order deterministically: deletion and a late pagehide
  // run in the old frame before its parent can process the storage event.
  await open(page, base, 'fallback');
  await frame(page).locator('#start').click(); await frame(page).locator('#target-one').click();
  const afterLateHide = await frame(page).locator('body').evaluate((_, key) => {
    localStorage.removeItem(key);
    window.dispatchEvent(new Event('pagehide'));
    return localStorage.getItem(key);
  }, key);
  assert.equal(afterLateHide, null, 'A late real-frame pagehide must not resurrect a removed session');
  console.log('PASS Signal Lock stage: deterministic deleted-before-pagehide order writes no old progress');

  // A full Profile wipe also clears onboarding. The host correctly leaves the
  // intervention for Welcome; it must not be expected to keep a mounted iframe.
  await open(page, base, 'fallback');
  await frame(page).locator('#start').click(); await frame(page).locator('#target-one').click();
  const deletedId = (await record(page)).current.id;
  const other = await page.context().newPage();
  try {
    await other.goto(`${base}/profile`);
    await other.getByRole('button', {name:'Delete all my data', exact:true}).click();
    await other.getByRole('button', {name:'Yes, delete everything', exact:true}).click();
    await page.waitForURL(url => url.pathname === '/welcome');
    await page.locator('iframe[title="Signal Lock"]').waitFor({state:'detached'});
    assert.equal(await record(page), null, 'Profile wipe removes the old identity, progress and history');
    console.log('PASS Signal Lock stage: Profile deletion clears data and exits to Welcome');

    // Re-enter through the real Welcome action, without clearing or replacing
    // storage in the test; a new blank scene is the only permitted outcome.
    await page.getByRole('button', {name:'Explore first', exact:true}).click();
    await page.waitForURL(url => url.pathname === '/');
    await page.goto(`${base}/signal-lock`);
    await frame(page).locator('#start').waitFor({state:'visible'});
    const restarted = await record(page);
    assert.match(restarted.current.id, uuid); assert.notEqual(restarted.current.id, deletedId);
    assert.equal(restarted.current.pairs, 0); assert.equal(restarted.current.halfPair, false);
    assert.deepEqual(restarted.history, []);
    console.log('PASS Signal Lock stage: Explore first re-entry creates only a new empty scene');

    // A targeted key deletion keeps onboarding intact and exercises the mounted
    // iframe disposal/double-clear/remount hook separately from full app reset.
    await frame(page).locator('#start').click(); await frame(page).locator('#target-one').click();
    const targetedId = (await record(page)).current.id;
    await other.evaluate(key => localStorage.removeItem(key), key);
    await page.waitForFunction(({key, targetedId}) => {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved?.current?.status === 'ready' && saved.current.id !== targetedId;
    }, {key, targetedId});
    await frame(page).locator('#start').waitFor({state:'visible'});
    assert.equal(new URL(page.url()).pathname, '/signal-lock');
    const cleared = await record(page);
    assert.match(cleared.current.id, uuid); assert.equal(cleared.current.pairs, 0);
    assert.equal(cleared.current.halfPair, false); assert.deepEqual(cleared.history, []);
    await page.reload(); await frame(page).locator('#start').waitFor({state:'visible'});
    assert.equal((await record(page)).current.id, cleared.current.id);
    assert.deepEqual((await record(page)).history, []);
    console.log('PASS Signal Lock stage: targeted deletion remounts securely and reload cannot resurrect progress');

    // Delete active partial progress with entropy unavailable. No stale pagehide
    // save may revive the deleted session, including on a subsequent reload.
    await frame(page).locator('#start').click(); await frame(page).locator('#target-one').click();
    await page.evaluate(({modeKey}) => sessionStorage.setItem(modeKey, 'missing'), {modeKey});
    await other.evaluate(key => localStorage.removeItem(key), key);
    await frame(page).locator('#session-error').waitFor({state:'visible'});
    assert.equal(new URL(page.url()).pathname, '/signal-lock');
    assert.equal(await record(page), null);
    await page.reload(); await frame(page).locator('#session-error').waitFor({state:'visible'});
    assert.equal(await record(page), null);
    console.log('PASS Signal Lock stage: targeted deletion and reload without entropy preserve deletion');
  } finally { await other.close(); }
}
