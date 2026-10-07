import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { browserFor, captureFor, key } from './tara-tactician.browser-support.mjs';

const origin = process.env.TARA_APP_ORIGIN || 'http://127.0.0.1:5225';
const evidence = process.env.TARA_EVIDENCE_DIR || '/tmp/tara-native-notifications';
mkdirSync(evidence, { recursive: true });
const browser = await browserFor();
const captures = [], passed = [], errors = [];
const take = captureFor(evidence, captures);
let fresh;
if (process.env.TARA_FIXTURE_FILE) fresh = JSON.parse(readFileSync(process.env.TARA_FIXTURE_FILE, 'utf8'));
else {
  const context = await browser.newContext(); const page = await context.newPage();
  await page.goto(origin + '/tara-tactician');
  fresh = await page.evaluate(async () => (await import('/src/lib/taraTacticianState.js')).newTaraState());
  writeFileSync(evidence + '/fresh-fixture.json', JSON.stringify(fresh)); await context.close();
}
const active = id => ({ ...structuredClone(fresh), id, phase: 'tackle', support: '', eventStatus: 'in-progress', entryMode: 'live',
  situation: 'Synthetic private situation', prediction: 'Synthetic private prediction', plan: { ...fresh.plan, do: 'Synthetic private first move' },
  checkIns: { ...fresh.checkIns, preference: 'device', status: 'scheduled', startedAt: Date.now(), nextAt: Date.now() + 10 * 60000, endsAt: Date.now() + 60 * 60000, intervalMinutes: 10, durationMinutes: 60 } });
const reflection = id => ({ ...active(id), phase: 'recap', eventStatus: 'unknown', completionReported: true,
  actualActionConfirmed: true, predictionResult: 'unsure', actual: 'Synthetic private actual observation', savePreference: 'save', saved: true });
const screen = async (page, value) => {
  await page.locator(`[data-flow-screen="${value}"]`).waitFor();
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No mobile overflow');
};
const click = async (page, name) => { await page.getByRole('button', { name, exact: true }).click(); await page.waitForTimeout(300); };
const data = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const native = page => page.evaluate(() => ({ calls: window.taraNativeMock.calls, queue: window.taraNativeMock.pending }));
async function open({ width = 390, records, path = '/', coldId, permission = 'granted', deny = false, corrupt = false }) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(({ records, coldId, permission, deny, corrupt }) => {
    if (window !== window.top) return;
    localStorage.setItem('haven_onboarded', '1');
    localStorage.setItem('haven.a11y.v2', JSON.stringify({ reducedMotion: true, ambientSoundscape: false }));
    if (!sessionStorage.getItem('tara-native-fixture-installed')) {
      sessionStorage.setItem('tara-native-fixture-installed', '1');
      if (records) localStorage.setItem('mentation.tara-tactician.v1', corrupt ? '{unreadable' : JSON.stringify({ schemaVersion: 1, ...records }));
    }
    const callbacks = new Map();
    let pending = JSON.parse(sessionStorage.getItem('tara-native-queue') || 'null') || (records?.draft?.checkIns?.status === 'scheduled'
      ? [{ id: 41001, extra: { interventionId: 'taraTactician', draftId: records.draft.id } }] : []);
    const calls = [];
    const persist = () => sessionStorage.setItem('tara-native-queue', JSON.stringify(pending));
    window.webkit = { messageHandlers: { bridge: {} } };
    const methods = ['checkPermissions', 'requestPermissions', 'schedule', 'getPending', 'cancel', 'removeDeliveredNotificationsById', 'removeListener'];
    window.Capacitor = {
      PluginHeaders: ['LocalNotifications', 'StatusBar', 'SplashScreen', 'App', 'Haptics'].map(name => ({ name,
        methods: [...(name === 'LocalNotifications' ? methods : ['setStyle', 'setOverlaysWebView', 'hide', 'impact', 'notification']), 'removeListener'].map(name => ({ name, rtype: 'promise' })).concat({ name: 'addListener', rtype: 'callback' }) })),
      nativePromise: async (plugin, method, options) => {
        if (plugin !== 'LocalNotifications') return {};
        calls.push({ method, options: options && JSON.parse(JSON.stringify(options)) });
        if (method === 'checkPermissions') return { display: permission };
        if (method === 'requestPermissions') { permission = deny ? 'denied' : 'granted'; return { display: permission }; }
        if (method === 'schedule') { pending.push(...options.notifications); persist(); return { notifications: options.notifications }; }
        if (method === 'getPending') return { notifications: pending };
        if (method === 'cancel') { pending = pending.filter(item => !options.notifications.some(removal => removal.id === item.id)); persist(); }
        return {};
      },
      nativeCallback: (plugin, method, options, handler) => {
        callbacks.set(plugin + ':' + options.eventName, handler);
        if (plugin === 'LocalNotifications' && coldId) queueMicrotask(() => handler({ notification: { id: 41001, extra: { interventionId: 'taraTactician', draftId: coldId } } }));
        return Promise.resolve('mock-callback');
      },
    };
    window.taraNativeMock = { calls, get pending() { return pending; },
      tap: (draftId, id = 41001) => callbacks.get('LocalNotifications:localNotificationActionPerformed')?.({ notification: { id, extra: { interventionId: 'taraTactician', draftId } } }),
      permission: value => { permission = value; },
      resume: () => callbacks.get('App:appStateChange')?.({ isActive: true }) };
  }, { records, coldId, permission, deny, corrupt });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + path);
  return { context, page };
}
try {
  for (const width of [320, 390]) {
    const record = active('cold-plan-' + width);
    const { context, page } = await open({ width, records: { draft: record, recaps: [] }, coldId: record.id });
    await screen(page, 'check-in');
    assert.equal((await data(page)).draft.id, record.id);
    assert.equal((await native(page)).calls.some(call => ['requestPermissions', 'schedule'].includes(call.method)), false, 'Cold tap does not opt in or schedule');
    await take(page, 'cold-start-check-in-' + width);
    await click(page, 'I need a break'); await screen(page, 'take-break');
    assert.equal((await data(page)).draft.checkIns.lastAnswer, 'break');
    assert.equal((await data(page)).draft.actualActionConfirmed, false);
    await page.reload(); await screen(page, 'check-in');
    assert.equal((await data(page)).draft.checkIns.lastAnswer, 'break');
    await click(page, 'I’m okay for now'); await screen(page, 'live');
    const wording = await page.locator('.tara-check-in-status').innerText();
    assert.ok(wording.includes('while your phone is locked or Mentication is closed'));
    await take(page, 'scheduled-live-' + width);
    await page.goto(origin + '/settings');
    await page.waitForFunction(() => typeof window.taraNativeMock.tap === 'function');
    await page.waitForTimeout(400); await page.evaluate(id => window.taraNativeMock.tap(id), record.id);
    await screen(page, 'check-in');
    assert.equal((await data(page)).draft.id, record.id);
    await click(page, 'I need help'); await screen(page, 'help-support');
    await page.evaluate(id => window.taraNativeMock.tap(id), record.id); await screen(page, 'check-in');
    await click(page, 'I’m okay for now'); await screen(page, 'live');
    await click(page, 'Turn check-ins off');
    assert.equal((await data(page)).draft.checkIns.preference, 'off');
    assert.equal((await native(page)).queue.length, 0);
    await context.close(); passed.push(`Cold startup, refresh, outside-Tara and repeated taps, support, cancellation at ${width}px`);
  }
  {
    const current = active('current-plan'), archived = reflection('archived-plan');
    const { context, page } = await open({ records: { draft: current, recaps: [archived] }, path: '/tara-tactician?taraCheckIn=archived-plan' });
    await screen(page, 'recap'); await take(page, 'archived-notification');
    assert.equal((await data(page)).draft.id, current.id);
    await page.reload(); await screen(page, 'recap');
    assert.equal((await data(page)).draft.id, current.id);
    await click(page, 'Close reflection');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.sessions.v1') || '[]').length), 0);
    await context.close(); passed.push('Archived-plan deep link and refresh are read-only and preserve the current plan without completion');
  }
  for (const kind of ['deleted', 'completed', 'expired', 'corrupt']) {
    const record = kind === 'completed' ? reflection('target-plan') : active('target-plan');
    if (kind === 'expired') record.checkIns.endsAt = Date.now() - 1000;
    if (kind === 'deleted') record.id = 'other-current-plan';
    const { context, page } = await open({ records: { draft: record, recaps: [] }, path: '/tara-tactician?taraCheckIn=target-plan', corrupt: kind === 'corrupt' });
    await screen(page, kind === 'completed' ? 'recap' : kind === 'corrupt' ? 'entry' : 'live');
    if (kind === 'deleted') assert.ok((await page.locator('.tara-footer').innerText()).includes('no longer saved'));
    if (kind === 'expired') assert.ok((await page.locator('.tara-check-in-status').innerText()).includes('window has ended'));
    if (kind === 'corrupt') assert.equal(await page.evaluate(key => localStorage.getItem(key), key), '{unreadable');
    else assert.equal((await data(page)).draft.id, record.id);
    await take(page, kind + '-target'); await context.close(); passed.push(`${kind} notification target stays honest without resurrecting a plan or recording an outcome`);
  }
  for (const denied of [false, true]) {
    const record = { ...active('consent-plan'), phase: 'ready', eventStatus: 'not-started', checkIns: { ...fresh.checkIns, preference: 'device', intervalMinutes: 10, durationMinutes: 30 } };
    const { context, page } = await open({ records: { draft: record, recaps: [] }, path: '/tara-tactician', permission: 'prompt', deny: denied });
    await screen(page, 'ready');
    assert.equal((await native(page)).calls.some(call => call.method === 'requestPermissions'), false);
    await click(page, 'Allow phone check-ins & use my plan'); await screen(page, 'live');
    assert.equal((await data(page)).draft.checkIns.status, denied ? 'denied' : 'scheduled');
    const queue = await native(page);
    assert.equal(queue.calls.filter(call => call.method === 'requestPermissions').length, 1);
    assert.equal(queue.queue.length, denied ? 0 : 3);
    if (!denied) {
      assert.ok(!JSON.stringify(queue.queue).includes('Synthetic private'));
      await click(page, 'I’m finished or paused — reflect'); await screen(page, 'reflect-action');
      assert.equal((await native(page)).queue.length, 0);
      assert.equal((await data(page)).draft.actualActionConfirmed, false);
    } else {
      await click(page, 'Check in now'); await screen(page, 'check-in');
    }
    await take(page, denied ? 'permission-declined-fallback' : 'reflect-stops-notifications');
    await context.close(); passed.push(denied ? 'Permission decline keeps manual support usable' : 'Explicit consent schedules bounded discreet reminders; reflection cancels them before outcomes');
  }
  {
    const record = active('delete-plan');
    const { context, page } = await open({ records: { draft: record, recaps: [] }, path: '/settings' });
    await page.waitForTimeout(700);
    await page.evaluate(key => { localStorage.removeItem(key); window.dispatchEvent(new CustomEvent('mentation:sessions-changed')); }, key);
    await page.waitForFunction(() => window.taraNativeMock.pending.length === 0);
    await page.evaluate(() => window.taraNativeMock.tap('delete-plan')); await screen(page, 'entry');
    assert.ok((await page.locator('.tara-footer').innerText()).includes('no longer saved'));
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    await context.close(); passed.push('App-wide deletion cancels reminders while Tara is unmounted; a late tap leaves data deleted');
  }
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(evidence + '/results.json', JSON.stringify({ passed, pageErrors: errors, captures,
    provenance: 'Synthetic local records and a mocked Capacitor native bridge exercising the real SDK proxy and app router. No OS notifications were delivered. Physical locked/background/closed-phone behavior remains untested.' }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ passed, pageErrors: errors, captures: captures.length, evidence }));
