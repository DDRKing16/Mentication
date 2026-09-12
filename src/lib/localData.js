// Device-local persistence for Mentication.
//
// V1 deliberately has no remote account or application backend. Session data
// stays in this app's local storage and can be erased in-app at any time.

const SESSION_KEY = "mentation.sessions.v1";
const APP_DATA_PREFIXES = ["mentation.", "haven.", "haven_"];
const MAX_SESSIONS = 500;

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mentation:sessions-changed", { detail: { count: next.length } }));
  }
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

function listOwnedLocalStorage() {
  const local = storage();
  if (!local) return {};
  const keys = Array.from({ length: local.length }, (_, index) => local.key(index))
    .filter((key) => key && APP_DATA_PREFIXES.some((prefix) => key.startsWith(prefix)))
    .sort();
  return Object.fromEntries(keys.map((key) => [key, local.getItem(key)]));
}

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

export function deleteAllLocalAppData() {
  const local = storage();
  if (!local) return;
  const keys = Array.from({ length: local.length }, (_, index) => local.key(index)).filter(Boolean);
  for (const key of keys) {
    if (APP_DATA_PREFIXES.some((prefix) => key.startsWith(prefix))) local.removeItem(key);
  }
  window.dispatchEvent(new CustomEvent("mentation:sessions-changed", { detail: { count: 0 } }));
}

export function exportLocalAppData() {
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    sessions: readSessions(),
    localStorage: listOwnedLocalStorage(),
  };
}
