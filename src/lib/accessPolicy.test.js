import { describe, expect, it } from "vitest";
import { APP_ACCESS_POLICY, hasJourneyAccess } from "./accessPolicy";

describe("free journey access", () => {
  it("opens journeys without a purchase or preview exemption", () => {
    expect(APP_ACCESS_POLICY.journeys).toBe("free");
    expect(hasJourneyAccess()).toBe(true);
    expect(hasJourneyAccess({ active: false, founderPreview: false })).toBe(true);
  });
  it("does not mutate subscription evidence", () => {
    for (const active of [false, true]) {
      const subscription = Object.freeze({ active, founderPreview: false });
      expect(hasJourneyAccess(subscription)).toBe(true);
      expect(subscription.active).toBe(active);
    }
  });
});
