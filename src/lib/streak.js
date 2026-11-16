// @ts-check
// Calendar-day statistics derived from the complete supplied history. Keep this
// independent of the intervention engine for lightweight Home readers.
function localCalendarDayIndex(value, formatter) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return Math.floor(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) / 86400000);
}

/**
 * Multiple sessions on a local calendar day count once. A current streak may
 * end today or yesterday; historical runs remain eligible for the longest.
 * Invalid dates and future calendar days cannot create or interrupt a run.
 * @param {Array<{ created_date?: string | Date }>} sessions
 * @param {{ now?: Date, timeZone?: string }} [options]
 */
export function computeLocalCalendarStreakStats(sessions = [], { now = new Date(), timeZone } = {}) {
  // Reuse one formatter across all records; a long history must not create
  // thousands of expensive Intl formatter instances on every refresh.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const today = localCalendarDayIndex(now, formatter);
  if (today == null) return { currentStreak: 0, longestStreak: 0 };
  const days = [...new Set(sessions
    .map(session => localCalendarDayIndex(session?.created_date, formatter))
    .filter(day => day != null && day <= today),
  )].sort((a, b) => b - a);

  let currentStreak = 0, longestStreak = 0, run = 0;
  let inCurrentRun = days.length > 0 && days[0] >= today - 1;
  for (let index = 0; index < days.length; index += 1) {
    if (index > 0 && days[index] !== days[index - 1] - 1) {
      run = 0;
      inCurrentRun = false;
    }
    run += 1;
    if (inCurrentRun) currentStreak = run;
    longestStreak = Math.max(longestStreak, run);
  }
  return { currentStreak, longestStreak };
}

/** @param {Array<{ created_date?: string | Date }>} sessions @param {{ now?: Date, timeZone?: string }} [options] */
export function computeLocalCalendarStreak(sessions = [], options = {}) {
  return computeLocalCalendarStreakStats(sessions, options).currentStreak;
}
