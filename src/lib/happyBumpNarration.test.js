import { describe, expect, it } from "vitest";
import { HAPPY_BUMP_NARRATION } from "@/lib/happyBumpNarration";
import { getNarration } from "@/lib/narrationService";

describe("Happy Bump narration", () => {
  it("bundles a concise local narration clip for every meaningful scene", () => {
    const scenes = [
      "arrival", "baseline", "hydrate", "window", "environment", "move",
      "connection", "win", "mission", "proud", "grateful", "anticipate",
      "lifeArea", "areaAction", "nextMode", "nextPlan", "rerate", "reveal", "complete",
    ];
    expect(Object.keys(HAPPY_BUMP_NARRATION)).toEqual(scenes);
    Object.values(HAPPY_BUMP_NARRATION).forEach((line) => {
      expect(getNarration(line)?.url).toMatch(/^\/audio\/narration\/.+\.mp3$/);
    });
  });
});
