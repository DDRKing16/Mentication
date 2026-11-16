import { describe, expect, it, vi } from 'vitest';
import { computeLocalCalendarStreak } from './streak';

const now = new Date('2026-11-16T18:00:00Z');
const records = dates => dates.map(created_date => ({ created_date }));
const daily = (days, perDay = 1, end = now) => Array.from({ length: days * perDay }, (_, i) => ({
  created_date: new Date(end.getTime() - Math.floor(i / perDay) * 86400000).toISOString(),
}));

describe('local-calendar streaks across complete histories', () => {
  it('counts more than 500 consecutive days, without counting same-day repeats', () => {
    expect(computeLocalCalendarStreak(daily(650, 3), { now, timeZone: 'UTC' })).toBe(650);
    expect(computeLocalCalendarStreak(daily(30, 25), { now, timeZone: 'UTC' })).toBe(30);
  });
  it('preserves yesterday grace and stops at the first missing day', () => {
    expect(computeLocalCalendarStreak(daily(8, 2, new Date(now.getTime() - 86400000)), { now, timeZone: 'UTC' })).toBe(8);
    expect(computeLocalCalendarStreak(daily(8, 2, new Date(now.getTime() - 2 * 86400000)), { now, timeZone: 'UTC' })).toBe(0);
    expect(computeLocalCalendarStreak(records(['2026-11-16','2026-11-15','2026-11-13']), { now, timeZone: 'UTC' })).toBe(2);
  });
  it('ignores future calendar days and invalid or missing dates', () => {
    const sessions = [...daily(3), ...records(['2027-01-01', 'not a date', undefined, null])];
    expect(computeLocalCalendarStreak(sessions, { now, timeZone: 'UTC' })).toBe(3);
    expect(computeLocalCalendarStreak(records(['2027-01-01']), { now, timeZone: 'UTC' })).toBe(0);
    expect(computeLocalCalendarStreak([], { now: new Date('invalid') })).toBe(0);
  });
  it('uses local dates across midnight and daylight-saving boundaries', () => {
    expect(computeLocalCalendarStreak(records(['2026-11-16T00:30:00Z','2026-11-15T00:30:00Z']), {
      now: new Date('2026-11-16T01:00:00Z'), timeZone: 'America/Los_Angeles',
    })).toBe(2);
    expect(computeLocalCalendarStreak(records(['2026-03-09T01:00:00Z','2026-03-08T01:00:00Z','2026-03-07T01:00:00Z']), {
      now: new Date('2026-03-09T01:00:00Z'), timeZone: 'America/New_York',
    })).toBe(3);
    expect(computeLocalCalendarStreak(records(['2026-11-01T05:30:00Z','2026-11-01T06:30:00Z','2026-10-31T16:00:00Z']), {
      now: new Date('2026-11-01T18:00:00Z'), timeZone: 'America/New_York',
    })).toBe(2);
  });
  it('constructs one formatter per calculation, not one for every retained session', () => {
    const DateTimeFormat = Intl.DateTimeFormat;
    const formatter = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (...args) { return new DateTimeFormat(...args); });
    try {
      computeLocalCalendarStreak(daily(650, 3), { now, timeZone: 'UTC' });
      expect(formatter).toHaveBeenCalledTimes(1);
    } finally { formatter.mockRestore(); }
  });
});
