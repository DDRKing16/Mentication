// Backup and restore: everything Mentication keeps on the phone, saved as one
// file the person keeps wherever they like (iCloud Drive, Files, AirDrop).
// Nothing is sent anywhere by the app; the phone's own share sheet does it.
//
// Two things are deliberately left out: the Plus status (that always comes
// from Apple, so a file can't unlock it) and reminder settings (reminders are
// scheduled on the phone itself, so they're set again after a restore).

const PREFIXES = ["mentation.", "mentication.", "mentication_", "haven.", "haven_", "dear2100", "goodmap-", "gm_"];
const EXCLUDED = new Set(["mentication.plus.v1", "mentation.reminders.v1"]);
const SESSION_KEY = "mentation.sessions.v1";
const FORMAT = "mentication-backup";

const includeKey = (key) => !EXCLUDED.has(key) && PREFIXES.some((prefix) => key.startsWith(prefix));

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
  if (backup?.format !== FORMAT || typeof backup.data !== "object" || backup.data === null) {
    throw new Error("That file isn't a Mentication backup.");
  }
  if (backup.version > 1) throw new Error("That backup is from a newer version of Mentication. Update the app, then try again.");
  return backup;
}

function mergeSessions(current, incoming) {
  const parse = (raw) => { try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  const byId = new Map();
  for (const session of [...parse(incoming), ...parse(current)]) {
    if (session?.id && !byId.has(session.id)) byId.set(session.id, session);
  }
  return JSON.stringify([...byId.values()].sort((a, b) => Date.parse(b.created_date || 0) - Date.parse(a.created_date || 0)).slice(0, 500));
}

/**
 * Put a backup's data back. Practice history is merged (nothing already on
 * this phone is lost); everything else takes the backup's version.
 */
export function restoreBackup(backup, storage = globalThis.localStorage) {
  let restored = 0;
  for (const [key, value] of Object.entries(backup.data)) {
    if (!includeKey(key) || typeof value !== "string") continue;
    storage.setItem(key, key === SESSION_KEY ? mergeSessions(storage.getItem(key), value) : value);
    restored += 1;
  }
  return restored;
}

/**
 * Hand the backup to the phone's share sheet ("Save to Files" puts it in
 * iCloud Drive). Falls back to a normal download where sharing files isn't
 * available. Returns "shared", "downloaded" or "cancelled".
 */
export async function saveBackup() {
  const backup = createBackup();
  const name = backupFileName();
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
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}
