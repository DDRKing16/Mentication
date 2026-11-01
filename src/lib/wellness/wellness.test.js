import { describe, it, expect, vi } from 'vitest';
import { ouraDailySnapshot } from './oura';
import { cleanSnapshot, validDay } from './providers';
import { createWellnessController } from './controller';

const day = '2026-11-01';
const snapshot = { syncedAt: '2026-11-01T10:00:00Z', metrics: [{ id: 'sleep', label: 'Sleep', unit: 'score', value: 0, day }] };
const data = (...rows) => ({ data: rows });

describe('wellness summaries', () => {
  it('maps Oura scores for the requested day without replacing missing scores or zero', () => {
    const result = ouraDailySnapshot({ sleep: data({ day, score: 0 }), readiness: data({ day: '2026-10-31', score: 80 }), activity: data({ day, score: null }) }, day, snapshot.syncedAt);
    expect(result.metrics.map(metric => metric.value)).toEqual([0, null, null]);
    expect(result.metrics.every(metric => metric.day === day && metric.provider === 'oura' && metric.unit === 'score')).toBe(true);
  });
  it('rejects invalid dates and scores instead of coercing them', () => {
    expect(validDay('2026-02-30')).toBe(false);
    for (const value of ['85', -1, 101, NaN, Infinity]) expect(() => cleanSnapshot('oura', { ...snapshot, metrics: [{ ...snapshot.metrics[0], value }] })).toThrow();
    expect(() => cleanSnapshot('unknown', snapshot)).toThrow();
    expect(() => ouraDailySnapshot({ sleep: {}, readiness: data(), activity: data() }, day, snapshot.syncedAt)).toThrow();
  });
  it('strips credentials and extra provider fields', () => {
    const result = cleanSnapshot('oura', { ...snapshot, accessToken: 'secret', metrics: [{ ...snapshot.metrics[0], private: 'secret' }] });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});

describe('provider connection lifecycle', () => {
  it('does no network work and exposes setup gates without an adapter', async () => {
    const controller = createWellnessController();
    await controller.run('connect', 'oura', true);
    expect(controller.read().sources.every(source => source.status === 'setup')).toBe(true);
  });
  it('requires consent and prevents duplicate requests; removes summary after disconnect', async () => {
    let resolve;
    const adapter = { connect: vi.fn(() => new Promise(done => { resolve = done; })), disconnect: vi.fn(async () => ({})) };
    const controller = createWellnessController({ oura: adapter });
    await controller.run('connect', 'oura'); expect(adapter.connect).not.toHaveBeenCalled();
    const pending = controller.run('connect', 'oura', true);
    expect(controller.read().sources[0].status).toBe('loading');
    await controller.run('connect', 'oura', true); expect(adapter.connect).toHaveBeenCalledTimes(1);
    resolve({ connected: true, snapshot }); await pending;
    expect(controller.read().sources[0].snapshot.metrics[0].value).toBe(0);
    await controller.run('disconnect', 'oura');
    expect(controller.read().sources[0]).toMatchObject({ status: 'disconnected', connected: false });
    expect(controller.read().sources[0].snapshot).toBeUndefined();
  });
  it('keeps known connection on failed disconnect and sanitizes errors', async () => {
    const controller = createWellnessController({ oura: {
      status: async () => ({ connected: true, snapshot }),
      disconnect: async () => { throw new Error('provider secret'); },
      sync: async () => { throw new Error('provider secret'); },
    } });
    const listener = vi.fn(); const unsubscribe = controller.subscribe(listener);
    await controller.run('status', 'oura'); await controller.run('sync', 'oura');
    expect(controller.read().sources[0]).toMatchObject({ status: 'error', connected: true });
    await controller.run('disconnect', 'oura');
    expect(controller.read().sources[0].error).toContain('Access may still be active');
    expect(JSON.stringify(controller.read())).not.toContain('provider secret');
    expect(listener).toHaveBeenCalled(); unsubscribe();
  });
});
