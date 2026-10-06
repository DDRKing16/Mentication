import { describe, expect, it } from 'vitest';
import { createSession, advance, restoreSession, saveSession, readSaved, durationText, STORAGE_KEY } from '../../public/signal-lock/session.js';
const fresh = () => createSession('synthetic-session', 1000);
const apply = (state, ...actions) => actions.reduce(advance, state);
describe('Signal Lock records only actual progress', () => {
  it('skips without completing anything or fabricating time/feelings', () => {
    const s = advance(fresh(), { type: 'finish', now: 2000 });
    expect(s).toMatchObject({ status: 'skipped', elapsedMs: 0, pairs: 0, feeling: null });
  });
  it('counts two distinct ordered taps once, never wrong or repeated taps', () => {
    let s = advance(fresh(), { type: 'start' });
    s = apply(s, { type: 'tap', target: 2 }, { type: 'tap', target: 1 }, { type: 'tap', target: 1 });
    expect(s).toMatchObject({ pairs: 0, halfPair: true });
    s = apply(s, { type: 'tap', target: 2 }, { type: 'tap', target: 2 });
    expect(s).toMatchObject({ pairs: 1, halfPair: false });
  });
  it('pauses, resumes without resetting, and excludes paused/review time', () => {
    const s = apply(fresh(), { type: 'start' }, { type: 'tick', ms: 1234 }, { type: 'pause' },
      { type: 'tick', ms: 120000 }, { type: 'tap', target: 1 }, { type: 'start' },
      { type: 'tick', ms: 777 }, { type: 'finish', now: 3000 }, { type: 'tick', ms: 1000 });
    expect(s).toMatchObject({ elapsedMs: 2011, status: 'ended', halfPair: false });
  });
  it.each([3000, 100000, NaN, Infinity, -1])('does not count an invalid or interrupted timer gap: %s', ms => {
    const s = apply(fresh(), { type: 'start' }, { type: 'tick', ms: 1000 }, { type: 'tick', ms });
    expect(s).toMatchObject({ elapsedMs: 1000, status: 'paused' });
  });
  it('requires a full scene AND explicit finish before using completed status', () => {
    let s = advance(fresh(), { type: 'start' });
    expect(advance(s, { type: 'finish', complete: true }).status).toBe('ended');
    for (let i = 0; i < 6; i++) s = apply(s, { type: 'tap', target: 1 }, { type: 'tap', target: 2 });
    expect(s.status).toBe('active');
    expect(advance(s, { type: 'finish' }).status).toBe('ended');
    expect(advance(s, { type: 'finish', complete: true }).status).toBe('completed');
    s = advance(s, { type: 'tap', target: 1 });
    expect(advance(s, { type: 'finish', complete: true }).status).toBe('ended');
  });
  it('preserves unfinished connections and restores active sessions paused', () => {
    const s = apply(fresh(), { type: 'start' }, { type: 'tick', ms: 800 }, { type: 'tap', target: 1 });
    const restored = restoreSession(JSON.parse(JSON.stringify(s)));
    expect(restored).toMatchObject({ status: 'paused', elapsedMs: 800, halfPair: true });
    expect(advance(restored, { type: 'tap', target: 2 }).pairs).toBe(0);
    expect(apply(restored, { type: 'start' }, { type: 'tap', target: 2 }).pairs).toBe(1);
  });
  it('saves one history record per session, updates explicit check-in, leaves other keys intact', () => {
    const values = new Map([['existing-progress', 'keep']]);
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    let s = apply(fresh(), { type: 'start' }, { type: 'finish', now: 3000 });
    let result = saveSession(storage, s, []);
    s = advance(s, { type: 'feeling', value: 'About the same' });
    result = saveSession(storage, s, result.history);
    expect(result.history).toHaveLength(1);
    expect(readSaved(storage).current.feeling).toBe('About the same');
    expect(values.get('existing-progress')).toBe('keep');
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(saveSession(storage, createSession('next'), result.history).history).toHaveLength(1);
  });
  it('handles unavailable storage, corrupt data, and unknown wellbeing honestly', () => {
    expect(saveSession(undefined, fresh(), []).saved).toBe(false);
    expect(readSaved({ getItem: () => '{' }).current).toBeNull();
    expect(restoreSession({ ...fresh(), pairs: -2 })).toBeNull();
    expect(restoreSession({ ...fresh(), feeling: 'calm' }).feeling).toBeNull();
    expect(advance(fresh(), { type: 'feeling', value: 'A little easier' }).feeling).toBeNull();
  });
  it('formats measured seconds without rounding up to planned minutes', () => {
    expect(durationText(999)).toBe('0s'); expect(durationText(61001)).toBe('1m 1s');
  });
});
