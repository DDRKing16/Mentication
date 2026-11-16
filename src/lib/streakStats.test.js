import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStreakStats } from './streakStats';

const now = new Date('2026-11-16T12:00:00');
const key = 'mentation.longestStreak.v1';
function days(count, end = now, perDay = 1) {
  return Array.from({ length: count * perDay }, (_, index) => {
    const date = new Date(end); date.setDate(date.getDate() - Math.floor(index / perDay));
    return { created_date: date.toISOString() };
  });
}
function cache(initial = null) {
  const data = new Map(initial == null ? [] : [[key, String(initial)]]);
  const localStorage = { getItem: vi.fn(k => data.get(k) ?? null), setItem: vi.fn((k, v) => data.set(k, v)) };
  vi.stubGlobal('window', { localStorage }); return localStorage;
}
afterEach(() => vi.unstubAllGlobals());

describe('longest streak from retained history', () => {
  it('recovers an ended longest streak from an imported full history, rather than current streak only', () => {
    cache();
    const pastEnd = new Date(now); pastEnd.setDate(pastEnd.getDate() - 20);
    expect(getStreakStats([...days(2), ...days(650, pastEnd, 2)], now)).toEqual({ currentStreak: 2, longestStreak: 650 });
  });
  it('preserves a previously cached longer streak, but can start over after cache deletion', () => {
    cache(900);
    expect(getStreakStats(days(5, now, 110), now)).toEqual({ currentStreak: 5, longestStreak: 900 });
    cache();
    expect(getStreakStats([], now)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });
  it('retains correct derived statistics when cache reads or writes throw', () => {
    const local = cache(); local.getItem.mockImplementation(() => { throw Error('Unavailable'); });
    local.setItem.mockImplementation(() => { throw Error('Quota'); });
    expect(getStreakStats(days(4), now)).toEqual({ currentStreak: 4, longestStreak: 4 });
    vi.stubGlobal('window', { get localStorage() { throw Error('Denied'); } });
    expect(getStreakStats(days(4), now)).toEqual({ currentStreak: 4, longestStreak: 4 });
  });
  it('ignores malformed cached values and does not rewrite an unchanged cache', () => {
    const local = cache(4);
    expect(getStreakStats(days(2), now).longestStreak).toBe(4);
    expect(local.setItem).not.toHaveBeenCalled();
    cache('invalid');
    expect(getStreakStats(days(2), now).longestStreak).toBe(2);
  });
});
