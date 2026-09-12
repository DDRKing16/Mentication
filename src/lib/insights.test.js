import { describe, expect, it, vi } from "vitest";
import { buildMomentumSummary } from "./insights";

describe("buildMomentumSummary", () => {
  it("builds streak, weekly cadence and best direction from session history", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-12T12:00:00.000Z"));

    const summary = buildMomentumSummary([
      { created_date: "2026-09-12T08:00:00.000Z", direction: "calm", intensity_start: 7, intensity_end: 3 },
      { created_date: "2026-09-11T08:00:00.000Z", direction: "calm", intensity_start: 8, intensity_end: 5 },
      { created_date: "2026-09-10T08:00:00.000Z", direction: "focus", intensity_start: 6, intensity_end: 4 },
      { created_date: "2026-09-02T08:00:00.000Z", direction: "lift", intensity_start: 2, intensity_end: 5 },
    ]);

    expect(summary).toEqual({
      totalSessions: 4,
      thisWeek: 3,
      streakDays: 3,
      averageShift: 3,
      bestDirection: "calm",
      weeklyGoal: 3,
      sessionsToGoal: 0,
    });

    vi.useRealTimers();
  });

  it("returns zeroed momentum when there is no usable history", () => {
    expect(buildMomentumSummary()).toEqual({
      totalSessions: 0,
      thisWeek: 0,
      streakDays: 0,
      averageShift: 0,
      bestDirection: null,
      weeklyGoal: 3,
      sessionsToGoal: 3,
    });
  });

  it("includes a session exactly seven days old in the weekly count", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-12T12:00:00.000Z"));

    const summary = buildMomentumSummary([
      { created_date: "2026-09-05T12:00:00.000Z", direction: "calm", intensity_start: 5, intensity_end: 3 },
    ]);

    expect(summary.thisWeek).toBe(1);

    vi.useRealTimers();
  });
});
