import { describe, expect, it } from "vitest";
import { buildUrgeSurfLearningRecord, normaliseChoiceWindow } from "./urgeSurfState.js";

describe("Urge Surfing state", () => {
  it("limits a Standard choice window to the approved 90 to 180 second values", () => {
    expect(normaliseChoiceWindow(12)).toBe(90);
    expect(normaliseChoiceWindow(120)).toBe(120);
    expect(normaliseChoiceWindow(240)).toBe(180);
  });

  it("keeps raw urge wording, voice material, and body detail out of coarse learning", () => {
    expect(buildUrgeSurfLearningRecord({
      categoryKey: "send",
      urgeText: "Send an angry message to Sam",
      voiceTranscript: "Send it now",
      bodyDetail: "My chest is tight",
      windowSeconds: 90,
      intensityBefore: 8,
      intensityNow: 5,
      action: "wait",
      choiceOutcome: "a_little",
    })).toEqual({
      category: "send",
      windowSeconds: 90,
      intensityBefore: 8,
      intensityNow: 5,
      action: "wait",
      choiceOutcome: "a_little",
    });
  });

  it("does not accept free-text categories or unapproved outcomes", () => {
    expect(buildUrgeSurfLearningRecord({ categoryKey: "message Sam", action: "anything", choiceOutcome: "better" })).toMatchObject({
      category: "unspecified",
      action: "wait",
      choiceOutcome: "not_yet",
    });
  });

  it("retains a reported amount of choice without requiring a lower intensity", () => {
    expect(buildUrgeSurfLearningRecord({
      categoryKey: "send", windowSeconds: 120, intensityBefore: 8, intensityNow: null, action: "leave", choiceOutcome: "a_little",
    })).toMatchObject({ intensityBefore: 8, intensityNow: null, action: "leave", choiceOutcome: "a_little" });
  });
});
