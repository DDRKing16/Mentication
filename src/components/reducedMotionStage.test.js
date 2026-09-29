import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The Box/PMR/Grounding player's central visual (StageVisual.jsx,
// GroundingStage.jsx) and the 5-4-3-2-1 Grounding V2 stage markers all used
// framer-motion `repeat: Infinity` loops (spinning rings, pulsing dots,
// rising particles) that kept animating even with the app's own "Reduce
// motion" setting on, because that setting only neutralises CSS
// animations/transitions, not framer-motion's own imperative animation
// loop. Every looping animation in these files now checks a `reducedMotion`
// prop, threaded from the shared accessibility preferences in
// ResetPlayer.jsx, and holds still instead of looping when it's on.
describe("looping stage animations respect Reduce motion", () => {
  const files = {
    stageVisual: readFileSync("src/components/StageVisual.jsx", "utf8"),
    groundingStage: readFileSync("src/components/GroundingStage.jsx", "utf8"),
    stageMarkers: readFileSync("src/components/grounding54321/StageMarkers.jsx", "utf8"),
    resetPlayer: readFileSync("src/components/ResetPlayer.jsx", "utf8"),
  };

  it("every repeat: Infinity animation in the stage visuals is guarded by reducedMotion", () => {
    for (const [name, src] of Object.entries(files)) {
      if (name === "resetPlayer") continue;
      const matches = [...src.matchAll(/repeat:\s*Infinity/g)];
      expect(matches.length).toBeGreaterThan(0);
      for (const m of matches) {
        // Look at the surrounding JSX (back to well before the enclosing
        // element's opening tag, and a little past the match) so both an
        // inline `reducedMotion ? … : …` value and a wrapping
        // `{active && !reducedMotion && (…)}` conditional are caught.
        const start = Math.max(0, m.index - 400);
        const end = Math.min(src.length, m.index + 60);
        const nearby = src.slice(start, end);
        expect(nearby, `${name}: a repeat: Infinity animation has no reducedMotion guard nearby:\n${nearby}`).toMatch(/reducedMotion/);
      }
    }
  });

  it("StageVisual and GroundingStage accept a reducedMotion prop", () => {
    expect(files.stageVisual).toMatch(/export default function StageVisual\(\{[^}]*reducedMotion/);
    expect(files.groundingStage).toMatch(/export default function GroundingStage\(\{[^}]*reducedMotion/);
  });

  it("ResetPlayer threads the live reducedMotion preference into both stages", () => {
    expect(files.resetPlayer).toMatch(/reducedMotion=\{a11y\.prefs\.reducedMotion\}/);
  });
});
