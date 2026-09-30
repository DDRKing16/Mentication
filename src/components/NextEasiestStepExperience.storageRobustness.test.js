import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Next Easiest Step persists its ladder progress to localStorage on every
// change and restores it on open. Two ways that used to be able to crash
// the whole practice: writing with no try/catch (private browsing / a full
// storage quota throws synchronously), and trusting a restored "ladder"
// field to always be an array (a stale value from an older app version, or
// a hand-edited/corrupted entry, would throw the moment the screen calls
// .map or .length on it).
describe("Next Easiest Step's saved progress fails safely", () => {
  const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");

  it("wraps the localStorage write in try/catch", () => {
    expect(src).toMatch(
      /useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\("mentication_nes_v2_app_state", JSON\.stringify\(gameState\)\);\s*\} catch \{/
    );
  });

  it("falls back to an empty ladder when the restored value isn't an array", () => {
    expect(src).toMatch(/ladder: Array\.isArray\(parsed\.ladder\) \? parsed\.ladder : \[\]/);
  });
});
