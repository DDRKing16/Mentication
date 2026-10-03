// @ts-check
// Longest-streak bookkeeping, layered on top of the existing
// `computeLocalCalendarStreak` (src/lib/streak.js), which already derives
// the *current* streak straight from session history — no separate
// "currentStreak" state to keep in sync. Longest-ever streak isn't derivable
// cheaply on every read, so it's cached locally and only ever grows.
import { computeLocalCalendarStreak } from "./streak";

const KEY = "mentation.longestStreak.v1";
const storage = () => (typeof window === "undefined" ? null : window.localStorage);

function readLongest() {
  const raw = Number(storage()?.getItem(KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

/**
 * Current streak (from session history) plus the longest ever recorded.
 * Call whenever session history changes; this both reads and — if the
 * current streak is a new high — updates the cached longest streak.
 */
export function getStreakStats(sessions = [], now = new Date()) {
  const currentStreak = computeLocalCalendarStreak(sessions, { now });
  const longestStreak = Math.max(readLongest(), currentStreak);
  try {
    storage()?.setItem(KEY, String(longestStreak));
  } catch {
    // storage unavailable — longest just won't persist this session
  }
  return { currentStreak, longestStreak };
}
