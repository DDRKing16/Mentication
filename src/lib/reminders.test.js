import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_REMINDER, getReminderPrefs, setReminderTime } from "./reminders.js";

class LocalStorageStub {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

beforeEach(() => { global.localStorage = new LocalStorageStub(); });

describe("Daily reminder time", () => {
  it("starts off, at the default time", () => {
    expect(getReminderPrefs()).toEqual(DEFAULT_REMINDER);
  });

  it("remembers a chosen time without turning reminders on", () => {
    // The bug this guards: touching the time picker while reminders are off
    // must not silently enable notifications.
    setReminderTime(6, 45);
    expect(getReminderPrefs()).toEqual({ enabled: false, hour: 6, minute: 45 });
  });

  it("keeps reminders on when the time changes while they're already on", () => {
    localStorage.setItem("mentation.reminders.v1", JSON.stringify({ enabled: true, hour: 19, minute: 30 }));
    setReminderTime(8, 0);
    expect(getReminderPrefs()).toEqual({ enabled: true, hour: 8, minute: 0 });
  });
});
