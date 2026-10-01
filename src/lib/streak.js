// @ts-check
// The local-calendar streak calculation, split out of `@/lib/insights` so
// screens that only need "how many days in a row" (Home, Your Week) don't
// have to load the intervention/recommendation engine that the rest of
// insights.js needs.
function localCalendarDayIndex(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return Math.floor(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) / 86400000);
}

/** @param {Array<{ created_date?: string | Date }>} sessions @param {{ now?: Date, timeZone?: string }} [options] */
export function computeLocalCalendarStreak(sessions = [], { now = new Date(), timeZone } = {}) {
  const today = localCalendarDayIndex(now, timeZone);
  if (today == null) return 0;
  const days = [...new Set(
    sessions
      .map((session) => localCalendarDayIndex(session?.created_date, timeZone))
      .filter((day) => day != null),
  )].sort((a, b) => b - a);
  if (!days.length || days[0] < today - 1) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index] !== days[index - 1] - 1) break;
    streak += 1;
  }
  return streak;
}
