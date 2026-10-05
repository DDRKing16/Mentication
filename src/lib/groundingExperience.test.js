import { describe, it, expect } from "vitest";
import { GROUNDING_ALTERNATIVES, GROUNDING_FEEDBACK, groundingProgress } from "./groundingExperience";

describe("Grounding pacing and feedback", () => {
  it("derives scene progress only from the supplied clock, including an extended hold", () => {
    expect(groundingProgress(6, 12)).toBe(0.5);
    expect(groundingProgress(-10, 12)).toBe(1);
    expect(groundingProgress(undefined, 12)).toBe(0);
    expect(groundingProgress(12, 12)).toBe(0);
  });
  it("offers a non-ingestion alternative for smell and taste and covers every sense", () => {
    expect(Object.keys(GROUNDING_ALTERNATIVES)).toEqual(["sight", "touch", "hearing", "smell", "taste"]);
    expect(GROUNDING_ALTERNATIVES.smell).toContain("do not need to find or inhale anything");
    expect(GROUNDING_ALTERNATIVES.taste).toContain("do not need to eat or drink anything");
  });
  it("offers an exit from sensory focus when it feels worse", () => {
    expect(GROUNDING_FEEDBACK.find((item) => item.value === "more_unsettled").next).toContain("Stop the sensory exercise");
  });
});
