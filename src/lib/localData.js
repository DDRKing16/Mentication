import {readRecordList,writeVerified,removeVerified} from './verifiedStorage';
import { resetOnboardingSession } from './onboarding';
// @ts-check
// Device-local persistence for Mentication.
//
// V1 deliberately has no remote account or application backend. Session data
// stays in this app's local storage and can be erased in-app at any time.
import { loadTara } from "./taraTacticianStorage";
import { notifyAccessibilityPreferencesChanged } from "./accessibilityEvents";

const SESSION_KEY = "mentation.sessions.v1";
const APP_DATA_PREFIXES = ["mentation.", "haven.", "haven_", "goodmap-", "gm_narr", "mentication.foundations.", "mentication.tomorrowParking.", "dear2100"];
const MAX_SESSIONS = 500;

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

function readSessions() {
  return readRecordList(storage(),SESSION_KEY);
}

function writeSessions(sessions) {
  const next = sessions.slice(0, MAX_SESSIONS);
  writeVerified(storage(),SESSION_KEY,JSON.stringify(next));
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
  if (!local) throw new Error("Device storage is unavailable.");
  const keys = Array.from({ length: local.length }, (_, index) => local.key(index)).filter(Boolean);
  for (const key of keys) {
    if (key === "mentication_nes_v2_app_state" || key === "daybook" || APP_DATA_PREFIXES.some((prefix) => key.startsWith(prefix))) removeVerified(local,key);
  }
  const temporary=window.sessionStorage;
  if(temporary) {
    const draftKeys=Array.from({length:temporary.length},(_,index)=>temporary.key(index)).filter(Boolean);
    for(const key of draftKeys) if(key === "mentication_nes_v2_app_state" || APP_DATA_PREFIXES.some(prefix=>key.startsWith(prefix))) removeVerified(temporary,key);
  }
  resetOnboardingSession();
  window.dispatchEvent(new CustomEvent("mentation:sessions-changed", { detail: { count: 0 } }));
  window.dispatchEvent(new CustomEvent('mentation:takeaways-changed'));
  notifyAccessibilityPreferencesChanged();
}

export function exportLocalAppData() {
  const local = storage();
  const foundations = {};
  if (local) {
    for (let index = 0; index < local.length; index += 1) {
      const key = local.key(index);
      if (key?.startsWith("mentication.foundations.")) foundations[key] = local.getItem(key);
    }
  }
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sessions: readSessions(),
    takeaways: readTakeaways(),
    signalLock: JSON.parse(storage()?.getItem("mentation.signal-lock.grounding.v1") || "null"),
    foundations,
    tara: local ? loadTara(local) : { draft: null, recaps: [] },
    careCards: JSON.parse(storage()?.getItem("mentation.carePractices.saved.v1") || "{}"),
    tappingDraft: JSON.parse(storage()?.getItem("mentation.eftTapping.draft.v1") || "null"),
  };
}

// Explicitly saved personal notes are separate from session/effectiveness data.
// Candidate text can use confirmed choices. A rating/timer/completion event
// alone must never write a note; writing still requires the user's Save action.
const TAKEAWAY_KEY = 'mentation.takeaways.v1';
function readTakeaways() {
  const raw = storage()?.getItem(TAKEAWAY_KEY);
  if (!raw) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error('Saved notes could not be read.');
  if (records.some(record => !record || typeof record.id !== 'string' || typeof record.text !== 'string' || typeof record.interventionId !== 'string')) throw new Error('Saved notes could not be read.');
  return records;
}
function writeTakeaways(records) {
  const local = storage();
  if (!local) throw new Error('Device storage is unavailable.');
  writeVerified(local,TAKEAWAY_KEY,JSON.stringify(records));
  window.dispatchEvent?.(new CustomEvent('mentation:takeaways-changed'));
}
export const takeawayStore = Object.freeze({
  list: readTakeaways,
  save({ id, interventionId, text }) {
    const content = typeof text === 'string' ? text.trim() : '';
    if (!content || content.length > 1500 || typeof interventionId !== 'string' || !interventionId) throw new Error('Enter a note of up to 1500 characters.');
    const records = readTakeaways();
    const previous = records.find(item=>item.id===id);
    const record = { id: id || globalThis.crypto?.randomUUID?.() || `note-${Date.now()}`, interventionId, text: content, createdAt: previous?.createdAt || new Date().toISOString() };
    writeTakeaways([record, ...records.filter(item => item.id !== record.id)]);
    return record;
  },
  delete(id) { writeTakeaways(readTakeaways().filter(item => item.id !== id)); },
});
