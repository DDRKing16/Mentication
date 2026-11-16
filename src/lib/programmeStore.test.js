import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activeProgrammeId, leaveProgramme, markProgrammeFinished, programmeStartedAt, readProgrammeStore, startProgramme, subscribeProgrammeStore, PROGRAMME_STORE_KEY, PROGRAMME_CHANGED_EVENT } from './programmeStore';

const START = '2026-11-15T08:00:00.000Z';
const END = '2026-11-16T09:00:00.000Z';
const initial = { 'calmer-seven': { startedAt: START } };
let values, local, events;
beforeEach(() => {
  values = new Map(); events = [];
  local = { getItem: vi.fn(key => values.has(key) ? values.get(key) : null), setItem: vi.fn((key, value) => values.set(key, value)) };
  vi.stubGlobal('window', { localStorage: local, dispatchEvent: event => events.push(event.type) });
  vi.stubGlobal('CustomEvent', class { constructor(type) { this.type = type; } });
});
afterEach(() => vi.unstubAllGlobals());

describe('verified programme metadata', () => {
  it('reads missing data without writing and accepts explicit snapshots without touching storage', () => {
    expect(readProgrammeStore()).toEqual({});
    expect(programmeStartedAt('calmer-seven', initial)).toBe(START);
    expect(activeProgrammeId(initial)).toBe('calmer-seven');
    expect(local.getItem).toHaveBeenCalledTimes(1); expect(local.setItem).not.toHaveBeenCalled();
    expect(programmeStartedAt('__proto__', initial)).toBeNull();
  });
  it('verifies start, finish and leave, preserves other entries and emits only real changes', () => {
    startProgramme('calmer-seven', new Date(START));
    startProgramme('small-lifts-five', new Date(END));
    expect(activeProgrammeId()).toBe('small-lifts-five');
    const finished = markProgrammeFinished('small-lifts-five', new Date(END));
    expect(finished.finishedAt).toBe(END); expect(activeProgrammeId()).toBe('calmer-seven');
    expect(markProgrammeFinished('small-lifts-five', new Date('2026-11-17'))).toEqual(finished);
    leaveProgramme('small-lifts-five'); leaveProgramme('small-lifts-five');
    expect(readProgrammeStore()).toEqual(initial);
    expect(events).toEqual(Array(4).fill(PROGRAMME_CHANGED_EVENT));
  });
  it.each([false, true])('repeated start preserves existing metadata (finished: %s) without writes or events', finished => {
    const record = { startedAt: START, legacyDetail: 'preserved', ...(finished ? { finishedAt: END } : {}) };
    const encoded = JSON.stringify({ 'calmer-seven': record });
    values.set(PROGRAMME_STORE_KEY, encoded);
    expect(startProgramme('calmer-seven', new Date('2026-11-17'))).toEqual(record);
    expect(startProgramme('calmer-seven', new Date('2026-11-18'))).toEqual(record);
    expect(values.get(PROGRAMME_STORE_KEY)).toBe(encoded);
    expect(local.setItem).not.toHaveBeenCalled(); expect(events).toEqual([]);
    leaveProgramme('calmer-seven');
    expect(startProgramme('calmer-seven', new Date(END))).toEqual({ startedAt: END });
    expect(events).toEqual(Array(2).fill(PROGRAMME_CHANGED_EVENT));
  });
  it.each(['{broken', 'null', '[]', '"text"', '{"calmer-seven":null}', '{"calmer-seven":{}}', '{"calmer-seven":{"startedAt":"bad"}}', '{"calmer-seven":{"startedAt":"2026-11-15","finishedAt":false}}'])('rejects corrupt data without replacing it: %s', encoded => {
    values.set(PROGRAMME_STORE_KEY, encoded);
    expect(readProgrammeStore).toThrow();
    for (const action of [startProgramme, leaveProgramme, markProgrammeFinished]) expect(() => action('calmer-seven')).toThrow();
    expect(values.get(PROGRAMME_STORE_KEY)).toBe(encoded); expect(local.setItem).not.toHaveBeenCalled(); expect(events).toEqual([]);
  });
  it('propagates unavailable or blocked reads instead of treating them as a new programme', () => {
    local.getItem.mockImplementation(() => { throw Error('blocked'); });
    expect(readProgrammeStore).toThrow('blocked'); expect(() => startProgramme('calmer-seven')).toThrow('blocked');
    expect(events).toEqual([]); expect(local.setItem).not.toHaveBeenCalled();
    vi.stubGlobal('window', {}); vi.stubGlobal('localStorage', undefined);
    expect(readProgrammeStore).toThrow('unavailable');
  });
  it.each(['quota', 'silent'])('does not report success or emit after %s writes', kind => {
    const encoded=JSON.stringify(initial); values.set(PROGRAMME_STORE_KEY, encoded);
    local.setItem.mockImplementation(() => { if (kind === 'quota') throw Error('quota'); });
    for (const action of [() => startProgramme('small-lifts-five', new Date(END)), () => markProgrammeFinished('calmer-seven'), () => leaveProgramme('calmer-seven')]) expect(action).toThrow();
    expect(values.get(PROGRAMME_STORE_KEY)).toBe(encoded); expect(events).toEqual([]);
  });
  it('reports uncertain verification failure without a false success notification', () => {
    const get = local.getItem;
    get.mockImplementationOnce(() => null).mockImplementationOnce(() => { throw Error('verification blocked'); });
    expect(() => startProgramme('calmer-seven',new Date(START))).toThrow('verification blocked');
    expect(values.get(PROGRAMME_STORE_KEY)).toBe(JSON.stringify(initial)); expect(events).toEqual([]);
  });
  it('rejects unknown programme mutations and does not finish an unstarted programme', () => {
    expect(() => startProgramme('__proto__')).toThrow('not available');
    expect(markProgrammeFinished('calmer-seven')).toBeNull(); expect(local.setItem).not.toHaveBeenCalled();
  });
  it('refreshes relevant lifecycle events and fully unsubscribes', () => {
    const target = new EventTarget(), page = new EventTarget(); page.visibilityState = 'hidden';
    const refresh=vi.fn(), cleanup=subscribeProgrammeStore(refresh,target,page);
    target.dispatchEvent(new Event(PROGRAMME_CHANGED_EVENT)); target.dispatchEvent(new Event('focus'));
    const storage=key=>Object.assign(new Event('storage'),{key});
    target.dispatchEvent(storage('unrelated')); target.dispatchEvent(storage(PROGRAMME_STORE_KEY)); target.dispatchEvent(storage(null));
    page.dispatchEvent(new Event('visibilitychange')); page.visibilityState='visible'; page.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(5); cleanup();
    target.dispatchEvent(new Event(PROGRAMME_CHANGED_EVENT)); target.dispatchEvent(new Event('focus')); target.dispatchEvent(storage(null)); page.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(5);
  });
});
