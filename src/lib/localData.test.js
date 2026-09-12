import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteAllLocalAppData,
  deleteLocalDataGroup,
  exportLocalAppData,
  getLocalDataInventory,
  sessionStore,
} from "./localData.js";
import { completeOnboarding, completeWelcome, hasCompletedOnboarding, hasSeenWelcome } from "./onboarding.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe("device-local application data", () => {
  beforeEach(() => {
    globalThis.window = {
      localStorage: new MemoryStorage(),
      dispatchEvent: () => {},
    };
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it("creates, orders and limits session records without a remote service", async () => {
    await sessionStore.create({ id: "older", created_date: "2026-09-01T00:00:00.000Z", direction: "calm" });
    await sessionStore.create({ id: "newer", created_date: "2026-09-02T00:00:00.000Z", direction: "focus" });
    const sessions = await sessionStore.list("-created_date", 1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("newer");
    expect(sessions[0].storage_scope).toBe("device");
  });

  it("exports and erases only application-owned local data", async () => {
    await sessionStore.create({ id: "one", direction: "sleep" });
    window.localStorage.setItem("mentation.preference", "quiet");
    window.localStorage.setItem("haven_onboarded", "1");
    window.localStorage.setItem("unrelated.product", "keep");
    const exported = exportLocalAppData();
    expect(exported.schemaVersion).toBe(2);
    expect(exported.sessions).toHaveLength(1);
    expect(exported.localStorage["mentation.preference"]).toBe("quiet");
    expect(exported.localStorage.haven_onboarded).toBe("1");

    deleteAllLocalAppData();

    expect(await sessionStore.list()).toEqual([]);
    expect(window.localStorage.getItem("mentation.preference")).toBeNull();
    expect(window.localStorage.getItem("unrelated.product")).toBe("keep");
  });

  it("builds inventory and deletes specific data groups", async () => {
    await sessionStore.create({ id: "one", direction: "sleep" });
    completeWelcome();
    window.localStorage.setItem("haven.dislikes", JSON.stringify({ byId: { sigh: 1 } }));
    window.localStorage.setItem("mentation.flagship.active.v1", JSON.stringify({ interventionId: "boxV2" }));
    window.localStorage.setItem("mentation.flagship.preferences.v1", JSON.stringify({ version: 1, events: [] }));

    const inventory = getLocalDataInventory();
    expect(inventory.find((item) => item.id === "sessions")?.count).toBe(1);
    expect(inventory.find((item) => item.id === "onboarding")?.count).toBe(1);
    expect(inventory.find((item) => item.id === "adaptive")?.count).toBe(1);
    expect(inventory.find((item) => item.id === "flagship")?.count).toBe(2);
    expect(inventory.find((item) => item.id === "accessibility")?.count).toBe(0);
    expect(inventory.find((item) => item.id === "thoughtRecords")?.count).toBe(0);

    await deleteLocalDataGroup("adaptive");
    expect(window.localStorage.getItem("haven.dislikes")).toBeNull();
    expect(window.localStorage.getItem("haven_onboarded")).toBe("1");

    const removed = await deleteLocalDataGroup("flagship");
    expect(removed).toEqual({ deleted: true, count: 2 });
    expect(window.localStorage.getItem("mentation.flagship.active.v1")).toBeNull();
    expect(window.localStorage.getItem("mentation.flagship.preferences.v1")).toBeNull();
  });

  it("clears in-memory onboarding progress when deleting the onboarding group", async () => {
    completeWelcome();
    completeOnboarding();
    expect(hasSeenWelcome()).toBe(true);
    expect(hasCompletedOnboarding()).toBe(true);

    const removed = await deleteLocalDataGroup("onboarding");

    expect(removed).toEqual({ deleted: true, count: 2 });
    expect(hasSeenWelcome()).toBe(false);
    expect(hasCompletedOnboarding()).toBe(false);
  });
});
