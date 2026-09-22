// Tomorrow Parking Lot — device-local storage adapter.
//
// Honest boundaries:
// - This is browser localStorage. It is not encryption, authentication, backup
//   or verified production security.
// - Nothing here infers category, urgency, mood, diagnosis or sleep result.
// - Record text is never written to logs, analytics, URLs or any remote service.
// - Every write is read back and verified before success is reported. A silent
//   catch is not a saved note.

export const SCHEMA_VERSION = 1;
export const RECORDS_KEY = "mentication.tomorrowParking.records.v1";
export const DRAFT_KEY = "mentication.tomorrowParking.draft.v1";
export const CONSENT_KEY = "mentication.tomorrowParking.consents.v1";
export const NEXT_STEP_HANDOFF_KEY = "mentication.tomorrowParking.nextStepHandoff.v1";
// Written by the previous generic flagship implementation. Migrated on request only.
export const LEGACY_PENDING_KEY = "mentation.tomorrowParking.pending";

export const RETENTION_DAYS = 30;
export const DRAFT_TTL_HOURS = 24;
export const SAVE_PURPOSE = "user_parked_note";
export const SAVE_PURPOSE_VERSION = "2026-09-13";

/** @typedef {"remember" | "deal-with" | "can-wait"} OrganisedGroup */
/** @typedef {{ id: string, text: string, group: OrganisedGroup, done: boolean }} OrganisedItem */
/**
 * @typedef {object} ParkedNote
 * @property {string} id
 * @property {number} schemaVersion
 * @property {string} text Exactly the text the user wrote. Never rewritten or split by the app.
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} expiresAt
 * @property {string} savePurpose
 * @property {string} savePurposeVersion
 * @property {{ confirmedAt: string, items: OrganisedItem[] }=} organisation Present only after explicit daytime confirmation.
 */
/** @typedef {{ nightChannelHandoff: boolean, soundAndHaptics: boolean }} Consents */

export const DEFAULT_CONSENTS = Object.freeze({ nightChannelHandoff: false, soundAndHaptics: false });

export class StorageUnavailableError extends Error {
  constructor(message = "Local storage is not available in this session.") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export class SaveVerificationError extends Error {
  constructor(message = "The note could not be verified after writing.") {
    super(message);
    this.name = "SaveVerificationError";
  }
}

function probe(storage) {
  const key = "__tpl_probe__";
  storage.setItem(key, "1");
  storage.removeItem(key);
  return storage;
}

function store() {
  if (typeof window === "undefined") throw new StorageUnavailableError();
  try {
    return probe(window.localStorage);
  } catch {
    throw new StorageUnavailableError();
  }
}

function sessionStore() {
  if (typeof window === "undefined") return null;
  try {
    return probe(window.sessionStorage);
  } catch {
    return null;
  }
}

export function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addDays(iso, days) {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

const isIso = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

const GROUPS = new Set(["remember", "deal-with", "can-wait"]);

/** Validate without ever logging record contents. @returns {ParkedNote | null} */
function validate(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  if (typeof raw.text !== "string" || raw.text.trim().length === 0) return null;
  if (!isIso(raw.createdAt) || !isIso(raw.updatedAt) || !isIso(raw.expiresAt)) return null;

  let organisation;
  const o = raw.organisation;
  if (o && typeof o === "object" && isIso(o.confirmedAt) && Array.isArray(o.items)) {
    const items = [];
    for (const it of o.items) {
      if (!it || typeof it !== "object" || typeof it.id !== "string" || typeof it.text !== "string") continue;
      items.push({ id: it.id, text: it.text, group: GROUPS.has(it.group) ? it.group : "can-wait", done: it.done === true });
    }
    organisation = { confirmedAt: o.confirmedAt, items };
  }

  return {
    id: raw.id,
    schemaVersion: typeof raw.schemaVersion === "number" ? raw.schemaVersion : SCHEMA_VERSION,
    text: raw.text,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    expiresAt: raw.expiresAt,
    savePurpose: SAVE_PURPOSE,
    savePurposeVersion: typeof raw.savePurposeVersion === "string" ? raw.savePurposeVersion : SAVE_PURPOSE_VERSION,
    ...(organisation ? { organisation } : {}),
  };
}

function readAllRaw() {
  const rawText = store().getItem(RECORDS_KEY);
  if (!rawText) return [];
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Malformed container: never delete the user's data automatically.
    return [];
  }
  const list = parsed && typeof parsed === "object" ? parsed.records : null;
  if (!Array.isArray(list)) return [];
  return list.map(validate).filter(Boolean);
}

function writeAll(records) {
  store().setItem(RECORDS_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, records }));
}

/** Expiry is applied before rendering, on every load. Newest first. */
export function loadRecords(now = new Date()) {
  const all = readAllRaw();
  const live = all.filter((r) => Date.parse(r.expiresAt) > now.getTime());
  if (live.length !== all.length) writeAll(live);
  return live.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Read without throwing; the caller decides how to present unavailable storage. */
export function tryLoadRecords(now = new Date()) {
  try {
    return { ok: true, records: loadRecords(now) };
  } catch (error) {
    return { ok: false, records: [], unavailable: error instanceof StorageUnavailableError };
  }
}

export function hasParkedNotes(now = new Date()) {
  return tryLoadRecords(now).records.length > 0;
}

export function getRecord(id, now = new Date()) {
  return loadRecords(now).find((r) => r.id === id) ?? null;
}

const trimEnd = (text) => text.replace(/\s+$/g, "");

/**
 * Deliberate save. Writes, reads back and verifies before reporting success.
 * Record identity is preserved across retries, so a retry never duplicates.
 * @returns {ParkedNote}
 */
export function parkNote({ id, text }, now = new Date()) {
  const clean = trimEnd(text);
  if (clean.trim().length === 0) throw new Error("Nothing to park yet.");

  const records = loadRecords(now);
  const existing = id ? records.find((r) => r.id === id) : undefined;
  const nowIso = now.toISOString();

  const record = existing
    ? { ...existing, text: clean, updatedAt: nowIso, expiresAt: addDays(nowIso, RETENTION_DAYS) }
    : {
      id: id ?? newId(),
      schemaVersion: SCHEMA_VERSION,
      text: clean,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: addDays(nowIso, RETENTION_DAYS),
      savePurpose: SAVE_PURPOSE,
      savePurposeVersion: SAVE_PURPOSE_VERSION,
    };

  writeAll(existing ? records.map((r) => (r.id === record.id ? record : r)) : [record, ...records]);

  const confirmed = readAllRaw().find((r) => r.id === record.id);
  if (!confirmed || confirmed.text !== record.text) throw new SaveVerificationError();
  return confirmed;
}

/** Explicit daytime edit. Restarts retention; merely reading does not. */
export function updateNoteText(id, text, now = new Date()) {
  const clean = trimEnd(text);
  if (clean.trim().length === 0) throw new Error("A note cannot be empty.");
  const records = loadRecords(now);
  const existing = records.find((r) => r.id === id);
  if (!existing) throw new Error("That note is no longer stored.");
  const nowIso = now.toISOString();
  const updated = { ...existing, text: clean, updatedAt: nowIso, expiresAt: addDays(nowIso, RETENTION_DAYS) };
  writeAll(records.map((r) => (r.id === id ? updated : r)));
  const confirmed = readAllRaw().find((r) => r.id === id);
  if (!confirmed || confirmed.text !== clean) throw new SaveVerificationError();
  return confirmed;
}

/** User-confirmed organisation only. The original note text is retained untouched. */
export function setOrganisation(id, items, now = new Date()) {
  const records = loadRecords(now);
  const existing = records.find((r) => r.id === id);
  if (!existing) throw new Error("That note is no longer stored.");
  const updated = { ...existing, organisation: { confirmedAt: now.toISOString(), items } };
  writeAll(records.map((r) => (r.id === id ? updated : r)));
  const confirmed = readAllRaw().find((r) => r.id === id);
  if (!confirmed?.organisation) throw new SaveVerificationError();
  return confirmed;
}

export function deleteRecord(id, now = new Date()) {
  writeAll(loadRecords(now).filter((r) => r.id !== id));
  if (readAllRaw().some((r) => r.id === id)) throw new SaveVerificationError("Deletion failed.");
}

/** Removes only this intervention's data. Unrelated app data is untouched. */
export function deleteAllRecords() {
  const s = store();
  [RECORDS_KEY, LEGACY_PENDING_KEY, CONSENT_KEY].forEach((key) => s.removeItem(key));
  sessionStore()?.removeItem(DRAFT_KEY);
  sessionStore()?.removeItem(NEXT_STEP_HANDOFF_KEY);
  if (s.getItem(RECORDS_KEY)) throw new SaveVerificationError("Deletion failed.");
}

/* ---------------------------------- draft --------------------------------- */

/** Drafts live in sessionStorage for this session only. Never claimed as saved. */
export function readDraft(now = new Date()) {
  const s = sessionStore();
  if (!s) return null;
  const raw = s.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.text !== "string" || !isIso(parsed.updatedAt)) return null;
    if ((now.getTime() - Date.parse(parsed.updatedAt)) / 3_600_000 > DRAFT_TTL_HOURS) {
      s.removeItem(DRAFT_KEY);
      return null;
    }
    return { text: parsed.text, updatedAt: parsed.updatedAt, ...(typeof parsed.recordId === "string" ? { recordId: parsed.recordId } : {}) };
  } catch {
    return null;
  }
}

export function writeDraft(text, recordId, now = new Date()) {
  const s = sessionStore();
  if (!s) return;
  if (text.trim().length === 0) {
    s.removeItem(DRAFT_KEY);
    return;
  }
  try {
    s.setItem(DRAFT_KEY, JSON.stringify({ text, updatedAt: now.toISOString(), ...(recordId ? { recordId } : {}) }));
  } catch {
    /* best-effort */
  }
}

export function clearDraft() {
  sessionStore()?.removeItem(DRAFT_KEY);
}

/* -------------------------------- consents -------------------------------- */

export function readConsents() {
  try {
    const raw = store().getItem(CONSENT_KEY);
    if (!raw) return { ...DEFAULT_CONSENTS };
    const parsed = JSON.parse(raw);
    return { nightChannelHandoff: parsed.nightChannelHandoff === true, soundAndHaptics: parsed.soundAndHaptics === true };
  } catch {
    return { ...DEFAULT_CONSENTS };
  }
}

export function writeConsents(next) {
  try {
    store().setItem(CONSENT_KEY, JSON.stringify(next));
  } catch {
    /* Consent storage failure must not block capture, save or review. */
  }
}

/* ------------------------- Next Easiest Step handoff ---------------------- */

/**
 * The daytime review may pass one user-chosen excerpt to Next Easiest Step.
 * It travels through sessionStorage and is consumed exactly once. The source
 * note is never modified or deleted by a handoff.
 */
export function stageNextStepHandoff(excerpt) {
  const s = sessionStore();
  if (!s) return false;
  try {
    if (excerpt && excerpt.trim()) s.setItem(NEXT_STEP_HANDOFF_KEY, JSON.stringify({ excerpt: excerpt.trim(), at: new Date().toISOString() }));
    else s.removeItem(NEXT_STEP_HANDOFF_KEY);
    return true;
  } catch {
    return false;
  }
}

export function consumeNextStepHandoff() {
  const s = sessionStore();
  if (!s) return null;
  try {
    const raw = s.getItem(NEXT_STEP_HANDOFF_KEY);
    s.removeItem(NEXT_STEP_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed.excerpt === "string" && parsed.excerpt.trim() ? parsed.excerpt : null;
  } catch {
    return null;
  }
}

/* ------------------------------ legacy import ----------------------------- */

export function readLegacyPending() {
  try {
    const raw = store().getItem(LEGACY_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.item !== "string" || parsed.item.trim().length === 0) return null;
    return { item: parsed.item, createdAt: isIso(parsed.createdAt) ? parsed.createdAt : new Date().toISOString() };
  } catch {
    return null;
  }
}

/**
 * Migrates one known-valid legacy value. The legacy key is removed only once
 * the new record is written and verified; a failed migration leaves it alone.
 */
export function migrateLegacyPending(now = new Date()) {
  const legacy = readLegacyPending();
  if (!legacy) return null;
  const record = parkNote({ text: legacy.item }, now);
  try {
    store().removeItem(LEGACY_PENDING_KEY);
  } catch {
    /* Keep the legacy value if it cannot be removed. */
  }
  return record;
}
