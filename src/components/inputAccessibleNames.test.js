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
    expect(src).toMatch(/<input aria-label=\{title\}/);
  });

  it("Next Easiest Step's custom task field has an aria-label", () => {
    const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");
    expect(src).toMatch(/aria-label="What you are stuck on"/);
  });

  it("Change the Scene's two custom-activity fields have an aria-label", () => {
    const src = readFileSync("src/components/ChangeSceneExperience.jsx", "utf8");
    expect(src.match(/aria-label="Custom shift activity"/g)?.length).toBe(2);
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
