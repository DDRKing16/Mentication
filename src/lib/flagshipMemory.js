const PREF_KEY = "mentation.flagship.preferences.v1";
const ACTIVE_KEY = "mentation.flagship.active.v1";
const HANDOFF_KEY = "mentation.flagship.handoffs.v1";
const PARKING_KEY = "mentation.tomorrowParking.pending";
const PARKING_RECORDS_KEY = "mentication.tomorrowParking.records.v1";
const PARKING_CONSENTS_KEY = "mentication.tomorrowParking.consents.v1";
const NIGHT_FEEDBACK_KEY = "mentation.nightChannel.feedback.v1";
const ACTIVE_TTL_MS = 24 * 60 * 60 * 1000;

const safeParse = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
};

const ALLOWED_PREFERENCE_KEYS = new Set([
  "interventionId", "options", "barriers", "actionSize", "simplified", "swapped",
  "skipped", "dismissed", "partial", "completed", "worthwhile", "tone",
  "contactLevel", "movementStyle", "intensity", "context", "handoff", "barrier",
]);

const PRIVATE_OPTION_KEYS = new Set([
  "thought", "prediction", "test", "outcome", "balanced", "frame", "coping",
  "message", "action", "parkingItem", "target", "precise", "activity", "topic",
]);

function sanitiseOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) return undefined;
  return Object.fromEntries(Object.entries(options).map(([key, value]) => {
    if (PRIVATE_OPTION_KEYS.has(key)) return [key, "captured"];
    if (typeof value === "string") return [key, value.length <= 80 ? value : "captured"];
    if (typeof value === "number" || typeof value === "boolean") return [key, value];
    if (Array.isArray(value)) return [key, value.slice(0, 8).map((entry) => typeof entry === "string" && entry.length <= 40 ? entry : "selected")];
    return [key, "selected"];
  }));
}

export function rememberFlagshipEvent(event = {}) {
  const clean = {};
  Object.entries(event).forEach(([key, value]) => {
    if (!ALLOWED_PREFERENCE_KEYS.has(key)) return;
    if (typeof value === "string" && value.length > 120) return;
    clean[key] = key === "options" ? sanitiseOptions(value) : value;
  });
  const current = safeParse(PREF_KEY, { version: 1, events: [] });
  const events = [...(current.events || []), { ...clean, at: new Date().toISOString() }].slice(-200);
  save(PREF_KEY, { version: 1, events });
}

export function getFlagshipPreferences() {
  return safeParse(PREF_KEY, { version: 1, events: [] });
}

export function saveActiveFlagship(state) {
  if (!state?.interventionId) return;
  save(ACTIVE_KEY, { ...state, updatedAt: new Date().toISOString(), expiresAt: Date.now() + ACTIVE_TTL_MS });
}

export function getActiveFlagship() {
  const active = safeParse(ACTIVE_KEY, null);
  if (active?.expiresAt && active.expiresAt < Date.now()) {
    try { localStorage.removeItem(ACTIVE_KEY); } catch { /* */ }
    return null;
  }
  return active;
}

export function clearActiveFlagship(interventionId) {
  const active = getActiveFlagship();
  if (!interventionId || active?.interventionId === interventionId) {
    try { localStorage.removeItem(ACTIVE_KEY); } catch { /* */ }
  }
}

export function getHandoffMemory() {
  return safeParse(HANDOFF_KEY, { version: 1, dismissed: {}, accepted: [], recent: [] });
}

export function recordHandoffDecision(from, to, decision) {
  const current = getHandoffMemory();
  const pair = `${from}->${to}`;
  if (decision === "dismissed") current.dismissed[pair] = Date.now();
  if (decision === "accepted") current.accepted = [...current.accepted, { pair, at: Date.now() }].slice(-30);
  current.recent = [to, ...(current.recent || []).filter((id) => id !== to)].slice(0, 8);
  save(HANDOFF_KEY, current);
  rememberFlagshipEvent({ interventionId: from, handoff: `${to}:${decision}` });
}

export function saveTomorrowParkingItem(item) {
  if (!item?.trim()) return;
  save(PARKING_KEY, { item: item.trim(), createdAt: new Date().toISOString() });
}

export function getTomorrowParkingItem() {
  return safeParse(PARKING_KEY, null);
}

export function clearTomorrowParkingItem() {
  try { localStorage.removeItem(PARKING_KEY); } catch { /* private mode */ }
}

export function saveNightChannelFeedbackPrompt(details = {}) {
  save(NIGHT_FEEDBACK_KEY, { ...details, createdAt: new Date().toISOString() });
}

export function getNightChannelFeedbackPrompt() {
  return safeParse(NIGHT_FEEDBACK_KEY, null);
}

export function clearNightChannelFeedbackPrompt() {
  try { localStorage.removeItem(NIGHT_FEEDBACK_KEY); } catch { /* private mode */ }
}

export function getFlagshipPatternSummary(interventionId) {
  const events = getFlagshipPreferences().events.filter((event) => event.interventionId === interventionId);
  if (!events.length) return { level: "observation", count: 0, message: "No saved pattern exists." };
  if (events.length < 3) return { level: "observation", count: events.length, message: "This is a recorded choice, not a pattern yet." };
  if (events.length < 5) return { level: "tentative", count: events.length, message: "A tentative pattern based on a few previous choices." };
  return { level: "descriptive", count: events.length, message: "A repeated descriptive pattern based on user-confirmed choices." };
}

export function deleteFlagshipMemory(scope = "all") {
  const keys = scope === "active" ? [ACTIVE_KEY]
    : scope === "preferences" ? [PREF_KEY, HANDOFF_KEY]
      : scope === "saved" ? [PARKING_KEY, PARKING_RECORDS_KEY, NIGHT_FEEDBACK_KEY]
        : [PREF_KEY, ACTIVE_KEY, HANDOFF_KEY, PARKING_KEY, PARKING_RECORDS_KEY, PARKING_CONSENTS_KEY, NIGHT_FEEDBACK_KEY];
  keys.forEach((key) => { try { localStorage.removeItem(key); } catch { /* private mode */ } });
}
