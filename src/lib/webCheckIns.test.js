import { afterEach, describe, expect, it, vi } from 'vitest';
import { webCheckInAvailability, consumeWebCheckInTap, cancelWebCheckIns } from './webCheckIns';
afterEach(() => vi.unstubAllGlobals());
const id = '12345678-1234-1234-1234-123456789abc';
describe('web setup and private tap handoff', () => {
  it('gates deployment, iPhone installation, browser capability and denial', () => {
    const env = { navigator: { userAgent: 'iPhone', serviceWorker: {} }, isSecureContext: true, PushManager: {}, Notification: { permission: 'default' } };
    expect(webCheckInAvailability(env, false)).toBe('not-configured');
    expect(webCheckInAvailability(env, true)).toBe('install');
    env.navigator.standalone = true; expect(webCheckInAvailability(env, true)).toBe('ready');
    env.Notification.permission = 'denied'; expect(webCheckInAvailability(env, true)).toBe('denied');
    env.PushManager = null; expect(webCheckInAvailability(env, true)).toBe('unsupported');
  });
  it('consumes opaque hash once and only returns a matching unexpired local draft', () => {
    const record = { planId: id, draftId: 'local-only', endsAt: Date.now() + 60000 };
    vi.stubGlobal('location', { hash: `#web-checkin=${id}`, pathname: '/', search: '' });
    vi.stubGlobal('history', { state: {}, replaceState: vi.fn() });
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(record) });
    expect(consumeWebCheckInTap()).toBe('local-only');
    expect(history.replaceState).toHaveBeenCalledWith({}, '', '/');
    record.pendingCancel = true; expect(consumeWebCheckInTap()).toBeNull();
    record.pendingCancel = false; record.endsAt = 0; expect(consumeWebCheckInTap()).toBeNull();
  });
  it('retains a pending cancellation and capability after offline failure', async () => {
    let value = JSON.stringify({ planId: id, token: 'a'.repeat(64) });
    vi.stubGlobal('localStorage', { getItem: () => value, setItem: (_, v) => { value = v; } });
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => null } });
    await expect(cancelWebCheckIns()).rejects.toThrow();
    expect(JSON.parse(value).pendingCancel).toBe(true);
    expect(JSON.parse(value).token).toBe('a'.repeat(64));
  });
});

it('sends only scheduling fields and a separate opaque ID; completion cancels remotely', async () => {
  vi.stubEnv('VITE_WEB_CHECKIN_API', 'https://push.example.test');
  vi.stubEnv('VITE_WEB_CHECKIN_PUBLIC_KEY', 'YQ');
  let saved = null, active = null; const sent = [];
  const ports = new Map(); let portId = 0;
  vi.stubGlobal('MessageChannel', class {
    constructor() {
      const n = ++portId;
      this.port1 = { close() { ports.delete(n); }, set onmessage(fn) { ports.set(n, fn); } };
      this.port2 = { deliver: data => ports.get(n)?.({ data }) };
    }
  });
  const sub = { toJSON: () => ({ endpoint: 'https://web.push.apple.com/test', keys: {} }), unsubscribe: vi.fn(async () => true) };
  const registration = { active: { scriptURL: 'https://example.test/web-checkin-sw.js', postMessage: (message, ports) => { active = message.active; ports[0].deliver({ ok: true }); } }, pushManager: { getSubscription: async () => sub } };
  vi.stubGlobal('localStorage', { getItem: () => saved, setItem: (_, v) => { saved = v; }, removeItem: () => { saved = null; } });
  vi.stubGlobal('isSecureContext', true); vi.stubGlobal('PushManager', {});
  vi.stubGlobal('Notification', { permission: 'granted' });
  vi.stubGlobal('navigator', { serviceWorker: { register: async () => registration, getRegistration: async () => registration } });
  vi.stubGlobal('crypto', { randomUUID: () => id, getRandomValues: array => array.fill(1) });
  vi.stubGlobal('fetch', async (url, options) => {
    sent.push({ url, ...options });
    return { ok: true, json: async () => options.method === 'PUT' ? { status: 'scheduled', planId: id } : { status: 'cancelled' } };
  });
  try {
    const { startWebCheckIns, reconcileWebCheckIns } = await import('./webCheckIns');
    const time = Date.now();
    expect(await startWebCheckIns('private-local-draft', { startedAt: time, endsAt: time + 1200000, intervalMinutes: 10, situation: 'private situation' })).toEqual({ status: 'scheduled' });
    expect(Object.keys(JSON.parse(sent[1].body)).sort()).toEqual(['endsAt', 'intervalMinutes', 'planId', 'startedAt', 'subscription']);
    expect(JSON.stringify(sent)).not.toContain('private'); expect(active.planId).toBe(id);
    await reconcileWebCheckIns({ completionReported: true });
    expect(sent.at(-1).method).toBe('DELETE'); expect(active).toBeNull(); expect(saved).toBeNull(); expect(sub.unsubscribe).toHaveBeenCalled();
  } finally { vi.unstubAllEnvs(); }
});
