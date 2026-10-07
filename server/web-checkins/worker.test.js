import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
const id = '12345678-1234-1234-1234-123456789abc';
function harness(active) {
  const handlers = {}, shown = [], opened = [], navigated = [];
  const indexedDB = { open: () => {
    const request = {};
    queueMicrotask(() => {
      request.result = { close() {}, transaction: () => {
        const tx = { objectStore: () => ({ get: () => ({ result: active }), put: value => { active = value; return {}; } }) };
        queueMicrotask(() => tx.oncomplete()); return tx;
      } }; request.onsuccess();
    }); return request;
  } };
  const self = { location: { origin: 'https://example.test' }, addEventListener: (name, fn) => { handlers[name] = fn; },
    registration: { showNotification: async (...args) => shown.push(args), getNotifications: async () => [] },
    clients: { matchAll: async () => [], openWindow: async url => opened.push(url) } };
  vm.runInNewContext(readFileSync(new URL('../../public/web-checkin-sw.js', import.meta.url), 'utf8'), { self, indexedDB, URL, Date });
  return { self, shown, opened, navigated, emit: async (name, data) => { let task; handlers[name]({ ...data, waitUntil: p => { task = p; } }); await task; } };
}
describe('service worker', () => {
  it('shows only generic text for active opaque ID and rejects expired/replaced pushes', async () => {
    const h = harness({ planId: id, endsAt: Date.now() + 60000 });
    const push = value => h.emit('push', { data: { json: () => value } });
    await push({ planId: id, expiresAt: Date.now() + 60000, body: 'private text is ignored' });
    expect(h.shown).toHaveLength(1); expect(JSON.stringify(h.shown)).not.toContain('private text');
    await push({ planId: id, expiresAt: 0 }); await push({ planId: 'attacker', expiresAt: Date.now() + 60000 });
    expect(h.shown).toHaveLength(1);
  });
  it('persists cancellation locally and suppresses an already-in-flight old push', async () => {
    const h = harness({ planId: id, endsAt: Date.now() + 60000 }); let acknowledged = false;
    await h.emit('message', { data: { type: 'web-checkin-state', active: null }, source: { url: 'https://example.test/reset' }, ports: [{ postMessage: value => { acknowledged = value.ok; } }] });
    await h.emit('push', { data: { json: () => ({ planId: id, expiresAt: Date.now() + 60000 }) } });
    expect(acknowledged).toBe(true); expect(h.shown).toHaveLength(0);
  });
  it('opens a fixed same-origin hash on cold start; stale taps do not route', async () => {
    const h = harness({ planId: id, endsAt: Date.now() + 60000 });
    await h.emit('notificationclick', { notification: { close() {}, data: { planId: id, url: 'https://attacker.test' } } });
    expect(h.opened).toEqual([`https://example.test/#web-checkin=${id}`]);
    const stale = harness(null);
    await stale.emit('notificationclick', { notification: { close() {}, data: { planId: id } } });
    expect(stale.opened).toEqual(['https://example.test/']);
  });
  it('navigates and focuses an existing window', async () => {
    const h = harness({ planId: id, endsAt: Date.now() + 60000 }); let focused = false;
    h.self.clients.matchAll = async () => [{ url: 'https://example.test/reset', navigate: async url => h.navigated.push(url), focus: async () => { focused = true; } }];
    await h.emit('notificationclick', { notification: { close() {}, data: { planId: id } } });
    expect(h.navigated).toEqual([`https://example.test/#web-checkin=${id}`]); expect(focused).toBe(true);
  });
});
