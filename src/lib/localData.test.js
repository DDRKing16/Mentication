import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteAllLocalAppData,
  deleteLocalDataGroup,
  downloadLocalAppData,
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
    const localStorage = new MemoryStorage();
    globalThis.window = {
      localStorage,
      dispatchEvent: () => {},
    };
    globalThis.localStorage = localStorage;
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.localStorage;
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
    completeOnboarding();
    window.localStorage.setItem("unrelated.product", "keep");
    const exported = exportLocalAppData();
    expect(exported.schemaVersion).toBe(2);
    expect(exported.sessions).toHaveLength(1);
    expect(exported.localStorage["mentation.preference"]).toBe("quiet");
    expect(exported.localStorage.haven_onboarded).toBe("1");

    await deleteAllLocalAppData();

    expect(await sessionStore.list()).toEqual([]);
    expect(window.localStorage.getItem("mentation.preference")).toBeNull();
    expect(hasSeenWelcome()).toBe(false);
    expect(hasCompletedOnboarding()).toBe(false);
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
    expect(hasSeenWelcome()).toBe(true);
    expect(hasCompletedOnboarding()).toBe(false);

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

  it("deletes sessions, accessibility, and thought-record groups through their dedicated paths", async () => {
    const events = [];
    window.dispatchEvent = (event) => { events.push({ type: event.type, detail: event.detail }); };
    await sessionStore.create({ id: "one", direction: "calm" });
    window.localStorage.setItem("haven.a11y.v2", JSON.stringify({ reducedMotion: true }));
    window.localStorage.setItem("mentation.thought-or-fact.records.v1", JSON.stringify([{ id: "record-1" }]));
    events.length = 0;

    expect(await deleteLocalDataGroup("sessions")).toEqual({ deleted: true, count: 1 });
    expect(await sessionStore.list()).toEqual([]);
    expect(events.some((event) => event.type === "mentation:sessions-changed" && event.detail?.count === 0)).toBe(true);

    expect(await deleteLocalDataGroup("accessibility")).toEqual({ deleted: true, count: 1 });
    expect(window.localStorage.getItem("haven.a11y.v2")).toBeNull();
    expect(events.some((event) => event.type === "mentation:sessions-changed" && event.detail?.count === 0)).toBe(true);

    expect(await deleteLocalDataGroup("thoughtRecords")).toEqual({ deleted: true, count: 1 });
    expect(window.localStorage.getItem("mentation.thought-or-fact.records.v1")).toBeNull();
    expect(events.filter((event) => event.type === "mentation:sessions-changed")).toHaveLength(3);
  });

  it("downloads local data with and without document.body", () => {
    const originalDocument = globalThis.document;
    const originalURL = globalThis.URL;
    const originalBlob = globalThis.Blob;
    const clicks = [];
    const appended = [];
    const revoked = [];
    const link = {
      click: () => { clicks.push("clicked"); },
      remove: () => { clicks.push("removed"); },
    };
    globalThis.Blob = class BlobMock {
      constructor(parts, options) {
        this.parts = parts;
        this.type = options.type;
      }
    };
    globalThis.URL = {
      createObjectURL: () => "blob:test",
      revokeObjectURL: (value) => { revoked.push(value); },
    };

    try {
      globalThis.document = {
        body: { appendChild: (node) => { appended.push(node); } },
        createElement: () => link,
      };
      expect(downloadLocalAppData("mentation-export")).toBe(true);
      expect(appended).toEqual([link]);
      expect(clicks).toContain("clicked");
      expect(revoked).toEqual(["blob:test"]);

      appended.length = 0;
      clicks.length = 0;
      revoked.length = 0;
      globalThis.document = {
        body: null,
        createElement: () => link,
      };
      expect(downloadLocalAppData("mentation-export")).toBe(true);
      expect(appended).toEqual([]);
      expect(clicks).toContain("clicked");
      expect(revoked).toEqual(["blob:test"]);
    } finally {
      globalThis.document = originalDocument;
      globalThis.URL = originalURL;
      globalThis.Blob = originalBlob;
    }
  });
});
