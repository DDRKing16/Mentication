import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearBumpFunnel, getBumpFunnel, recordBumpScene } from "./happyBumpFunnel.js";

beforeEach(() => {
  const values = new Map();
  global.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
});

afterEach(() => clearBumpFunnel());

describe("Happy Bump funnel", () => {
  it("records only known scenes and avoids duplicate scene entries", () => {
    recordBumpScene("run-1", "arrival");
    recordBumpScene("run-1", "arrival");
    recordBumpScene("run-1", "move");
    recordBumpScene("run-1", "private-note");

    expect(getBumpFunnel().runs).toHaveLength(1);
    expect(getBumpFunnel().runs[0]).toMatchObject({ id: "run-1", scenes: ["arrival", "move"] });
  });
});
