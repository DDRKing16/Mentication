import { beforeEach, describe, expect, it } from "vitest";
import { completeOnboarding, completeWelcome, hasCompletedOnboarding, hasSeenWelcome, resetOnboarding } from "./onboarding.js";

class LocalStorageStub {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

beforeEach(() => {
  global.localStorage = new LocalStorageStub();
  resetOnboarding();
});

describe("onboarding progress", () => {
  it("does not treat welcome completion as full onboarding", () => {
    completeWelcome();
    expect(hasSeenWelcome()).toBe(true);
    expect(hasCompletedOnboarding()).toBe(false);
  });

  it("treats onboarding completion as including welcome", () => {
    completeOnboarding();
    expect(hasSeenWelcome()).toBe(true);
    expect(hasCompletedOnboarding()).toBe(true);
  });

  it("preserves onboarding state changes when storage is unavailable", () => {
    global.localStorage = {
      getItem() { throw new Error("storage unavailable"); },
      setItem() { throw new Error("storage unavailable"); },
      removeItem() { throw new Error("storage unavailable"); },
    };

    resetOnboarding();
    completeWelcome();
    expect(hasSeenWelcome()).toBe(true);
    expect(hasCompletedOnboarding()).toBe(false);

    completeOnboarding();
    expect(hasSeenWelcome()).toBe(true);
    expect(hasCompletedOnboarding()).toBe(true);

    resetOnboarding();
    expect(hasSeenWelcome()).toBe(false);
    expect(hasCompletedOnboarding()).toBe(false);
  });
});
