import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Vector Shift's native build ("serpent" stage) has four direction buttons
// that render only an arrow glyph (↑ ← ↓ →) with no other text, which a
// screen reader has no reliable name for on its own. Each needs its own
// aria-label so the glyph isn't the only thing read aloud.
describe("Vector Shift's serpent-stage direction buttons are named for a screen reader", () => {
  const jsx = readFileSync("src/components/NewFlagshipExperiences.jsx", "utf8");

  it.each([
    ["↑", "Move up"],
    ["←", "Move left"],
    ["↓", "Move down"],
    ["→", "Move right"],
  ])("the %s button has aria-label %j", (glyph, label) => {
    expect(jsx).toContain(`aria-label="${label}" className={optionClass} onClick={() => set({ ...s, stage: "code" })}>${glyph}</button>`);
  });
});
