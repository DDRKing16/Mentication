// Signal Lock records interaction and foreground time, never inferred wellbeing.
export const STORAGE_KEY = 'mentation.signal-lock.grounding.v1';
export const PAIRS_PER_SCENE = 6;
export const TERMINAL = ['skipped', 'ended', 'completed'];
const STATUSES = ['ready', 'active', 'paused', ...TERMINAL];
const FEELINGS = ['A little easier', 'About the same', 'More difficult', 'Not sure'];
export { FEELINGS };

export function createSession(id, now = Date.now()) {
  return { version: 1, id, createdAt: now, status: 'ready', elapsedMs: 0,
    pairs: 0, halfPair: false, feeling: null, endedAt: null };
}

export function restoreSession(value) {
  if (!value || value.version !== 1 || typeof value.id !== 'string' ||
      !STATUSES.includes(value.status) || !Number.isFinite(value.elapsedMs) || value.elapsedMs < 0 ||
      !Number.isSafeInteger(value.pairs) || value.pairs < 0 || typeof value.halfPair !== 'boolean') return null;
  const restored = { ...value, feeling: FEELINGS.includes(value.feeling) ? value.feeling : null };
  // A closed tab, reload or app interruption never counts as focus time.
  if (restored.status === 'active') restored.status = 'paused';
  if (restored.status === 'completed' && (!restored.pairs || restored.pairs % PAIRS_PER_SCENE || restored.halfPair)) restored.status = 'ended';
  return restored;
}

export function advance(session, action) {
  if (action.type === 'start' && ['ready', 'paused'].includes(session.status)) return { ...session, status: 'active' };
  if (action.type === 'pause' && session.status === 'active') return { ...session, status: 'paused' };
  if (action.type === 'tick' && session.status === 'active') {
    // Long gaps indicate a suspended process. Do not invent time for that gap.
    if (!Number.isFinite(action.ms) || action.ms < 0 || action.ms > 2500) return { ...session, status: 'paused' };
    return { ...session, elapsedMs: session.elapsedMs + action.ms };
  }
  if (action.type === 'tap' && session.status === 'active') {
    if (action.target === 1 && !session.halfPair) return { ...session, halfPair: true };
    if (action.target === 2 && session.halfPair) return { ...session, halfPair: false, pairs: session.pairs + 1 };
  }
  if (action.type === 'finish' && !TERMINAL.includes(session.status)) {
    const complete = action.complete === true && session.pairs > 0 && session.pairs % PAIRS_PER_SCENE === 0 && !session.halfPair;
    return { ...session, status: session.status === 'ready' ? 'skipped' : complete ? 'completed' : 'ended', endedAt: action.now };
  }
  if (action.type === 'feeling' && TERMINAL.includes(session.status) && FEELINGS.includes(action.value)) {
    return { ...session, feeling: action.value };
  }
  return session;
}

export function durationText(ms) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function readSaved(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    return { current: restoreSession(saved?.current), history: Array.isArray(saved?.history) ? saved.history.map(restoreSession).filter(Boolean).slice(-50) : [] };
  } catch { return { current: null, history: [] }; }
}

export function saveSession(storage, current, history) {
  const records = TERMINAL.includes(current.status)
    ? [...history.filter(item => item.id !== current.id), current].slice(-50) : history;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, current, history: records }));
    return { history: records, saved: true };
  } catch { return { history: records, saved: false }; }
}
