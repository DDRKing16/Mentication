import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteFlagshipMemory } from "./flagshipMemory.js";
import { readDraft, stageNextStepHandoff, writeDraft } from "./tomorrowParking/storage.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

describe("Delete local intervention memory", () => {
  beforeEach(() => {
    const localStorage = new MemoryStorage();
    const sessionStorage = new MemoryStorage();
    globalThis.window = { localStorage, sessionStorage };
    globalThis.localStorage = localStorage;
  });
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.localStorage;
  });

  it("also clears an unsaved Tomorrow Parking Lot draft and a staged handoff, as the button promises", () => {
    // Both live in sessionStorage, separate from the localStorage keys this
    // function otherwise clears - easy to miss, which is exactly what happened.
    writeDraft("something half-written", null);
    stageNextStepHandoff("an excerpt someone chose to carry forward");
    expect(readDraft()?.text).toBe("something half-written");

    deleteFlagshipMemory("all");

    expect(readDraft()).toBe(null);
    expect(globalThis.window.sessionStorage.getItem("mentication.tomorrowParking.nextStepHandoff.v1")).toBe(null);
  });

  it("does the same for the narrower 'saved' scope", () => {
    writeDraft("a draft", null);
    deleteFlagshipMemory("saved");
    expect(readDraft()).toBe(null);
  });

  it("leaves the draft alone for scopes that aren't about saved parking data", () => {
    writeDraft("keep me", null);
    deleteFlagshipMemory("active");
    expect(readDraft()?.text).toBe("keep me");
  });
});
