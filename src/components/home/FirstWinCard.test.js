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
});
