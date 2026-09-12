import { deleteFlagshipMemory } from "./flagshipMemory";
import { resetOnboarding } from "./onboarding";

// Device-local persistence for Mentication.
//
// V1 deliberately has no remote account or application backend. Session data
// stays in this app's local storage and can be erased in-app at any time.

const SESSION_KEY = "mentation.sessions.v1";
const APP_DATA_PREFIXES = ["mentation.", "haven.", "haven_"];
const MAX_SESSIONS = 500;
const ONBOARDING_KEY = "haven_onboarded";
const WELCOME_KEY = "haven_welcome_seen";
const LEGACY_A11Y_KEY = "haven_a11y";
const A11Y_KEY = "haven.a11y.v2";
const DISLIKES_KEY = "haven.dislikes";
const THOUGHT_RECORD_KEY = "mentation.thought-or-fact.records.v1";
const LOCAL_DATA_EVENT = "mentation:local-data-changed";
const KNOWN_APP_KEYS = [
  SESSION_KEY,
  ONBOARDING_KEY,
  WELCOME_KEY,
  LEGACY_A11Y_KEY,
  A11Y_KEY,
  DISLIKES_KEY,
  THOUGHT_RECORD_KEY,
];
const FLAGSHIP_KEYS = [
  "mentation.flagship.preferences.v1",
  "mentation.flagship.active.v1",
  "mentation.flagship.handoffs.v1",
  "mentation.tomorrowParking.pending",
  "mentation.nightChannel.feedback.v1",
];

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

function emitLocalDataChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOCAL_DATA_EVENT));
}

function emitSessionsChanged(count) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mentation:sessions-changed", { detail: { count } }));
}

function emitDataRefresh(count = readSessions().length) {
  emitSessionsChanged(count);
  emitLocalDataChanged();
}

function readSessions() {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  const next = sessions.slice(0, MAX_SESSIONS);
  storage()?.setItem(SESSION_KEY, JSON.stringify(next));
  emitSessionsChanged(next.length);
  emitLocalDataChanged();
}

function sortSessions(sessions, sort = "-created_date") {
  const descending = String(sort).startsWith("-");
  const field = String(sort).replace(/^-/, "") || "created_date";
  return [...sessions].sort((a, b) => {
    const left = field.includes("date") ? new Date(a?.[field] || 0).getTime() : a?.[field];
    const right = field.includes("date") ? new Date(b?.[field] || 0).getTime() : b?.[field];
    if (left === right) return 0;
    const result = left > right ? 1 : -1;
    return descending ? -result : result;
  });
}

function listOwnedLocalStorageKeys(local = storage()) {
  if (!local) return [];
  const enumerated = typeof local.length === "number" && typeof local.key === "function"
    ? Array.from({ length: local.length }, (_, index) => local.key(index))
    : Object.keys(local);
  const known = [...KNOWN_APP_KEYS, ...FLAGSHIP_KEYS].filter((key) => local.getItem?.(key) != null);
  return Array.from(new Set([...enumerated, ...known]))
    .filter((key) => key && APP_DATA_PREFIXES.some((prefix) => key.startsWith(prefix)));
}

function readStoredJSON(key, fallback) {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const LOCAL_DATA_GROUPS = [
  {
    id: "sessions",
    label: "Session history",
    description: "Completed resets, timing, intensity check-ins, and outcome ratings.",
    unit: "session",
    keys: (local) => (local?.getItem(SESSION_KEY) ? [SESSION_KEY] : []),
    count: () => readSessions().length,
  },
  {
    id: "onboarding",
    label: "Onboarding progress",
    description: "Whether you started or completed the welcome flow on this device.",
    unit: "setting",
    keys: (local) => [ONBOARDING_KEY, WELCOME_KEY].filter((key) => local?.getItem(key) != null),
  },
  {
    id: "accessibility",
    label: "Accessibility & sound preferences",
    description: "Motion, contrast, caption, layout, and ambient sound defaults.",
    unit: "preference",
    keys: (local) => [LEGACY_A11Y_KEY, A11Y_KEY].filter((key) => local?.getItem(key) != null),
  },
  {
    id: "adaptive",
    label: "Recommendation memory",
    description: "Local dislikes used to avoid suggesting practices that were not helping.",
    unit: "memory",
    keys: (local) => (local?.getItem(DISLIKES_KEY) ? [DISLIKES_KEY] : []),
  },
  {
    id: "thoughtRecords",
    label: "Thought records",
    description: "Saved Thought or Fact entries kept only on this device.",
    unit: "record",
    keys: (local) => (local?.getItem(THOUGHT_RECORD_KEY) ? [THOUGHT_RECORD_KEY] : []),
  },
  {
    id: "flagship",
    label: "Intervention memory",
    description: "Saved return points, handoffs, and in-progress intervention preferences.",
    unit: "memory",
    keys: (local) => FLAGSHIP_KEYS.filter((key) => local?.getItem(key) != null),
  },
];

export const sessionStore = Object.freeze({
  async list(sort = "-created_date", limit = 100) {
    return sortSessions(readSessions(), sort).slice(0, Math.max(0, Number(limit) || 0));
  },

  async create(payload) {
    const now = new Date().toISOString();
    const record = {
      ...payload,
      id: payload?.id || globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`,
      created_date: payload?.created_date || now,
      updated_date: now,
      storage_scope: "device",
    };
    writeSessions([record, ...readSessions().filter((item) => item.id !== record.id)]);
    return record;
  },

  async deleteMany() {
    writeSessions([]);
    return { deleted: true };
  },
});

export async function deleteAllLocalAppData() {
  const local = storage();
  if (!local) return;
  await sessionStore.deleteMany();
  const keys = listOwnedLocalStorageKeys(local);
  for (const key of keys) {
    if (APP_DATA_PREFIXES.some((prefix) => key.startsWith(prefix))) local.removeItem(key);
  }
  deleteFlagshipMemory("all");
  resetOnboarding();
  emitDataRefresh(0);
}

export function getLocalDataInventory() {
  const local = storage();
  const sessions = readSessions();
  return LOCAL_DATA_GROUPS.map((group) => {
    const keys = group.keys(local);
    const count = group.id === "sessions"
      ? sessions.length
      : typeof group.count === "function"
        ? group.count(local)
        : keys.length;
    return {
      id: group.id,
      label: group.label,
      description: group.description,
      count,
      unit: group.unit,
      keys,
    };
  });
}

export async function deleteLocalDataGroup(groupId) {
  const local = storage();
  const group = LOCAL_DATA_GROUPS.find((entry) => entry.id === groupId);
  if (!local || !group) return { deleted: false, count: 0 };
  if (group.id === "sessions") {
    const count = readSessions().length;
    writeSessions([]);
    return { deleted: true, count };
  }
  let count = 0;
  if (group.id === "flagship") {
    count = deleteFlagshipMemory("all");
  } else if (group.id === "onboarding") {
    const keys = group.keys(local);
    resetOnboarding();
    count = keys.length;
  } else {
    const keys = group.keys(local);
    keys.forEach((key) => local.removeItem(key));
    count = keys.length;
  }
  emitDataRefresh();
  return { deleted: true, count };
}

export function exportLocalAppData() {
  const local = storage();
  return {
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    sessions: readSessions(),
    onboarding: {
      hasCompletedOnboarding: local?.getItem(ONBOARDING_KEY) === "1",
      hasSeenWelcome: local?.getItem(WELCOME_KEY) === "1",
    },
    accessibility: readStoredJSON(A11Y_KEY, readStoredJSON(LEGACY_A11Y_KEY, null)),
    recommendationMemory: readStoredJSON(DISLIKES_KEY, null),
    thoughtRecords: readStoredJSON(THOUGHT_RECORD_KEY, []),
    interventionMemory: {
      preferences: readStoredJSON(FLAGSHIP_KEYS[0], null),
      active: readStoredJSON(FLAGSHIP_KEYS[1], null),
      handoffs: readStoredJSON(FLAGSHIP_KEYS[2], null),
      tomorrowParking: readStoredJSON(FLAGSHIP_KEYS[3], null),
      nightChannelFeedback: readStoredJSON(FLAGSHIP_KEYS[4], null),
    },
  };
}

export function downloadLocalAppData(filenamePrefix = "mentation-export") {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof Blob === "undefined") return false;
  const payload = exportLocalAppData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const body = document.body;
  try {
    link.href = url;
    link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    if (body) body.appendChild(link);
    link.click();
    return true;
  } finally {
    if (body) link.remove();
    URL.revokeObjectURL(url);
  }
}

export const LOCAL_DATA_CHANGED_EVENT = LOCAL_DATA_EVENT;
