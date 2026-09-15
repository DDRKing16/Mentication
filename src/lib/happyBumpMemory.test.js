import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearLastFocus, getLastFocus, saveLastFocus } from "./happyBumpMemory.js";

beforeEach(() => {
  const values = new Map();
  global.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
});

afterEach(() => clearLastFocus());

describe("Happy Bump last-focus memory", () => {
  it("returns null when nothing has been saved", () => {
    expect(getLastFocus()).toBeNull();
  });

  it("remembers the life area and a canned action", () => {
    saveLastFocus({ lifeArea: "relationships", areaAction: "Send a thank-you message" });
    expect(getLastFocus()).toMatchObject({ lifeArea: "relationships", areaAction: "Send a thank-you message" });
  });

  it("stores null for custom free-text actions instead of persisting personal text", () => {
    saveLastFocus({ lifeArea: "relationships", areaAction: null });
    expect(getLastFocus()).toMatchObject({ lifeArea: "relationships", areaAction: null });
  });

  it("can be cleared", () => {
    saveLastFocus({ lifeArea: "health", areaAction: "Stretch for two minutes" });
    clearLastFocus();
    expect(getLastFocus()).toBeNull();
  });
});
