import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function freshModule() {
  vi.resetModules();
  return import("./aiSteps.js");
}

describe("generateTaskSteps", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_AI_URL", "https://relay.example");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("resolves null instead of hanging forever when the relay never responds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal } = {}) => new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const { generateTaskSteps } = await freshModule();

    const pending = generateTaskSteps("Reply to an email");
    let settled = false;
    pending.then(() => { settled = true; });

    await vi.advanceTimersByTimeAsync(14000);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(2000);
    await expect(pending).resolves.toBeNull();
  });

  it("returns the cleaned steps on a normal response", async () => {
    const steps = Array.from({ length: 5 }, (_, i) => ({
      title: `Step ${i}`,
      micro: "Do it",
      time: "<45 sec",
      easier: ["Smaller", "Smallest"],
    }));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ steps }) })));
    const { generateTaskSteps } = await freshModule();

    await expect(generateTaskSteps("Tidy a drawer")).resolves.toHaveLength(5);
  });
});
