import {readRecordList,writeVerified,removeVerified} from './verifiedStorage';
// Backup and restore: everything Mentication keeps on the phone, saved as one
// file the person keeps wherever they like (iCloud Drive, Files, AirDrop).
// Nothing is sent anywhere by the app; the phone's own share sheet does it.
//
// Device-specific state is deliberately left out: the Plus status (that always comes
// from Apple, so a file can't unlock it) and reminder settings (reminders are
// scheduled on the phone itself, so they're set again after a restore).
// Web check-in ownership is also excluded in BOTH directions: its bearer token
// must remain on the originating device so another backup cannot take it over.

const PREFIXES = ["mentation.", "mentication.", "mentication_", "haven.", "haven_", "dear2100", "goodmap-", "gm_"];
export const RESTORE_COPIES_KEY = "mentation.restore-copies.v1";
const EXCLUDED = new Set([RESTORE_COPIES_KEY,"mentication.plus.v1", "mentation.reminders.v1", "mentation.reminders.uncertain.v1", "mentation.web-checkins.v1"]);
const SESSION_KEY = "mentation.sessions.v1";
const FORMAT = "mentication-backup";

const includeKey = (key) => !EXCLUDED.has(key) && (key === "daybook" || PREFIXES.some((prefix) => key.startsWith(prefix)));

function allKeys(storage) {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
}

/** Build the backup object from local storage. */
export function createBackup(storage = globalThis.localStorage, now = new Date()) {
  const data = {};
  for (const key of allKeys(storage)) {
    if (includeKey(key)) data[key] = storage.getItem(key);
  }
  return { format: FORMAT, version: 1, createdAt: now.toISOString(), data };
}

export function backupFileName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `Mentication backup ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** How many practices a backup holds, for a friendly summary. */
export function backupSessionCount(backup) {
  try {
    const sessions = JSON.parse(backup?.data?.[SESSION_KEY] || "[]");
    return Array.isArray(sessions) ? sessions.length : 0;
  } catch {
    return 0;
  }
}

/** Read and check a backup file's text. Throws a plain-English error if it isn't one. */
export function parseBackup(text) {
  let backup;
  try { backup = JSON.parse(text); } catch { throw new Error("That file isn't a Mentication backup."); }
  if (backup?.format !== FORMAT || typeof backup.data !== "object" || backup.data === null || Array.isArray(backup.data)) {
    throw new Error("That file isn't a Mentication backup.");
  }
  if (backup.version > 1) throw new Error("That backup is from a newer version of Mentication. Update the app, then try again.");
  if(backup.version !== 1 || Object.values(backup.data).some(value=>typeof value!=="string")) throw new Error("That file is not a readable version 1 Mentication backup.");
  return backup;
}

// Stable field ordering avoids inventing a conflict from JSON property order.
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);

function sessionMap(raw) {
  let records;
  try { records = readRecordList({getItem: () => raw}, SESSION_KEY); }
  catch { throw new Error('Practice history could not be read. Nothing has been replaced.'); }
  const result = new Map();
  for (const record of records) {
    if (result.has(record.id) && canonical(result.get(record.id)) !== canonical(record)) {
      throw new Error('Practice history contains different records with the same ID. Nothing has been replaced. Keep both files and resolve that history before restoring.');
    }
    result.set(record.id, record);
  }
  return result;
}

function prepare(backup, storage, policy) {
  if (!['keep-current', 'use-backup'].includes(policy)) throw new Error('Choose how to handle conflicting data before restoring.');
  const checked = parseBackup(JSON.stringify(backup));
  const entries = Object.entries(checked.data).filter(([key]) => includeKey(key));
  const summary = {sessionCount: 0, addedSessions: 0, sessionConflicts: 0, dataConflicts: 0, addedDataGroups: 0};
  const changes = [];
  const snapshot = {incoming: canonical(Object.fromEntries(entries)), values: []};
  for (const [key, incoming] of entries) {
    const previous = storage.getItem(key);
    snapshot.values.push([key, previous]);
    let value = incoming, replaces = false;
    if (key === SESSION_KEY) {
      const current = sessionMap(previous), source = sessionMap(incoming);
      summary.sessionCount = source.size;
      for (const [id, record] of source) {
        if (!current.has(id)) summary.addedSessions += 1;
        else if (canonical(current.get(id)) !== canonical(record)) summary.sessionConflicts += 1;
      }
      const merged = new Map(current);
      for (const [id, record] of source) if (!merged.has(id) || policy === 'use-backup') merged.set(id, record);
      replaces = policy === 'use-backup' && summary.sessionConflicts > 0;
      // No-op retries must not rewrite or reorder existing history.
      if (!summary.addedSessions && !replaces && previous !== null) value = previous;
      else value = JSON.stringify([...merged.values()].sort((a, b) => (Date.parse(b.created_date) || 0) - (Date.parse(a.created_date) || 0)));
    } else if (previous === null) summary.addedDataGroups += 1;
    else if (previous !== incoming) {
      summary.dataConflicts += 1;
      replaces = policy === 'use-backup';
      if (!replaces) value = previous;
    }
    if (previous !== value) changes.push({key, previous, value, replaces});
  }
  return {...summary, snapshot, changes};
}

/** Review counts and exact relevant device values without changing storage. */
export function previewBackup(backup, storage = globalThis.localStorage) {
  const {changes: _changes, ...preview} = prepare(backup, storage, 'keep-current');
  return preview;
}

/** Chronological, separately exportable recovery files; not an automatic Undo. */
export function readRestoreCopies(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(RESTORE_COPIES_KEY);
    if (raw === null) return [];
    const archive = JSON.parse(raw);
    if (archive?.version !== 1 || !Array.isArray(archive.copies)) throw new Error();
    return archive.copies.map(copy => {
      const checked = parseBackup(JSON.stringify(copy));
      if (Object.keys(checked.data).some(key => !includeKey(key))) throw new Error();
      return checked;
    });
  } catch { throw new Error('Before-restore copies could not be read. Nothing has been replaced.'); }
}

/** Permanently remove only the explicitly reviewed recovery copy. */
export function removeRestoreCopy(index, expectedCopy, storage = globalThis.localStorage) {
  let previous;
  try { previous = storage.getItem(RESTORE_COPIES_KEY); }
  catch { throw new Error('Before-restore copies could not be read. Nothing has been removed.'); }
  const copies = readRestoreCopies(storage);
  if (!Number.isInteger(index) || index < 0 || !copies[index] || canonical(copies[index]) !== canonical(expectedCopy)
      || storage.getItem(RESTORE_COPIES_KEY) !== previous) {
    const error = new Error('Before-restore copies changed. Reload the list before removing a copy.');
    error.code = 'RESTORE_COPY_CHANGED';
    throw error;
  }
  const remaining = copies.filter((_copy, position) => position !== index);
  const value = remaining.length ? JSON.stringify({version: 1, copies: remaining}) : null;
  try {
    if (value === null) removeVerified(storage, RESTORE_COPIES_KEY);
    else writeVerified(storage, RESTORE_COPIES_KEY, value);
  } catch {
    try {
      const current = storage.getItem(RESTORE_COPIES_KEY);
      if (current !== previous) {
        if (current !== value) throw new Error('Concurrent archive edit');
        writeVerified(storage, RESTORE_COPIES_KEY, previous);
      }
    } catch { throw uncertainError('Copy removal could not be confirmed or rolled back. Reload the copies list before trying again.', 'RESTORE_COPY_UNCERTAIN'); }
    throw new Error('The copy could not be removed. Existing copies have been kept. Try again.');
  }
  return remaining.length;
}

function uncertainError(message, code = 'RESTORE_UNCERTAIN') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function reviewChanged() {
  const error = new Error('Data on this device changed after the review. Review the backup again before restoring.');
  error.code = 'RESTORE_REVIEW_CHANGED';
  return error;
}

function preserveBeforeRestore(changes, storage) {
  const data = Object.fromEntries(changes.filter(change => change.replaces && change.previous !== null).map(change => [change.key, change.previous]));
  let previous;
  try { previous = storage.getItem(RESTORE_COPIES_KEY); }
  catch { throw new Error('Before-restore copies could not be read. Nothing has been replaced.'); }
  const copies = readRestoreCopies(storage);
  const existing = copies.some(copy => canonical(copy.data) === canonical(data));
  if (storage.getItem(RESTORE_COPIES_KEY) !== previous) throw reviewChanged();
  if (existing) return;
  const copy = {format: FORMAT, version: 1, createdAt: new Date().toISOString(), data};
  // Never evict an earlier copy to make room. Full storage blocks replacement.
  const value = JSON.stringify({version: 1, copies: [...copies, copy]});
  if (storage.getItem(RESTORE_COPIES_KEY) !== previous) throw reviewChanged();
  try { writeVerified(storage, RESTORE_COPIES_KEY, value); }
  catch {
    try {
      const current = storage.getItem(RESTORE_COPIES_KEY);
      if (current !== previous) {
        if (current !== value) throw new Error('The recovery archive changed concurrently.');
        if (previous === null) removeVerified(storage, RESTORE_COPIES_KEY);
        else writeVerified(storage, RESTORE_COPIES_KEY, previous);
      }
    } catch { throw uncertainError('The before-restore copy could not be confirmed or rolled back. No practice, note or plan was restored. Keep your backup and try again when device storage is available.'); }
    throw new Error('A before-restore copy could not be saved. No practice, note or plan was restored. Free device space or try again.');
  }
}

/**
 * Safe default: keep device versions of conflicts and add missing records/keys.
 * Explicit replacement first preserves affected old values in a recovery file.
 * Returns the number of changed storage groups, not a claim of file export.
 */
export function restoreBackup(backup, storage = globalThis.localStorage, {policy = 'keep-current', preview} = {}) {
  const prepared = prepare(backup, storage, policy);
  if (preview && canonical(preview.snapshot) !== canonical(prepared.snapshot)) throw reviewChanged();
  const {changes} = prepared;
  if (changes.some(change => change.replaces)) preserveBeforeRestore(changes, storage);
  const attempted = [];
  try {
    for (const change of changes) {
      // localStorage is not transactional across tabs. Refuse an observed newer
      // value, and never roll back over a different concurrent edit.
      if (storage.getItem(change.key) !== change.previous) throw reviewChanged();
      attempted.push(change);
      writeVerified(storage, change.key, change.value);
    }
  } catch (error) {
    let recovered = true;
    for (const change of attempted.reverse()) {
      try {
        const current = storage.getItem(change.key);
        if (current === change.previous) continue;
        if (current !== change.value) { recovered = false; continue; }
        if (change.previous === null) removeVerified(storage, change.key);
        else writeVerified(storage, change.key, change.previous);
      } catch { recovered = false; }
    }
    if (error.code === 'RESTORE_REVIEW_CHANGED' && recovered) throw error;
    if (recovered) throw new Error('Restore could not be saved. Your previous data has been kept. Try again.');
    throw uncertainError('Restore did not finish. Not every change could be confirmed or rolled back. Keep your backup and any before-restore copies. Reload and review before trying again.');
  }
  return changes.length;
}

/**
 * Hand the backup to the phone's share sheet ("Save to Files" puts it in
 * iCloud Drive). Falls back to a normal download where sharing files isn't
 * available. Returns "shared", "downloaded" or "cancelled". These report the
 * handoff only: the app cannot verify that another app or browser kept the file.
 */
export async function saveBackup(backup = createBackup(), name = backupFileName()) {
  const checked = parseBackup(JSON.stringify(backup));
  // Even an explicitly supplied legacy file cannot export device ownership.
  backup = {...checked, data: Object.fromEntries(Object.entries(checked.data).filter(([key]) => includeKey(key)))};
  const text = JSON.stringify(backup, null, 2);
  const file = typeof File === "function" ? new File([text], name, { type: "application/json" }) : null;
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Mentication backup" });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  return "downloaded";
}
