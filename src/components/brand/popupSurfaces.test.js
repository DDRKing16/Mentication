import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Phase 6 of the brand thread: the Box/PMR/Grounding player's smaller popups
// (ambient sound, soundscape mixer, sleep timer) used to be hardcoded to one
// fixed dark teal colour no matter which intervention's world they floated
// over -- wrong on the light worlds. They now read their surface, text and
// accent colours from the same per-intervention theme tokens as the rest of
// the player. See docs/BRAND_THREAD.md phase 6.
describe("the player's popups use the per-intervention theme, not a fixed colour", () => {
  const files = {
    resetPlayer: readFileSync("src/components/ResetPlayer.jsx", "utf8"),
    soundscapeMixer: readFileSync("src/components/SoundscapeMixer.jsx", "utf8"),
    sleepTimerSheet: readFileSync("src/components/SleepTimerSheet.jsx", "utf8"),
  };

  it("never reintroduces the old fixed dark-teal popup colour", () => {
    for (const src of Object.values(files)) {
      expect(src).not.toMatch(/hsl\(178_36%_13%\)/);
    }
  });

  it("SoundscapeMixer and SleepTimerSheet surfaces pull from the intervention theme", () => {
    expect(files.soundscapeMixer).toMatch(/intervention-themed-surface/);
    expect(files.sleepTimerSheet).toMatch(/intervention-themed-surface/);
  });

  it("the ambient sound popup in the shared player pulls from the intervention theme", () => {
    expect(files.resetPlayer).toMatch(/showAmbient[\s\S]{0,400}intervention-themed-surface/);
  });

  // A popup animated with framer-motion cannot also rely on a CSS transform
  // class (e.g. -translate-x-1/2) for centring: framer-motion writes its own
  // `transform` inline style for the open/close motion, which silently wins
  // over the CSS class and leaves the popup's centring transform dropped --
  // in practice, rendering the popup off to one side, cut off by the screen
  // edge. Centring must come from a non-animated wrapper instead.
  it("centres popups with a wrapper, never a transform on the animated element itself", () => {
    expect(files.soundscapeMixer).not.toMatch(/-translate-x-1\/2/);
    expect(files.sleepTimerSheet).not.toMatch(/-translate-x-1\/2/);
    const ambientSection = files.resetPlayer.match(/showAmbient[\s\S]{0,600}/)?.[0] || "";
    expect(ambientSection).not.toMatch(/-translate-x-1\/2/);
  });
});
