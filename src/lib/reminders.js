// Gentle daily reminders, scheduled on the device itself.
//
// Uses @capacitor/local-notifications: the phone schedules these locally, so
// nothing is sent to or from a server. One reminder per weekday, each with its
// own wording, so it never feels like the same nag every day.
import { Capacitor } from "@capacitor/core";

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
    return { enabled: Boolean(raw.enabled), hour, minute };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
}

/**
 * Change the saved reminder time without touching whether reminders are on.
 * Used while reminders are off, so picking a time to have ready doesn't turn
 * notifications on by itself. If reminders are already on, call
 * enableDailyReminder(hour, minute) instead, which also reschedules them.
 */
export function setReminderTime(hour, minute) {
  savePrefs({ ...getReminderPrefs(), hour, minute });
}

/** Reminders only fire in the iPhone app, not a browser preview. */
export const remindersSupported = () => Capacitor.isNativePlatform();

async function plugin() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

/**
 * Turn the daily reminder on at hour:minute. Asks the phone for permission the
 * first time. Returns { ok, reason } — reason is "denied" if the person said no.
 */
export async function enableDailyReminder(hour, minute) {
  const prefs = { enabled: true, hour, minute };
  if (!remindersSupported()) {
    savePrefs(prefs);
    return { ok: true, reason: "preview" };
  }
  const LocalNotifications = await plugin();
  let permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted") {
    savePrefs({ ...prefs, enabled: false });
    return { ok: false, reason: "denied" };
  }
  await LocalNotifications.cancel({ notifications: ALL_IDS.map((id) => ({ id })) });
  await LocalNotifications.schedule({
    notifications: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
      id: idFor(weekday),
      title: "Mentication",
      body: MESSAGES[weekday],
      schedule: { on: { weekday, hour, minute }, repeats: true, allowWhileIdle: true },
    })),
  });
  savePrefs(prefs);
  return { ok: true };
}

export async function disableDailyReminder() {
  const prefs = { ...getReminderPrefs(), enabled: false };
  if (remindersSupported()) {
    const LocalNotifications = await plugin();
    await LocalNotifications.cancel({ notifications: ALL_IDS.map((id) => ({ id })) });
  }
  savePrefs(prefs);
}

export function formatReminderTime(hour, minute) {
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
