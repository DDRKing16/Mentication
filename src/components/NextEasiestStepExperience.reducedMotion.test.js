import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Completing a ladder step fires a canvas confetti burst (triggerConfetti),
// driven by its own requestAnimationFrame loop rather than a CSS animation,
// so the app-wide "html.reduce-motion *" rule in index.css can't reach it.
// It now checks the shared Reduce motion preference and holds still instead.
describe("Next Easiest Step's confetti burst respects Reduce motion", () => {
  const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");

  it("imports the shared accessibility preferences hook", () => {
    expect(src).toMatch(/import \{ useAccessibilityPrefs \} from "@\/hooks\/useAccessibilityPrefs";/);
  });

  it("triggerConfetti bails out immediately when reducedMotion is on", () => {
    expect(src).toMatch(/const triggerConfetti = \(\) => \{\s*if \(prefs\.reducedMotion\) return;/);
  });
});
