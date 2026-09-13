import { describe, expect, it } from "vitest";
import { SENSE_COMFORT } from "@/components/HappyBumpExperience";

describe("Happy Bump sense comfort planner", () => {
  it("maps each sense to four practical comfort ideas", () => {
    expect(Object.keys(SENSE_COMFORT)).toEqual(["Sight", "Sound", "Touch", "Smell", "Taste"]);
    Object.values(SENSE_COMFORT).forEach(({ ideas }) => {
      expect(ideas).toHaveLength(4);
      expect(ideas.every((idea) => idea.length > 12)).toBe(true);
    });
  });
});
