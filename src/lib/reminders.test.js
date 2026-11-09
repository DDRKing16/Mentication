import { beforeEach, describe, expect, it, vi } from "vitest";
let DEFAULT_REMINDER, disableDailyReminder, enableDailyReminder, getReminderPrefs, getReminderWarning, setReminderTime;
const native = vi.hoisted(() => ({ supported: true, pending: new Map() }));
const api = vi.hoisted(() => ({ checkPermissions: vi.fn(), requestPermissions: vi.fn(), schedule: vi.fn(), cancel: vi.fn(), getPending: vi.fn() }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native.supported } }));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: api }));
const KEY = "mentation.reminders.v1";
const UNCERTAIN = "mentation.reminders.uncertain.v1";
const IDS = [2101, 2102, 2103, 2104, 2105, 2106, 2107];
class LocalStorageStub {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}
function expectQueue(hour, minute) {
  expect([...native.pending.keys()].filter(id => IDS.includes(id))).toEqual(IDS);
  for (const id of IDS) expect(native.pending.get(id).schedule.on).toEqual({ weekday: id - 2100, hour, minute });
}
beforeEach(async () => {
  vi.resetModules();
  ({ DEFAULT_REMINDER, disableDailyReminder, enableDailyReminder, getReminderPrefs, getReminderWarning, setReminderTime } = await import("./reminders.js"));
  vi.resetAllMocks();
  global.localStorage = new LocalStorageStub();
  native.supported = true;
  native.pending.clear();
  api.checkPermissions.mockResolvedValue({ display: "granted" });
  api.requestPermissions.mockResolvedValue({ display: "granted" });
  api.schedule.mockImplementation(async ({ notifications }) => {
    for (const item of notifications) native.pending.set(item.id, item);
  });
  api.cancel.mockImplementation(async ({ notifications }) => {
    for (const { id } of notifications) native.pending.delete(id);
  });
  api.getPending.mockImplementation(async () => ({ notifications: [...native.pending.values()] }));
});
describe("Daily reminders", () => {
  it("edits an off-state time without opting in or requesting permission", async () => {
    expect(getReminderPrefs()).toEqual(DEFAULT_REMINDER);
    await setReminderTime(6, 45);
    expect(getReminderPrefs()).toEqual({ enabled: false, hour: 6, minute: 45 });
    expect(api.checkPermissions).not.toHaveBeenCalled();
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it("does not interpret malformed preferences as opt-in", () => {
    localStorage.setItem(KEY, JSON.stringify({ enabled: "false", hour: -1, minute: 99 }));
    expect(getReminderPrefs()).toEqual(DEFAULT_REMINDER);
  });
  it("replaces the same weekday IDs without cancelling", async () => {
    await enableDailyReminder(19, 30);
    await setReminderTime(8, 0);
    expectQueue(8, 0);
    expect(getReminderPrefs()).toEqual({ enabled: true, hour: 8, minute: 0 });
    expect(api.cancel).not.toHaveBeenCalled();
  });
  it("attempts restoration after schedule failure but blocks scheduling retries", async () => {
    await enableDailyReminder(19, 30);
    api.schedule.mockRejectedValueOnce(new Error("native failure"));
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("may differ");
    expectQueue(19, 30);
    expect(getReminderPrefs()).toEqual({ enabled: true, hour: 19, minute: 30 });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("may differ");
    expectQueue(19, 30);
  });
  it("cleans up partial scheduling without claiming certainty", async () => {
    api.schedule.mockImplementationOnce(async ({ notifications }) => {
      native.pending.set(notifications[0].id, notifications[0]);
      throw new Error("partial failure");
    });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("may differ");
    expect(native.pending.size).toBe(0);
    expect(getReminderPrefs().enabled).toBe(false);
  });
  it("does not claim off after cancellation failure and permits safe retry", async () => {
    await enableDailyReminder(8, 0);
    api.cancel.mockRejectedValueOnce(new Error("failed"));
    await expect(disableDailyReminder()).rejects.toThrow("restored");
    expect(getReminderPrefs().enabled).toBe(true);
    expectQueue(8, 0);
    await disableDailyReminder();
    expect(getReminderPrefs().enabled).toBe(false);
    expect(native.pending.size).toBe(0);
  });
  it("verifies cancellation and preserves other notification IDs", async () => {
    await enableDailyReminder(8, 0);
    native.pending.set(999, { id: 999 });
    api.cancel.mockResolvedValueOnce(undefined);
    await expect(disableDailyReminder()).rejects.toThrow("restored");
    await disableDailyReminder();
    expect([...native.pending.keys()]).toEqual([999]);
  });
  it("warns when restoration fails too", async () => {
    api.schedule.mockRejectedValue(new Error("failed"));
    api.cancel.mockRejectedValue(new Error("failed"));
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("may differ");
    expect(getReminderPrefs().enabled).toBe(false);
  });
  it("preserves preferences on permission denial", async () => {
    await setReminderTime(7, 15);
    api.checkPermissions.mockResolvedValue({ display: "prompt" });
    api.requestPermissions.mockResolvedValue({ display: "denied" });
    await expect(enableDailyReminder(8, 0)).resolves.toEqual({ ok: false, reason: "denied" });
    expect(getReminderPrefs()).toEqual({ enabled: false, hour: 7, minute: 15 });
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it("explains permission-service errors and permits retry", async () => {
    api.checkPermissions.mockRejectedValueOnce(new Error("bridge unavailable"));
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("notification service could not be reached");
    expect(getReminderPrefs()).toEqual(DEFAULT_REMINDER);
    expect(api.schedule).not.toHaveBeenCalled();
    await enableDailyReminder(8, 0);
    expectQueue(8, 0);
  });
  it("rejects storage failure before native changes and permits retry", async () => {
    const write = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("full"); });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("could not be saved");
    await expect(setReminderTime(6, 0)).rejects.toThrow("could not be saved");
    expect(api.schedule).not.toHaveBeenCalled();
    write.mockRestore();
    await enableDailyReminder(8, 0);
    expectQueue(8, 0);
  });
  it("restores native state after final preference write fails", async () => {
    await enableDailyReminder(19, 30);
    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      if (JSON.parse(value).hour === 8) throw new Error("full");
      original(key, value);
    });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("restored");
    expectQueue(19, 30);
    expect(getReminderPrefs().hour).toBe(19);
  });
  it("rejects silently ignored writes before scheduling", async () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {});
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("could not be saved");
    await expect(setReminderTime(8, 0)).rejects.toThrow("could not be saved");
    expect(api.schedule).not.toHaveBeenCalled();
    expect(getReminderPrefs()).toEqual(DEFAULT_REMINDER);
  });
  it("rolls back after a silently ignored final write", async () => {
    await enableDailyReminder(19, 30);
    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      if (JSON.parse(value).hour !== 8) original(key, value);
    });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("previous schedule was restored");
    expectQueue(19, 30);
    expect(getReminderPrefs().hour).toBe(19);
  });
  it("restores preferences when a write changes them before throwing", async () => {
    await enableDailyReminder(19, 30);
    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      original(key, value);
      if (JSON.parse(value).hour === 8) throw new Error("failed after write");
    });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("previous schedule was restored");
    expectQueue(19, 30);
    expect(getReminderPrefs().hour).toBe(19);
  });
  it("warns if queue rollback works but preference restoration fails", async () => {
    await enableDailyReminder(19, 30);
    const original = localStorage.setItem.bind(localStorage);
    let changed = false;
    vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      if (changed) return;
      original(key, value);
      if (JSON.parse(value).hour === 8) { changed = true; throw new Error("failed after write"); }
    });
    const error = await enableDailyReminder(8, 0).catch(error => error);
    expect(error.message).toContain("may differ");
    expect(error.message).not.toContain("Your previous schedule was restored");
    expectQueue(19, 30);
    expect(getReminderPrefs().hour).toBe(8);
  });
  it("does not overwrite unreadable preferences", async () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("could not be read");
    await expect(setReminderTime(8, 0)).rejects.toThrow("could not be read");
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it("serializes rapid toggle and time edits", async () => {
    await Promise.all([enableDailyReminder(8, 0), setReminderTime(9, 15), disableDailyReminder(), setReminderTime(10, 30)]);
    expect(getReminderPrefs()).toEqual({ enabled: false, hour: 10, minute: 30 });
    expect(native.pending.size).toBe(0);
    expect(api.schedule).toHaveBeenCalledTimes(2);
  });
  it("verifies queue contents instead of trusting plugin success", async () => {
    await enableDailyReminder(8, 0);
    api.schedule.mockResolvedValueOnce(undefined);
    await expect(enableDailyReminder(9, 0)).rejects.toThrow("may differ");
    expectQueue(8, 0);
  });
  it("waits for delayed visibility without duplicate scheduling", async () => {
    vi.useFakeTimers();
    try {
      api.schedule.mockImplementationOnce(async ({ notifications }) => {
        setTimeout(() => { for (const item of notifications) native.pending.set(item.id, item); }, 250);
      });
      const result = enableDailyReminder(8, 0);
      await vi.advanceTimersByTimeAsync(200);
      expect(getReminderPrefs().enabled).toBe(false);
      expect(api.schedule).toHaveBeenCalledTimes(1);
      expect(api.cancel).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(100);
      await expect(result).resolves.toEqual({ ok: true });
      expect(api.getPending).toHaveBeenCalledTimes(4);
      expect(api.schedule).toHaveBeenCalledTimes(1);
      expectQueue(8, 0);
    } finally { vi.useRealTimers(); }
  });
  it("bounds terminal mismatch polling and warns despite apparent rollback", async () => {
    vi.useFakeTimers();
    try {
      await enableDailyReminder(19, 30);
      api.getPending.mockClear();
      api.schedule.mockClear();
      api.schedule.mockResolvedValueOnce(undefined);
      const result = enableDailyReminder(8, 0).catch(error => error);
      await vi.advanceTimersByTimeAsync(800);
      expect(api.schedule).toHaveBeenCalledTimes(1);
      expect(api.getPending).toHaveBeenCalledTimes(9);
      await vi.advanceTimersByTimeAsync(100);
      expect((await result).message).toContain("may differ");
      expect(api.schedule).toHaveBeenCalledTimes(2);
      expect(api.getPending).toHaveBeenCalledTimes(11);
      expect(vi.getTimerCount()).toBe(0);
      expectQueue(19, 30);
    } finally { vi.useRealTimers(); }
  });
  it.each([false, true])("warns before late additions after apparent cleanup (rejects: %s)", async rejects => {
    vi.useFakeTimers();
    try {
      api.schedule.mockImplementationOnce(async ({ notifications }) => {
        setTimeout(() => { for (const item of notifications) native.pending.set(item.id, item); }, 1100);
        if (rejects) throw new Error("failed after asynchronous enqueue");
      });
      const result = enableDailyReminder(8, 0).catch(error => error);
      await vi.advanceTimersByTimeAsync(900);
      const error = await result;
      expect(error.message).toContain("may differ");
      expect(error.message).toContain("pending notifications may still arrive");
      expect(error.message).toContain("phone's Settings");
      expect(error.message).not.toContain("Your previous schedule was restored");
      expect(api.cancel).toHaveBeenCalledTimes(1);
      expect(api.schedule).toHaveBeenCalledTimes(1);
      expect(native.pending.size).toBe(0);
      expect(getReminderPrefs().enabled).toBe(false);
      await vi.advanceTimersByTimeAsync(200);
      expectQueue(8, 0);
      expect(getReminderPrefs().enabled).toBe(false);
    } finally { vi.useRealTimers(); }
  });
  it("keeps uncertainty through edit, immediate off, late additions and reload", async () => {
    vi.useFakeTimers();
    try {
      await enableDailyReminder(19, 30);
      api.schedule.mockImplementationOnce(async ({ notifications }) => {
        setTimeout(() => { for (const item of notifications) native.pending.set(item.id, item); }, 1100);
      });
      const edit = setReminderTime(8, 0).catch(error => error);
      await vi.advanceTimersByTimeAsync(905);
      expect((await edit).message).toContain("may differ");
      expect(getReminderPrefs()).toEqual({ enabled: true, hour: 19, minute: 30 });
      const schedules = api.schedule.mock.calls.length;
      await expect(disableDailyReminder()).rejects.toThrow("may differ");
      expect(api.schedule).toHaveBeenCalledTimes(schedules);
      expect(getReminderPrefs().enabled).toBe(false);
      expect(native.pending.size).toBe(0);
      expect(getReminderWarning()).toContain("phone's Settings");
      await vi.advanceTimersByTimeAsync(302);
      expectQueue(8, 0);
      vi.resetModules();
      const reloaded = await import("./reminders.js");
      expect(reloaded.getReminderWarning()).toContain("may differ");
      await expect(reloaded.disableDailyReminder()).rejects.toThrow("may differ");
      expect(native.pending.size).toBe(0);
      expect(reloaded.getReminderWarning()).toContain("may differ");
      await expect(reloaded.enableDailyReminder(9, 0)).rejects.toThrow("may differ");
      expect(api.schedule).toHaveBeenCalledTimes(schedules);
      await expect(reloaded.setReminderTime(10, 0)).rejects.toThrow("may differ");
      expect(reloaded.getReminderPrefs()).toEqual({ enabled: false, hour: 10, minute: 0 });
    } finally { vi.useRealTimers(); }
  });
  it("never re-enables a latched schedule when opt-out cleanup fails", async () => {
    await enableDailyReminder(19, 30);
    localStorage.setItem(UNCERTAIN, "1");
    api.schedule.mockClear();
    api.cancel.mockRejectedValueOnce(new Error("failed"));
    await expect(disableDailyReminder()).rejects.toThrow("may differ");
    expect(api.schedule).not.toHaveBeenCalled();
    expect(getReminderPrefs().enabled).toBe(false);
    expect(getReminderWarning()).toContain("phone's Settings");
  });
  it("retains the in-memory warning if marker persistence fails", async () => {
    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      if (key === UNCERTAIN) throw new Error("blocked");
      original(key, value);
    });
    api.schedule.mockRejectedValueOnce(new Error("failed"));
    await expect(enableDailyReminder(8, 0)).rejects.toThrow("may differ");
    expect(getReminderWarning()).toContain("may differ");
    await expect(disableDailyReminder()).rejects.toThrow("may differ");
    expect(getReminderWarning()).toContain("may differ");
  });
  it("rejects invalid times before native changes", async () => {
    await expect(enableDailyReminder(24, 0)).rejects.toThrow("valid reminder time");
    await expect(setReminderTime(8, NaN)).rejects.toThrow("valid reminder time");
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it("identifies browser preferences as preview-only", async () => {
    native.supported = false;
    await expect(enableDailyReminder(8, 0)).resolves.toEqual({ ok: true, reason: "preview" });
    expect(api.schedule).not.toHaveBeenCalled();
  });
});
