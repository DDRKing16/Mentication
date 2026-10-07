import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The dedicated active view now places Pause in document flow below the host
// navigation. Real 320/390px hit-target geometry is covered by the browser check.
describe("Next Easiest Step's active Pause remains available", () => {
  it("keeps the existing pause behavior wired to the active view", () => {
    const host = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");
    const active = readFileSync("src/components/next-step/NextStepPractice.jsx", "utf8");
    expect(host).toContain('onPause={() => setShowPause(true)}');
    expect(active).toMatch(/<button type="button" onClick=\{onPause\}>[\s\S]*?Pause<\/button>/);
  });
});
