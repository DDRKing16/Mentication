// Source-only integration adapter. No registration/network activity at module load.
const KEY = 'mentation.web-checkins.v1';
const ID = /^[a-f0-9-]{36}$/;
export function webCheckInAvailability(env = globalThis, configured = Boolean(import.meta.env.VITE_WEB_CHECKIN_API && import.meta.env.VITE_WEB_CHECKIN_PUBLIC_KEY)) {
  if (!configured) return 'not-configured';
  const ios = /iPad|iPhone|iPod/.test(env.navigator?.userAgent || '') || (env.navigator?.platform === 'MacIntel' && env.navigator?.maxTouchPoints > 1);
  if (ios && !(env.navigator?.standalone || env.matchMedia?.('(display-mode: standalone)').matches)) return 'install';
  if (!env.isSecureContext || !env.navigator?.serviceWorker || !env.PushManager || !env.Notification) return 'unsupported';
  return env.Notification.permission === 'denied' ? 'denied' : 'ready';
}
function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function write(value) { localStorage.setItem(KEY, JSON.stringify(value)); }
function apiConfig() {
  const api = import.meta.env.VITE_WEB_CHECKIN_API;
  if (!api || !import.meta.env.VITE_WEB_CHECKIN_PUBLIC_KEY || new URL(api).protocol !== 'https:') throw new Error('Background check-ins are not configured.');
  return api.replace(/\/$/, '');
}
async function request(method, record, body) {
  const response = await fetch(`${apiConfig()}/v1/plan`, {
    method, headers: { Authorization: `Bearer ${record.token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), credentials: 'omit', referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Background check-ins could not be confirmed.');
  return response.json();
}
async function worker() {
  const registration = await navigator.serviceWorker.register('/web-checkin-sw.js', { scope: '/' });
  if (!registration.active) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Notification setup timed out.')), 10000);
      const installing = registration.installing || registration.waiting;
      const changed = () => {
        if (registration.active) { clearTimeout(timer); installing?.removeEventListener('statechange', changed); resolve(); }
      };
      installing?.addEventListener('statechange', changed); changed();
    });
  }
  return registration;
}
async function setActive(registration, active) {
  await new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Notification setup timed out.')); }, 5000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close();
      if (event.data?.ok) resolve(); else reject(new Error('Could not save notification settings.'));
    };
    registration.active.postMessage({ type: 'web-checkin-state', active }, [channel.port2]);
  });
}
let pending = Promise.resolve();
function exclusive(fn) {
  const run = () => navigator.locks ? navigator.locks.request('mentation-web-checkins', fn) : fn();
  const result = pending.then(run); pending = result.catch(() => {}); return result;
}
function publicKey() {
  const value = import.meta.env.VITE_WEB_CHECKIN_PUBLIC_KEY;
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}
// Invoke directly from an explicit button. Request permission BEFORE any await so
// iOS sees the user gesture. Native callers must continue using the native module.
export function startWebCheckIns(draftId, checkIns) {
  const availability = webCheckInAvailability();
  if (availability !== 'ready') return Promise.resolve({ status: availability });
  const permission = Notification.permission === 'granted' ? Promise.resolve('granted') : Notification.requestPermission();
  return exclusive(async () => {
    if (await permission !== 'granted') return { status: 'denied' };
    const registration = await worker();
    let record = read();
    if (!record) {
      record = { token: Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('') };
      write(record); // Persist ownership BEFORE registering anything on the server.
    }
    // Each schedule gets a fresh opaque ID; late deliveries from old schedules are suppressed.
    record = { ...record, planId: crypto.randomUUID(), draftId, endsAt: checkIns.endsAt, pendingCancel: true };
    write(record);
    await setActive(registration, null);
    try {
      // Delete first, including after a failed prior request, before replacing the subscription.
      await request('DELETE', record);
      let subscription = await registration.pushManager.getSubscription();
      if (subscription?.expirationTime && subscription.expirationTime <= Date.now()) {
        await subscription.unsubscribe(); subscription = null;
      }
      subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey() });
      const body = { planId: record.planId, subscription: subscription.toJSON(), startedAt: checkIns.startedAt,
        endsAt: checkIns.endsAt, intervalMinutes: checkIns.intervalMinutes };
      const result = await request('PUT', record, body);
      if (result.status !== 'scheduled' || result.planId !== record.planId) throw new Error('Schedule not confirmed.');
      await setActive(registration, { planId: record.planId, endsAt: record.endsAt });
      write({ ...record, pendingCancel: false });
      return { status: 'scheduled' }; // Server accepted; not proof of actual device delivery.
    } catch (error) {
      await setActive(registration, null).catch(() => {});
      await request('DELETE', record).catch(() => {});
      throw error;
    }
  });
}
async function cancelCurrentWebCheckIns() {
  const record = read();
  if (!record) return { status: 'cancelled' };
  write({ ...record, pendingCancel: true });
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (registration?.active?.scriptURL.endsWith('/web-checkin-sw.js')) await setActive(registration, null);
  // Keep ownership if offline. Caller must show pending cancellation and retry on return/online.
  await request('DELETE', record);
  if (registration?.active?.scriptURL.endsWith('/web-checkin-sw.js')) await (await registration.pushManager.getSubscription())?.unsubscribe();
  localStorage.removeItem(KEY);
  return { status: 'cancelled' };
}
export function cancelWebCheckIns() {
  return exclusive(cancelCurrentWebCheckIns);
}
export function verifyWebCheckIns(draftId) {
  return exclusive(async () => {
    const record = read();
    if (!record) return false;
    if (record.pendingCancel || record.draftId !== draftId || record.endsAt < Date.now() || Notification.permission !== 'granted') {
      await cancelCurrentWebCheckIns(); return false;
    }
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription || (subscription.expirationTime && subscription.expirationTime <= Date.now())) {
      await cancelCurrentWebCheckIns(); return false;
    }
    const result = await request('GET', record);
    const valid = result.status === 'scheduled' && result.planId === record.planId;
    if (!valid) await cancelCurrentWebCheckIns();
    return valid;
  });
}
// Host calls at boot BEFORE its routing effect, and only routes if its local draft
// still exists, is active, and matches this returned local ID. Never create a draft.
export function consumeWebCheckInTap() {
  const match = /^#web-checkin=([a-f0-9-]{36})$/.exec(location.hash);
  if (!match) return null;
  history.replaceState(history.state, '', location.pathname + location.search);
  const record = read();
  return ID.test(match[1]) && record?.planId === match[1] && !record.pendingCancel && record.endsAt >= Date.now() ? record.draftId : null;
}

// Parent calls on boot, visibility return, online, plan change, completion and clear.
// Cancellation failures intentionally propagate so the host can show “stop pending”.
export async function reconcileWebCheckIns(draft) {
  if (!read()) return { status: 'off' };
  const active = draft && !draft.completionReported && draft.eventStatus === 'in-progress' &&
    draft.checkIns?.startedAt && draft.checkIns.endsAt > Date.now() &&
    draft.checkIns.status !== 'ended' && draft.checkIns.preference === 'device';
  if (!active) return cancelWebCheckIns();
  return { status: await verifyWebCheckIns(draft.id) ? 'scheduled' : 'unverified' };
}
