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
    const foundationKeys = ["mentication.foundations.weekly-plan.v1", "mentication.foundations.weekly-plan.v2", "mentication.foundations.draft.v2", "mentication.foundations.sound.v1"];
    for (const key of foundationKeys) window.localStorage.setItem(key, "synthetic-foundations");
    window.localStorage.setItem("mentication.unrelated", "keep");
    for (const key of ["goodmap-journey-v4", "goodmap-journey-v3", "gm_narr"]) window.localStorage.setItem(key, "synthetic");
    expect(exportLocalAppData().sessions).toHaveLength(1);
    expect(Object.keys(exportLocalAppData().foundations)).toEqual(foundationKeys);

    deleteAllLocalAppData();

    expect(await sessionStore.list()).toEqual([]);
    expect(window.localStorage.getItem("mentation.preference")).toBeNull();
    expect(window.localStorage.getItem("haven_a11y")).toBeNull();
    expect(window.localStorage.getItem("haven.a11y.v2")).toBeNull();
    expect(window.localStorage.getItem("unrelated.product")).toBe("keep");
    expect(window.localStorage.getItem("mentication_nes_v2_app_state")).toBeNull();
    for (const key of foundationKeys) expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.localStorage.getItem("mentication.unrelated")).toBe("keep");
    for (const key of ["goodmap-journey-v4", "goodmap-journey-v3", "gm_narr"]) expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.__events).toContain("mentation:accessibility-changed");
  });
});

describe('storage failures remain truthful',()=>{
  beforeEach(()=>{globalThis.window={localStorage:new MemoryStorage(),dispatchEvent:()=>{}};globalThis.CustomEvent=class {constructor(type){this.type=type;}};});
  afterEach(()=>{delete globalThis.window;delete globalThis.CustomEvent;});
  it('does not replace unreadable session history',async()=>{
    window.localStorage.setItem('mentation.sessions.v1','{broken');
    await expect(sessionStore.create({id:'new'})).rejects.toThrow();
    expect(window.localStorage.getItem('mentation.sessions.v1')).toBe('{broken');
    await expect(sessionStore.list()).rejects.toThrow();
  });
  it('does not report a silent write as a saved session',async()=>{
    window.localStorage.setItem=()=>{};
    await expect(sessionStore.create({id:'new'})).rejects.toThrow('confirm');
  });
  it('erases Dear and Journal but preserves unrelated storage',()=>{
    for(const key of ['dear2100-book-v1','dear2100-book-v1.migration-backup','daybook'])window.localStorage.setItem(key,'private');
    window.localStorage.setItem('mentication.unrelated','keep');deleteAllLocalAppData();
    expect(window.localStorage.getItem('daybook')).toBeNull();expect(window.localStorage.getItem('dear2100-book-v1')).toBeNull();expect(window.localStorage.getItem('dear2100-book-v1.migration-backup')).toBeNull();expect(window.localStorage.getItem('mentication.unrelated')).toBe('keep');
  });
  it('does not report silent removal as a successful full deletion',()=>{
    window.localStorage.setItem('daybook','private');window.localStorage.removeItem=()=>{};
    expect(()=>deleteAllLocalAppData()).toThrow('deletion');
  });
});
