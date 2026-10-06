import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteAllLocalAppData, exportLocalAppData, sessionStore } from "./localData.js";

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
    const events = [];
    globalThis.window = {
      localStorage: new MemoryStorage(),
      dispatchEvent: (event) => events.push(event.type),
      __events: events,
    };
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    };
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.CustomEvent;
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
    window.localStorage.setItem("haven_a11y", JSON.stringify({ reducedMotion: true }));
    window.localStorage.setItem("haven.a11y.v2", JSON.stringify({ largeText: true }));
    window.localStorage.setItem("unrelated.product", "keep");
    window.localStorage.setItem("mentication_nes_v2_app_state", JSON.stringify({ task: "Synthetic private task" }));
    for (const key of ["goodmap-journey-v4", "goodmap-journey-v3", "gm_narr"]) window.localStorage.setItem(key, "synthetic");
    expect(exportLocalAppData().sessions).toHaveLength(1);

    deleteAllLocalAppData();

    expect(await sessionStore.list()).toEqual([]);
    expect(window.localStorage.getItem("mentation.preference")).toBeNull();
    expect(window.localStorage.getItem("haven_a11y")).toBeNull();
    expect(window.localStorage.getItem("haven.a11y.v2")).toBeNull();
    expect(window.localStorage.getItem("unrelated.product")).toBe("keep");
    expect(window.localStorage.getItem("mentication_nes_v2_app_state")).toBeNull();
    for (const key of ["goodmap-journey-v4", "goodmap-journey-v3", "gm_narr"]) expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.__events).toContain("mentation:accessibility-changed");
  });
});
