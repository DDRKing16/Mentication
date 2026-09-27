import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The ladder's primary controls (the active step card, and the two
// "continue/start" cards) were plain <div onClick> elements with no way to
// reach or activate them from a keyboard. They now carry role="button",
// tabIndex and an Enter/Space handler alongside the existing onClick.
describe("Next Easiest Step's primary controls are keyboard-reachable", () => {
  const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");

  it("the active step card is a keyboard-operable button", () => {
    expect(src).toMatch(/role="button"[\s\S]{0,40}tabIndex=\{0\}[\s\S]{0,60}onClick=\{\(\) => navigateTo\("intent"\)\}[\s\S]{0,200}onKeyDown=/);
  });

  it('both ladder "continue" cards respond to Enter and Space, not only a click', () => {
    const matches = src.match(/className="card play-pulse-glow"[\s\S]{0,300}?onKeyDown=\{\(e\) => \{ if \(e\.key === "Enter" \|\| e\.key === " "\)/g) || [];
    expect(matches.length).toBe(2);
  });
});
