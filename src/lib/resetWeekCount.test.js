import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {countRecentResets} from './resetWeekCount';
import {sessionStore} from './localData';
import {createSessionCompletion} from './sessionCompletion';

const now = Date.parse('2026-11-17T06:00:00Z');
const key = 'mentation.sessions.v1';
const record = id => ({id, created_date: new Date(now).toISOString()});

describe('ResetFlow rolling weekly saved-session count', () => {
  let values;
  beforeEach(() => {
    values = new Map();
    vi.stubGlobal('window', {localStorage: {
      getItem: name => values.get(name) ?? null,
      setItem: (name, value) => values.set(name, String(value)),
    }, dispatchEvent: vi.fn()});
    vi.stubGlobal('CustomEvent', class { constructor(type) { this.type = type; } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('includes first and second saved sessions without a remount', async () => {
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(0);
    await sessionStore.create(record('first'));
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(1);
    await sessionStore.create(record('second'));
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(2);
  });

  it('counts all 75 weekly records, while recommendation reads stay capped at 50', async () => {
    values.set(key, JSON.stringify(Array.from({length: 75}, (_, i) => record(`reset-${i}`))));
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(75);
    expect(await sessionStore.list('-created_date', 50)).toHaveLength(50);
  });

  it('preserves the rolling cutoff and saved-session, not completion or unique-day, semantics', () => {
    const since = now - 7 * 86400000;
    const records = [
      {...record('cutoff'), created_date: new Date(since).toISOString()},
      {...record('old'), created_date: new Date(since - 1).toISOString()},
      {...record('invalid'), created_date: 'not a date'},
      {id: 'undated'},
      {...record('skipped'), attempts: [{exit_reason: 'skipped', completed_percentage: 0}]},
      {...record('partial'), attempts: [{exit_reason: 'ended_early', completed_percentage: 0.2}]},
      {...record('finished'), attempts: [{exit_reason: 'completed', completed_percentage: 1}]},
      record('same-day-again'),
    ];
    expect(countRecentResets(records, now)).toBe(5);
  });

  it('does not increment a failed save; retry and repeated completion save once', async () => {
    const write = vi.fn().mockRejectedValueOnce(new Error('Storage full')).mockImplementation(sessionStore.create);
    const completion = createSessionCompletion(record('first'), write);
    await expect(completion.save()).rejects.toThrow('Storage full');
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(0);
    await Promise.all([completion.save(), completion.save()]);
    await completion.save();
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(1);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('retries an uncertain persisted write with the same ID, without a second record', async () => {
    const get = window.localStorage.getItem;
    const set = window.localStorage.setItem;
    let uncertain = true;
    window.localStorage.setItem = (name, value) => {
      set(name, value);
      if (uncertain) window.localStorage.getItem = () => { throw new Error('Read unavailable'); };
    };
    const completion = createSessionCompletion(record('same-reset'), sessionStore.create);
    await expect(completion.save()).rejects.toThrow('Read unavailable');
    expect(JSON.parse(values.get(key))).toHaveLength(1);
    expect(window.dispatchEvent).not.toHaveBeenCalled();
    uncertain = false;
    window.localStorage.getItem = get;
    await completion.save();
    expect(countRecentResets(await sessionStore.listAll(), now)).toBe(1);
    expect(JSON.parse(values.get(key))).toHaveLength(1);
  });

  it('does not turn an unreadable history into an empty or successful count', async () => {
    await sessionStore.create(record('saved'));
    window.localStorage.getItem = () => { throw new Error('Read unavailable'); };
    await expect(sessionStore.listAll()).rejects.toThrow('Read unavailable');
    expect(JSON.parse(values.get(key))).toHaveLength(1);
  });
});
