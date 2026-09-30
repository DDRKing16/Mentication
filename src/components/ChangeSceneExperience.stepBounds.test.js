import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Change the Scene restores its saved "step" from localStorage and reads it
// straight into STEPS[step]. A leftover step number from an older build (its
// sibling FlagshipExperience.jsx already guards against exactly this with
// the same clamp) would crash the practice on open instead of just showing
// the last valid step.
describe("Change the Scene clamps a restored step into range", () => {
  const src = readFileSync("src/components/ChangeSceneExperience.jsx", "utf8");

  it("clamps step before indexing into STEPS", () => {
    expect(src).toMatch(
      /const current = STEPS\[Math\.min\(step, Math\.max\(0, STEPS\.length - 1\)\)\];/
    );
  });
});
