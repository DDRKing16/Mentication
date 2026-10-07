import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, deliverDue, validatePlan } from './store.mjs';
import { createCheckInServer } from './api.mjs';
const now = 1800000000000;
const plan = (changes = {}) => ({ planId: '12345678-1234-1234-1234-123456789abc', startedAt: now, endsAt: now + 1200000, intervalMinutes: 10,
  subscription: { endpoint: 'https://web.push.apple.com/example', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } }, ...changes });

describe('durable minimal check-in scheduler', () => {
  it('rejects personal fields, arbitrary endpoints, invalid keys and unbounded schedules', () => {
    for (const body of [plan({ situation: 'private' }), plan({ intervalMinutes: 1 }), plan({ endsAt: now + 121 * 60000 }),
      plan({ subscription: { ...plan().subscription, endpoint: 'https://localhost/private' } }),
      plan({ subscription: { ...plan().subscription, endpoint: 'https://web.push.apple.com.attacker.test/' } }),
      plan({ subscription: { ...plan().subscription, expirationTime: now - 1 } })]) expect(() => validatePlan(body, now)).toThrow();
    expect(validatePlan(plan(), now).planId).toBe(plan().planId);
  });
  it('persists progress across restarts without duplicating a send', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'checkins-')); let store;
    try {
      store = createStore(join(dir, 'test.sqlite')); store.put('owner', validatePlan(plan(), now), now);
      const sent = [];
      await deliverDue(store, async (...args) => sent.push(args), now + 600000);
      store.close(); store = createStore(join(dir, 'test.sqlite'));
      await deliverDue(store, async (...args) => sent.push(args), now + 600001);
      expect(sent).toHaveLength(1);
      expect(JSON.parse(sent[0][1])).toEqual({ planId: plan().planId, expiresAt: now + 660000 });
      expect(sent[0][2].TTL).toBe(60);
    } finally { store?.close(); rmSync(dir, { recursive: true, force: true }); }
  });
  it('replaces schedules and cancels/completes without retaining subscriptions', async () => {
    const store = createStore(); const sent = [];
    store.put('owner', plan(), now);
    store.put('owner', plan({ startedAt: now + 1000, endsAt: now + 1201000 }), now + 1000);
    await deliverDue(store, async (...args) => sent.push(args), now + 600000);
    expect(sent).toHaveLength(0);
    store.remove('owner'); await deliverDue(store, async (...args) => sent.push(args), now + 601000);
    expect(sent).toHaveLength(0); expect(store.get('owner')).toBeUndefined(); store.close();
  });
  it('drops expired subscriptions, skips stale attempts and bounds transient failures', async () => {
    const store = createStore(); store.put('owner', plan(), now);
    await deliverDue(store, async () => { throw { statusCode: 410 }; }, now + 600000);
    expect(store.get('owner')).toBeUndefined();
    store.put('owner', plan(), now);
    let calls = 0;
    await deliverDue(store, async () => calls++, now + 700000); expect(calls).toBe(0);
    await deliverDue(store, async () => { calls++; throw { statusCode: 503 }; }, now + 1200000);
    await deliverDue(store, async () => calls++, now + 1200000); expect(calls).toBe(1);
    store.prune(now + 1200001); expect(store.get('owner')).toBeUndefined(); store.close();
  });
  it('authorizes by capability, rejects origins and serializes cancellation with sends', async () => {
    const store = createStore(); let clock = now, unblock, entered;
    const started = new Promise(resolve => { entered = resolve; });
    const app = createCheckInServer({ store, origin: 'https://example.test', now: () => clock,
      send: () => { entered(); return new Promise(resolve => { unblock = resolve; }); } });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${app.server.address().port}/v1/plan`;
    const headers = { Origin: 'https://example.test', Authorization: `Bearer ${'a'.repeat(64)}`, 'Content-Type': 'application/json' };
    try {
      expect((await fetch(url, { headers: { ...headers, Origin: 'https://attacker.test' } })).status).toBe(403);
      expect((await fetch(url, { headers: { Origin: 'https://example.test' } })).status).toBe(401);
      expect((await fetch(url, { method: 'PUT', headers, body: JSON.stringify(plan()) })).status).toBe(200);
      expect(await (await fetch(url, { headers: { ...headers, Authorization: `Bearer ${'b'.repeat(64)}` } })).json()).toEqual({ status: 'ended' });
      clock += 600000; const tick = app.tick(); await started;
      const cancel = fetch(url, { method: 'DELETE', headers }); unblock(); await tick;
      expect(await (await cancel).json()).toEqual({ status: 'cancelled' });
      expect(await (await fetch(url, { headers })).json()).toEqual({ status: 'ended' });
    } finally { app.server.closeAllConnections(); await new Promise(resolve => app.server.close(resolve)); store.close(); }
  });
});
