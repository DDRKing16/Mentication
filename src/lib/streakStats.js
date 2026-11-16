// @ts-check
// Recover both streaks from retained history, while preserving a historical
// best recorded by earlier versions. The optional cache is not a prerequisite
// for showing accurate statistics from readable sessions.
import { computeLocalCalendarStreakStats } from './streak';

const KEY = 'mentation.longestStreak.v1';
const storage = () => (typeof window === 'undefined' ? null : window.localStorage);

function readLongest() {
  try {
    const raw = Number(storage()?.getItem(KEY));
    return Number.isSafeInteger(raw) && raw > 0 ? raw : 0;
  } catch {
    return 0;
  }
}

/** Current streak and longest retained/cached streak. Full data deletion removes the cache. */
export function getStreakStats(sessions = [], now = new Date()) {
  const derived = computeLocalCalendarStreakStats(sessions, { now });
  const cached = readLongest();
  const longestStreak = Math.max(cached, derived.longestStreak);
  if (longestStreak > cached) {
    try {
      storage()?.setItem(KEY, String(longestStreak));
    } catch {
      // Storage unavailable: the full-history result is still valid this read.
    }
  }
  return { currentStreak: derived.currentStreak, longestStreak };
}
