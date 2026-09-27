import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The Box/PMR/Grounding player's floating popups (ambient sound, soundscape
// mixer, sleep timer, "this isn't helping" switch sheet) have no backdrop
// dimming the rest of the screen behind three of them, so a keyboard or
// screen-reader user has no obvious way out except the mouse. Each one now
// carries dialog/menu semantics, an accessible name, and closes on Escape.
describe("the player's popups are reachable without a mouse", () => {
  const files = {
    resetPlayer: readFileSync("src/components/ResetPlayer.jsx", "utf8"),
    soundscapeMixer: readFileSync("src/components/SoundscapeMixer.jsx", "utf8"),
    sleepTimerSheet: readFileSync("src/components/SleepTimerSheet.jsx", "utf8"),
  };

  it("SleepTimerSheet and SoundscapeMixer are announced as dialogs with a name", () => {
    expect(files.sleepTimerSheet).toMatch(/role="dialog"/);
    expect(files.sleepTimerSheet).toMatch(/aria-modal="true"/);
    expect(files.soundscapeMixer).toMatch(/role="dialog"/);
    expect(files.soundscapeMixer).toMatch(/aria-modal="true"/);
  });

  it("the ambient popover and switch sheet in the shared player carry semantics too", () => {
    expect(files.resetPlayer).toMatch(/showAmbient[\s\S]{0,400}role="menu"/);
    expect(files.resetPlayer).toMatch(/role="dialog"[\s\S]{0,200}reset-switch-sheet-title/);
  });

  it("every popup closes on Escape, not only by tapping its own close control", () => {
    for (const src of Object.values(files)) {
      expect(src).toMatch(/useEscapeToClose/);
    }
  });

  it("SoundscapeMixer's per-layer controls name the layer, not just 'layer'", () => {
    expect(files.soundscapeMixer).not.toMatch(/aria-label=\{on \? "Mute layer" : "Enable layer"\}/);
    expect(files.soundscapeMixer).toMatch(/aria-label=\{on \? `Mute \$\{l\.label\}` : `Enable \$\{l\.label\}`\}/);
    expect(files.soundscapeMixer).toMatch(/aria-label=\{`\$\{l\.label\} volume`\}/);
  });
});
