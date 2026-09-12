// Mentication V3 negative-preference memory.
// "This isn't helping" is intentionally powerful, but it decays with a
// 30-day half-life so an old rejection does not permanently bury a practice.

const KEY = "haven.dislikes";
const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_LIFE_DAYS = 30;
const MAX_EVENT_AGE_DAYS = 365;

function nowIso() { return new Date().toISOString(); }

function toEvents(value, nowMs = Date.now()) {
  if (Array.isArray(value)) return value.filter(Boolean);
  // Backward compatibility for the old { id: count } schema. Because the old
  // events have no timestamps, treat them as one half-life old rather than as
  // brand-new dislikes. This preserves some signal without creating a harsh
  // migration spike.
  const count = Math.max(0, Math.floor(Number(value) || 0));
  if (!count) return [];
  const legacyTime = new Date(nowMs - HALF_LIFE_DAYS * DAY_MS).toISOString();
  return Array.from({ length: count }, () => legacyTime);
}

function prune(events = [], nowMs = Date.now()) {
  const cutoff = nowMs - MAX_EVENT_AGE_DAYS * DAY_MS;
  return events.filter((ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

function parseStored(nowMs = Date.now()) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { eventsById: {}, eventsByMech: {} };
    const parsed = JSON.parse(raw);
    const srcId = parsed.eventsById || parsed.byId || {};
    const srcMech = parsed.eventsByMech || parsed.byMech || {};
    const eventsById = {};
    const eventsByMech = {};
    Object.entries(srcId).forEach(([id, value]) => {
      const events = prune(toEvents(value, nowMs), nowMs);
      if (events.length) eventsById[id] = events;
    });
    Object.entries(srcMech).forEach(([mech, value]) => {
      const events = prune(toEvents(value, nowMs), nowMs);
      if (events.length) eventsByMech[mech] = events;
    });
    return { eventsById, eventsByMech };
  } catch {
    return { eventsById: {}, eventsByMech: {} };
  }
}

export function getDislikes() {
  const { eventsById, eventsByMech } = parseStored();
  const byId = Object.fromEntries(Object.entries(eventsById).map(([k, v]) => [k, v.length]));
  const byMech = Object.fromEntries(Object.entries(eventsByMech).map(([k, v]) => [k, v.length]));
  return { byId, byMech, eventsById, eventsByMech };
}

export function recordDislike(id, mechanism, timestamp = nowIso()) {
  if (!id) return;
  try {
    const data = parseStored();
    data.eventsById[id] = [...(data.eventsById[id] || []), timestamp];
    if (mechanism) data.eventsByMech[mechanism] = [...(data.eventsByMech[mechanism] || []), timestamp];
    localStorage.setItem(KEY, JSON.stringify({ version: 3, ...data }));
  } catch { /* storage may be unavailable */ }
}

function decayedCount(events = [], nowMs = Date.now()) {
  return events.reduce((sum, ts) => {
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t)) return sum;
    const days = Math.max(0, (nowMs - t) / DAY_MS);
    return sum + Math.exp(-Math.log(2) * days / HALF_LIFE_DAYS);
  }, 0);
}

// V3 formula:
//   D_exact = Σ exp(-ln(2) * daysAgo / 30)
//   D_mech  = same decay over mechanism dislikes
//   DP      = min(20, 7*D_exact + 2*D_mech)
export function dislikePenalty(id, mechanism, nowMs = Date.now()) {
  const { eventsById, eventsByMech } = parseStored(nowMs);
  const exact = decayedCount(eventsById[id] || [], nowMs);
  const mech = mechanism ? decayedCount(eventsByMech[mechanism] || [], nowMs) : 0;
  return Math.min(20, 7 * exact + 2 * mech);
}
