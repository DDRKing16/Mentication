import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Progressive Muscle Relaxation's "This isn't helping" / "Next intervention"
// row used to hide the first button entirely below 391px wide -- the width
// of almost every iPhone in portrait -- leaving no way to switch away from a
// practice that isn't working, while Box Breathing and 5-4-3-2-1 Grounding
// (sharing the same row) kept both buttons. Both must stay visible and
// reachable at every phone width; only their sizing may shrink.
describe("Progressive Muscle Relaxation's switch-practice row stays visible on small phones", () => {
  const css = readFileSync("src/styles/intervention-experiences.css", "utf8");
  const narrowBlock = css.match(/@media \(max-width: 390px\) \{[\s\S]*?\n\}/)?.[0] || "";

  it("never hides the actions row or either of its buttons at narrow widths", () => {
    expect(narrowBlock).not.toMatch(/\.pmr-v2-actions-wrap\s*\{[^}]*position:\s*absolute/);
    expect(narrowBlock).not.toMatch(/display:\s*none/);
  });
});
