import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The focus screen's own Pause button used to sit in the exact same
// top-right corner as the shared floating Home button (InterventionNav),
// which is fixed to that corner on every screen. The Home button, painted
// on top, fully covered the Pause button, so a tap there always hit Home
// instead. Pause now carries a right margin to clear it.
describe("Next Easiest Step's focus header doesn't collide with the shared Home button", () => {
  const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");

  it("the Pause button has a right margin clearing the fixed Home button", () => {
    expect(src).toMatch(/onClick=\{\(\) => setShowPause\(true\)\}[\s\S]{0,600}marginRight: "48px"/);
  });
});
