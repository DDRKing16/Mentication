// Gentle daily reminders, scheduled on the device itself.
//
// Uses @capacitor/local-notifications: the phone schedules these locally, so
// nothing is sent to or from a server. One reminder per weekday, each with its
// own wording, so it never feels like the same nag every day.
import { Capacitor } from "@capacitor/core";
import { removeVerified, writeVerified } from "./verifiedStorage.js";

const PREFS_KEY = "mentation.reminders.v1";
// One id per weekday (Sunday = 1 … Saturday = 7), kept clear of other ids.
const idFor = (weekday) => 2100 + weekday;
const ALL_IDS = [1, 2, 3, 4, 5, 6, 7].map(idFor);

// Warm, low-pressure wording. Never guilt ("you missed…"), never streak threats.
const MESSAGES = {
  1: "A slow Sunday minute? Mentication is here if you want it.",
  2: "A fresh week. One small reset, whenever suits you.",
  3: "Checking in. How's today feeling?",
  4: "Midweek pause. A minute for yourself is enough.",
  5: "Take a breath with us, if you'd like one.",
  6: "End the week lighter. Your reset is waiting.",
  7: "Saturday. A calm minute, on your terms.",
};

export const DEFAULT_REMINDER = Object.freeze({ enabled: false, hour: 19, minute: 30 });

export function getReminderPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    if (!raw || typeof raw !== "object") return { ...DEFAULT_REMINDER };
    const hour = Number.isInteger(raw.hour) && raw.hour >= 0 && raw.hour <= 23 ? raw.hour : DEFAULT_REMINDER.hour;
    const minute = Number.isInteger(raw.minute) && raw.minute >= 0 && raw.minute <= 59 ? raw.minute : DEFAULT_REMINDER.minute;
    return { enabled: raw.enabled === true, hour, minute };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

function savePrefs(prefs) {
  try { writeVerified(localStorage, PREFS_KEY, JSON.stringify(prefs)); }
  catch { throw new Error("Reminder settings could not be saved on this device. Please try again."); }
}
function validateTime(hour, minute) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error("Choose a valid reminder time.");
  }
}
// Every caller shares the queue; a rejected operation must not poison retries.
let pending = Promise.resolve();
function serialize(operation) {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
}
export const remindersSupported = () => Capacitor.isNativePlatform();
async function plugin() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}
function notificationsFor({ hour, minute }) {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    id: idFor(weekday), title: "Mentication", body: MESSAGES[weekday],
    schedule: { on: { weekday, hour, minute }, repeats: true, allowWhileIdle: true },
  }));
}
let nativeScheduling = false;
async function applyQueue(api, prefs) {
  if (prefs.enabled) nativeScheduling = true;
  try {
    if (prefs.enabled) {
      // Matching IDs replace existing requests. Do not erase a working queue
      // before replacement: a failed schedule would otherwise leave a gap.
      await api.schedule({ notifications: notificationsFor(prefs) });
    } else {
      await api.cancel({ notifications: ALL_IDS.map((id) => ({ id })) });
    }
    // iOS resolves schedule before asynchronous native additions finish.
    // Read only, with nine 100 ms waits, never reschedule while polling.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { notifications } = await api.getPending();
      const ours = notifications.filter(({ id }) => ALL_IDS.includes(id));
      const matches = prefs.enabled
        ? ALL_IDS.every((id) => ours.some((item) => item.id === id &&
            item.schedule?.on?.weekday === id - 2100 &&
            item.schedule?.on?.hour === prefs.hour && item.schedule?.on?.minute === prefs.minute))
        : ours.length === 0;
      if (matches) return;
      if (attempt < 9) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("The phone did not confirm the reminder schedule.");
  } catch (cause) {
    // A rejection or expired polling budget cannot prove native additions
    // settled. They can overwrite even an apparently confirmed rollback.
    throw Object.assign(new Error("The phone did not confirm the reminder schedule.", { cause }), {
      unsettledSchedule: prefs.enabled,
    });
  } finally {
    if (prefs.enabled) nativeScheduling = false;
  }
}
export const REMINDER_UNCERTAIN_KEY = "mentation.reminders.uncertain.v1";
export const REMINDER_DELETION_PENDING_KEY = "mentation.reminders.delete-pending.v1";
export const REMINDER_DELETION_WARNING = "Daily reminder cleanup has not been confirmed. Pending notifications may still arrive. Turn off notifications for Mentication in your phone's Settings to prevent alerts.";
let deletionPending = false;
let deletionGeneration = 0;
let deletionCleanup = null;

function hasDeletionPending() {
  return deletionPending || localStorage.getItem(REMINDER_DELETION_PENDING_KEY) === "1";
}

function guardReminderChange(generation) {
  if (generation !== deletionGeneration || hasDeletionPending()) throw new Error(REMINDER_DELETION_WARNING);
}
const UNCERTAIN_QUEUE_MESSAGE = "Saved reminder settings may differ from this phone's schedule, and pending notifications may still arrive. Turning reminders off here attempts cleanup but cannot confirm it. Turn off notifications for Mentication in your phone's Settings to prevent alerts.";
// Snapshots and elapsed time cannot prove settlement. Preserve the latch across
// operations/reloads. The current plugin has no API that safely resets it.
let uncertainSchedule = false;
export function getReminderWarning() {
  try {
    if (localStorage.getItem(REMINDER_UNCERTAIN_KEY) === "1") uncertainSchedule = true;
    if (hasDeletionPending()) return REMINDER_DELETION_WARNING;
  } catch {
    return "Reminder status could not be read. " + UNCERTAIN_QUEUE_MESSAGE;
  }
  return uncertainSchedule ? UNCERTAIN_QUEUE_MESSAGE : "";
}
function latchUncertainty() {
  uncertainSchedule = true;
  try { writeVerified(localStorage, REMINDER_UNCERTAIN_KEY, "1"); }
  catch { /* Retain the in-memory warning if persistence is unavailable. */ }
}
// Capture erase intent before the caller wipes app data. Cleanup joins the
// native queue but does not gate or write back any erased preferences.
export function startReminderDeletion() {
  if (deletionCleanup) return deletionCleanup;
  deletionGeneration += 1;
  try {
    if (!remindersSupported()) return Promise.resolve({ ok: !getReminderWarning() });
  } catch {
    return Promise.resolve({ ok: false });
  }

  // An identical pre-existing request can satisfy the pending snapshot while
  // a new native addition is still in flight, including during rollback.
  if (nativeScheduling) latchUncertainty();
  deletionPending = true;
  try { writeVerified(localStorage, REMINDER_DELETION_PENDING_KEY, "1"); }
  catch { /* Keep the warning in memory even when the marker cannot be written. */ }

  deletionCleanup = serialize(async () => {
    try {
      await applyQueue(await plugin(), DEFAULT_REMINDER);
      removeVerified(localStorage, REMINDER_DELETION_PENDING_KEY);
      deletionPending = false;
      // A successful snapshot does not settle earlier asynchronous additions.
      return { ok: !getReminderWarning() };
    } catch {
      return { ok: false };
    } finally {
      deletionGeneration += 1;
      deletionCleanup = null;
    }
  });
  return deletionCleanup;
}

async function changeReminder(enabled, hour, minute, generation) {
  try { localStorage.getItem(PREFS_KEY); }
  catch { throw new Error("Reminder settings could not be read on this device. Please try again."); }
  guardReminderChange(generation);
  const warning = getReminderWarning();
  const previous = getReminderPrefs();
  const prefs = { enabled, hour: hour ?? previous.hour, minute: minute ?? previous.minute };
  validateTime(prefs.hour, prefs.minute);
  // Unresolved native additions must not make a retry look successful. Allow
  // opt-out cleanup, but never re-enable during its rollback or enqueue more.
  if (warning) {
    if (!enabled && remindersSupported()) {
      try { await applyQueue(await plugin(), { ...prefs, enabled: false }); }
      catch { /* Best effort only: keep the uncertainty warning. */ }
      guardReminderChange(generation);
      try { savePrefs({ ...prefs, enabled: false }); }
      catch { /* Warning also discloses possible saved-state disagreement. */ }
    }
    throw new Error(warning);
  }
  // Verify storage before changing native state, without saving new intent yet.
  savePrefs(previous);
  if (!remindersSupported()) {
    savePrefs(prefs);
    return { ok: true, reason: "preview" };
  }
  let api;
  try {
    api = await plugin();
    guardReminderChange(generation);
    if (enabled) {
      let permission = await api.checkPermissions();
      if (permission.display !== "granted") {
        guardReminderChange(generation);
        permission = await api.requestPermissions();
      }
      if (permission.display !== "granted") return { ok: false, reason: "denied" };
    }
  } catch {
    guardReminderChange(generation);
    throw new Error("This phone's notification service could not be reached. Your saved reminder settings were kept. Please try again.");
  }
  guardReminderChange(generation);
  try {
    await applyQueue(api, prefs);
    guardReminderChange(generation);
    savePrefs(prefs);
  } catch (error) {
    if (error.unsettledSchedule) latchUncertainty();
    guardReminderChange(generation);
    try {
      await applyQueue(api, previous);
      guardReminderChange(generation);
      // A failed write may have changed storage before throwing. Verify both
      // sides of rollback before claiming prior settings were restored.
      savePrefs(previous);
    } catch {
      latchUncertainty();
      throw new Error(UNCERTAIN_QUEUE_MESSAGE);
    }
    if (error.unsettledSchedule) throw new Error(UNCERTAIN_QUEUE_MESSAGE);
    throw new Error("The reminder change could not be saved or scheduled. Your previous schedule was restored. Please try again.");
  }
  return { ok: true };
}
/** Change time without opting in; reschedule only when already enabled. */
export function setReminderTime(hour, minute) {
  const generation = deletionGeneration;
  return serialize(async () => {
    validateTime(hour, minute);
    try { localStorage.getItem(PREFS_KEY); }
    catch { throw new Error("Reminder settings could not be read on this device. Please try again."); }
    guardReminderChange(generation);
    if (!getReminderPrefs().enabled) {
      savePrefs({ enabled: false, hour, minute });
      const warning = getReminderWarning();
      if (warning) throw new Error(warning);
      return { ok: true };
    }
    return changeReminder(true, hour, minute, generation);
  });
}
export function enableDailyReminder(hour, minute) {
  const generation = deletionGeneration;
  return serialize(() => changeReminder(true, hour, minute, generation));
}
export function disableDailyReminder() {
  try {
    if (hasDeletionPending()) return startReminderDeletion().then(result => {
      if (!result.ok) throw new Error(getReminderWarning() || REMINDER_DELETION_WARNING);
      return result;
    });
  } catch { /* The ordinary storage check will report this failure. */ }
  const generation = deletionGeneration;
  return serialize(() => changeReminder(false, undefined, undefined, generation));
}

export function formatReminderTime(hour, minute) {
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
