import { describe, expect, it } from "vitest";
import { SENSE_COMFORT, selectComfortIdea } from "@/components/HappyBumpExperience";

describe("Happy Bump sense comfort planner", () => {
  it("maps each sense to four practical comfort ideas", () => {
    expect(Object.keys(SENSE_COMFORT)).toEqual(["Sight", "Sound", "Touch", "Smell", "Taste"]);
    Object.values(SENSE_COMFORT).forEach(({ ideas }) => {
      expect(ideas).toHaveLength(4);
      expect(ideas.every((idea) => idea.length > 12)).toBe(true);
    });
  });

  it("records a selected comfort idea without replacing the activity or custom idea", () => {
    const state = { nextActivity: "Sit outside", customComfortIdea: "Use my soft blanket", comfortIdea: "" };
    expect(selectComfortIdea(state, SENSE_COMFORT.Touch.ideas[0])).toEqual({
      ...state,
      comfortIdea: "Wrap up in a soft layer or hold a warm mug",
    });
  });
});
