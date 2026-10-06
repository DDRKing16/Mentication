import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { takeawayStore, deleteAllLocalAppData, exportLocalAppData, sessionStore } from './localData';
import { JOURNEY_EXPERIENCES, NEED_ENTRIES } from './journeyExperience';
import { ACTIVE_INTERVENTION_IDS } from './final50Catalog';
import { pauseJourneyFrame } from './journeyBridge';

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i]; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
beforeEach(() => {
  const target = new EventTarget();
  globalThis.window = Object.assign(target, { localStorage: new MemoryStorage(), location:{ origin:'http://localhost' }, setTimeout, clearTimeout });
  globalThis.CustomEvent = class extends Event { constructor(type) { super(type); } };
});
afterEach(() => { delete globalThis.window; delete globalThis.CustomEvent; vi.restoreAllMocks(); });
describe('explicit takeaways', () => {
  it('covers every shipped experience without claiming a recommendation match', () => {
    for (const id of [...ACTIVE_INTERVENTION_IDS, 'dear2100', 'foundations']) {
      expect(JOURNEY_EXPERIENCES[id].prompt.length).toBeGreaterThan(20);
      expect(JOURNEY_EXPERIENCES[id].alternative.length).toBeGreaterThan(40);
    }
    for (const need of NEED_ENTRIES) expect(ACTIVE_INTERVENTION_IDS).toContain(need.practice);
  });
  it('offers distinct care entry choices while preserving the existing suggestions', () => {
    expect(NEED_ENTRIES.slice(0, 6).map(({ id, practice }) => [id, practice])).toEqual([
      ['overwhelmed', 'signalLock'], ['starting', 'nextAction'], ['thought', 'factCheck'],
      ['tense', 'progressive-muscle-relaxation-v2'], ['flat', 'changeScene'], ['bedtime', 'tomorrowParking'],
    ]);
    expect(NEED_ENTRIES.slice(6).map(({ practice }) => practice)).toEqual(['selfCompassion', 'unhook', 'makeRoom']);
    expect(new Set(NEED_ENTRIES.map(({ id }) => id)).size).toBe(NEED_ENTRIES.length);
    for (const entry of NEED_ENTRIES.slice(6)) {
      expect(entry.label.length).toBeGreaterThan(15);
      expect(entry.reason).not.toMatch(/diagnos|best.fit|optimal|guarantee|will feel/i);
      expect(JOURNEY_EXPERIENCES[entry.practice].alternative).toBeTruthy();
    }
  });
  it('only saves entered content, updates without duplicates, and is excluded from session statistics', async () => {
    expect(() => takeawayStore.save({ interventionId:'boxV2', text:'  ' })).toThrow();
    const record = takeawayStore.save({ interventionId:'boxV2', text:'  I prefer an unforced pace.  ' });
    expect(takeawayStore.list()[0].text).toBe('I prefer an unforced pace.');
    takeawayStore.save({ ...record, text:'No holds next time.' });
    expect(takeawayStore.list()).toHaveLength(1);
    expect(await sessionStore.list()).toEqual([]);
    expect(exportLocalAppData().takeaways[0].text).toBe('No holds next time.');
    takeawayStore.delete(record.id);
    expect(takeawayStore.list()).toEqual([]);
  });
  it('propagates write and deletion errors rather than falsely reporting success', () => {
    const record = takeawayStore.save({ interventionId:'urgeSurf', text:'Call my trusted friend.' });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    expect(() => takeawayStore.delete(record.id)).toThrow('Quota');
    expect(() => takeawayStore.save({ interventionId:'urgeSurf', text:'A new note' })).toThrow('Quota');
    expect(takeawayStore.list()).toEqual([record]);
  });
  it('does not silently overwrite corrupt saved data', () => {
    for (const value of ['{broken', '{}', '[null]']) {
      window.localStorage.setItem('mentation.takeaways.v1', value);
      expect(() => takeawayStore.save({ interventionId:'boxV2', text:'New note' })).toThrow();
      expect(window.localStorage.getItem('mentation.takeaways.v1')).toBe(value);
    }
  });
  it('deletes notes with existing app-wide device deletion without touching other apps', () => {
    takeawayStore.save({ interventionId:'vectorShift', text:'Notice a still object.' });
    window.localStorage.setItem('another-app', 'keep');
    deleteAllLocalAppData();
    expect(takeawayStore.list()).toEqual([]);
    expect(window.localStorage.getItem('another-app')).toBe('keep');
  });
});
describe('standalone pause handshake', () => {
  const message = (source, origin, requestId) => {
    const event = new Event('message');
    Object.assign(event, { source, origin, data:{ type:'mentication:alternative-ready', requestId } });
    window.dispatchEvent(event);
  };
  it('accepts only the current frame, origin and matching request', async () => {
    let request;
    const frame = { contentWindow:{ postMessage: data => { request = data; } } };
    const waiting = pauseJourneyFrame(frame, {timeoutMs:100});
    let resolved = false;
    waiting.then(() => { resolved=true; });
    message({}, window.location.origin, request.requestId);
    message(frame.contentWindow, 'https://other.invalid', request.requestId);
    message(frame.contentWindow, window.location.origin, 'stale');
    await Promise.resolve();
    expect(resolved).toBe(false);
    message(frame.contentWindow, window.location.origin, request.requestId);
    await expect(waiting).resolves.toBe(true);
  });
  it('fails truthfully if a worker has not implemented the handshake', async () => {
    await expect(pauseJourneyFrame({ contentWindow:{postMessage() {}} }, {timeoutMs:5})).rejects.toThrow('could not confirm');
    await expect(pauseJourneyFrame(null)).rejects.toThrow('still loading');
  });
});

it('includes SignalLock grounding records in the shared export without turning them into notes or sessions', () => {
  window.localStorage.setItem('mentation.signal-lock.grounding.v1', JSON.stringify({ version:1, current:{status:'paused'}, history:[] }));
  expect(exportLocalAppData().signalLock.current.status).toBe('paused');
  expect(exportLocalAppData().sessions).toEqual([]);
  expect(exportLocalAppData().takeaways).toEqual([]);
});
