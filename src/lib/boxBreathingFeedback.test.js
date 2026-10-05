import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withAttemptHelpfulness } from "./attemptFeedback";
import { computeEffectiveness } from "./interventions";

describe("Box explicit helpfulness learning", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-05T00:00:00Z")); });
  afterEach(() => vi.useRealTimers());
  const session = (attempt) => ({ created_date: new Date().toISOString(), direction: "calm", attempts: [attempt] });
  const attempt = (response = "not_answered") => ({ intervention_id: "boxV2", mechanism: "paced-hold", response, completed_percentage: 1, exit_reason: "completed" });

  it.each([["helpful", "better"], ["same", "same"], ["worse", "worse"]])("uses %s exactly as one response despite a conflicting measured response", (answer, response) => {
    const explicit = withAttemptHelpfulness(attempt(response === "better" ? "worse" : "better"), answer);
    const learned = computeEffectiveness([session(explicit)]);
    const singleSample = computeEffectiveness([session(attempt(response))]);
    expect(explicit.helpfulness_response).toBe(response);
    expect(learned.boxV2).toBe(singleSample.boxV2);
    expect(learned.totalUses).toBe(1);
    expect(learned.usageCount.boxV2).toBe(1);
  });

  it.each([undefined, "unsure"])("does not invent evidence for %s when the goal rating is skipped", (answer) => {
    const result = withAttemptHelpfulness(attempt(), answer);
    expect(result.response).toBe("not_answered");
    expect(result.helpfulness_response).toBeUndefined();
    expect(computeEffectiveness([session(result)]).boxV2).toBe(0.5);
  });
});
