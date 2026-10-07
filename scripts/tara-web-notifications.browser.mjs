import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { browserFor, captureFor, key } from './tara-tactician.browser-support.mjs';
const origin = process.env.TARA_APP_ORIGIN || 'http://127.0.0.1:5227';
const evidence = process.env.TARA_EVIDENCE_DIR || '/tmp/tara-web-notifications';
const fresh = JSON.parse(readFileSync(process.env.TARA_FIXTURE_FILE || '/workspace/tara-background-evidence/dev/fresh-fixture.json', 'utf8'));
mkdirSync(evidence, { recursive: true });
const browser = await browserFor(), passed = [], captures = [], errors = [];
const take = captureFor(evidence, captures);
const screen = async (page, name) => { await page.locator(`[data-flow-screen="${name}"]`).waitFor(); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); };
const click = async (page, name) => { await page.getByRole('button', { name, exact: true }).click(); await page.waitForTimeout(300); };
let offline = false, serverPlan = null;
const network = [];
async function open(width, denied = false) {
  offline = false; serverPlan = null; network.length = 0;
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  await context.route('https://push.example.test/v1/plan', async route => {
    const request = route.request();
    network.push({ method: request.method(), payload: request.postData() });
    if (offline) { await route.abort('failed'); return; }
    if (request.method() === 'PUT') serverPlan = JSON.parse(request.postData());
    if (request.method() === 'DELETE') serverPlan = null;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin },
      body: JSON.stringify(serverPlan ? { status: 'scheduled', planId: serverPlan.planId } : { status: 'cancelled' }) });
  });
  const record = { ...structuredClone(fresh), id: 'private-local-plan-id', phase: 'ready', eventStatus: 'not-started',
    situation: 'Synthetic PRIVATE situation', prediction: 'Synthetic PRIVATE prediction', plan: { ...fresh.plan, do: 'Synthetic PRIVATE plan words' },
    checkIns: { ...fresh.checkIns, preference: 'device', intervalMinutes: 10, durationMinutes: 30 } };
  await context.addInitScript(({ record, denied }) => {
    if (window !== window.top) return;
    if (!sessionStorage.getItem('web-fixture-installed')) {
      localStorage.setItem('haven_onboarded', '1');
      localStorage.setItem('haven.a11y.v2', JSON.stringify({ reducedMotion: true, ambientSoundscape: false }));
      localStorage.setItem('mentation.tara-tactician.v1', JSON.stringify({ schemaVersion: 1, draft: record, recaps: [] }));
      sessionStorage.setItem('web-fixture-installed', '1');
    }
    const calls = []; let workerState = null;
    let permission = sessionStorage.getItem('mock-permission') || 'default';
    const notification = { get permission() { return permission; }, requestPermission: () => {
      calls.push('permission'); permission = denied ? 'denied' : 'granted'; sessionStorage.setItem('mock-permission', permission); return Promise.resolve(permission);
    } };
    Object.defineProperty(window, 'Notification', { configurable: true, value: notification });
    Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
    const subscription = { expirationTime: null, toJSON: () => ({ endpoint: 'https://web.push.apple.com/synthetic', keys: { p256dh: 'synthetic', auth: 'synthetic' } }),
      unsubscribe: async () => { calls.push('unsubscribe'); return true; } };
    const registration = { active: { scriptURL: location.origin + '/web-checkin-sw.js', postMessage: (message, ports) => { workerState = message.active; ports[0].postMessage({ ok: true }); } },
      pushManager: { getSubscription: async () => subscription, subscribe: async () => { calls.push('subscribe'); return subscription; } } };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
      register: async () => { calls.push('register'); return registration; }, getRegistration: async () => registration } });
    window.taraWebMock = { calls, get workerState() { return workerState; } };
  }, { record, denied });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/tara-tactician'); await screen(page, 'ready');
  return { context, page };
}
try {
  for (const width of [320, 390]) {
    const { context, page } = await open(width);
    assert.equal(network.length, 0); assert.deepEqual(await page.evaluate(() => window.taraWebMock.calls), []);
    assert.ok((await page.locator('.tara-step').innerText()).includes('random ID'));
    await take(page, 'ready-privacy-and-consent-' + width);
    await click(page, 'Allow background check-ins & use my plan'); await screen(page, 'live');
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).draft.checkIns.status === 'scheduled', key);
    assert.ok((await page.locator('.tara-check-in-status').innerText()).includes('Delivery depends on your connection'));
    assert.deepEqual(await page.evaluate(() => window.taraWebMock.calls.slice(0, 2)), ['permission', 'register']);
    assert.equal(network.some(item => JSON.stringify(item).includes('PRIVATE') || JSON.stringify(item).includes('private-local-plan-id')), false);
    const oldPlanId = await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.web-checkins.v1')).planId);
    await page.goto(origin + '/tara-tactician'); await screen(page, 'live');
    await click(page, 'Go back'); await screen(page, 'ready');
    await click(page, 'Allow background check-ins & use my plan'); await screen(page, 'live');
    const planId = await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.web-checkins.v1')).planId);
    assert.notEqual(planId, oldPlanId, 'Rescheduling replaces the opaque transport ID');
    assert.equal(serverPlan.planId, planId);
    await page.goto(origin + '/#web-checkin=' + planId); await screen(page, 'check-in');
    assert.equal(await page.evaluate(() => location.hash), '');
    await click(page, 'I need a break'); await screen(page, 'take-break');
    await page.reload(); await screen(page, 'check-in');
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft.actualActionConfirmed, key), false);
    await click(page, 'I’m okay for now'); await screen(page, 'live');
    await take(page, 'scheduled-web-live-' + width);
    if (width === 320) {
      await click(page, 'I’m finished or paused — reflect'); await screen(page, 'reflect-action');
      await page.waitForFunction(() => localStorage.getItem('mentation.web-checkins.v1') === null);
      assert.equal(serverPlan, null);
      passed.push('Browser consent, private payload, rescheduling, cold web tap, refresh and completion cancellation at 320px');
    } else {
      offline = true;
      await page.evaluate(async () => (await import('/src/lib/localData.js')).deleteAllLocalAppData());
      await page.getByText('Stopping background check-ins is pending.', { exact: false }).waitFor();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.web-checkins.v1')).pendingCancel), true);
      assert.equal(await page.evaluate(() => window.taraWebMock.workerState), null);
      await take(page, 'offline-delete-pending');
      offline = false; await page.evaluate(() => window.dispatchEvent(new Event('online')));
      await page.waitForFunction(() => localStorage.getItem('mentation.web-checkins.v1') === null);
      assert.equal(serverPlan, null);
      passed.push('Offline clear deletes private data, disables local worker delivery, retains only cancellation ownership and retries on reconnect');
    }
    await context.close();
  }
  {
    const { context, page } = await open(390, true);
    await click(page, 'Allow background check-ins & use my plan'); await screen(page, 'live');
    assert.equal(network.length, 0);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft.checkIns.status, key), 'denied');
    await click(page, 'Check in now'); await screen(page, 'check-in'); await context.close();
    passed.push('Declined browser permission never registers a worker or server schedule and preserves manual check-in');
  }
  {
    const { context, page } = await open(390);
    await click(page, 'Use in-app check-ins instead'); await screen(page, 'live');
    assert.deepEqual(await page.evaluate(() => window.taraWebMock.calls), []); assert.equal(network.length, 0);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft.checkIns.preference, key), 'in-app');
    await context.close(); passed.push('In-app alternative does not request permission or transmit metadata');
  }
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(evidence + '/results.json', JSON.stringify({ passed, pageErrors: errors, captures,
    provenance: 'Configured test-only Vite process, synthetic records, mocked notification/subscription/worker APIs and intercepted push.example.test requests. No backend, credentials, real subscriptions, provider calls or OS delivery were created.' }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ passed, pageErrors: errors, evidence, captures: captures.length }));
