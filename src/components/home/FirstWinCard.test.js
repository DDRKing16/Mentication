import { describe, expect, it } from "vitest";
import { shouldShowFirstWin } from "./FirstWinCard.jsx";

describe("First reset card", () => {
  it("shows only to new people who haven't dismissed it", () => {
    expect(shouldShowFirstWin(0, false)).toBe(false);
    expect(shouldShowFirstWin(1, false)).toBe(true);
    expect(shouldShowFirstWin(3, false)).toBe(true);
    expect(shouldShowFirstWin(4, false)).toBe(false);
    expect(shouldShowFirstWin(1, true)).toBe(false);
  });

  it("stops once there's a real sign of rhythm, even within the first few sessions", () => {
    // The exact bug found in the 28 Sep audit: 2 sessions, a 2-day streak,
    // day 2 of a programme already under way — "your first reset" would be wrong.
    expect(shouldShowFirstWin(2, false, { streak: 2 })).toBe(false);
    expect(shouldShowFirstWin(2, false, { hasActiveProgramme: true })).toBe(false);
    expect(shouldShowFirstWin(2, false, { streak: 1, hasActiveProgramme: false })).toBe(true);
  });
});
