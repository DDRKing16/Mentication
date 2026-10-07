import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A handful of free-text inputs across Thought or Fact, Next Easiest Step,
// Change the Scene and the Journal had only a placeholder for a name (which
// disappears once typing starts and isn't reliably read by screen readers),
// or a visible <label> that was never programmatically linked to its input
// via htmlFor/id. Each now has a real accessible name.
describe("free-text inputs have a real accessible name", () => {
  it("Thought or Fact's evidence entry field is labelled by its column title", () => {
    const src = readFileSync("src/components/ThoughtOrFactExperience.jsx", "utf8");
    expect(src).toMatch(/aria-label=\{title\}/);
  });

  it("Next Easiest Step's custom task field has a linked visible label", () => {
    const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");
    expect(src).toMatch(/htmlFor="nes-quick-task"/);
    expect(src).toMatch(/id="nes-quick-task"/);
  });

  it("Change the Scene's onward check-in controls have accessible names", () => {
    const src = readFileSync("src/pages/ChangeSceneFollowup.jsx", "utf8");
    for (const name of ["Current distress", "Current setting", "Time available now"]) {
      expect(src).toContain(`aria-label="${name}"`);
    }
  });

  it("Journal's custom-text fields are labelled, either directly or via a linked <label>", () => {
    const src = readFileSync("src/pages/Journal.jsx", "utf8");
    expect(src).toMatch(/aria-label="Secondary shades or thoughts"/);
    expect(src).toMatch(/aria-label="Custom day activity"/);
    for (const id of ["journal-sleep-duration", "journal-sleep-note", "journal-work-note", "journal-fuel-note", "journal-felt-good-note"]) {
      expect(src, `${id}: input id missing`).toMatch(new RegExp(`id="${id}"`));
      expect(src, `${id}: label htmlFor missing`).toMatch(new RegExp(`htmlFor="${id}"`));
    }
  });
});
