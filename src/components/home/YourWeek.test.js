import { describe, expect, it } from "vitest";
import { summariseWeek, weekDays } from "./YourWeek.jsx";

// Wednesday 30 Sep 2026, 10:00 local.
const now = new Date(2026, 8, 30, 10, 0);
const at = (y, m, d, h = 9) => ({ created_date: new Date(y, m, d, h).toISOString() });

describe("Your week", () => {
  it("runs Monday to Sunday around today", () => {
    const days = weekDays(now);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
    expect(days[2].getDate()).toBe(30);
  });

  it("is kind when nothing has been done yet", () => {
    const week = summariseWeek([], now);
    expect(week.count).toBe(0);
    expect(week.line).toBe("Your week starts whenever you do.");
    expect(week.days[2].today).toBe(true);
  });

  it("lights up the days a practice was done and counts them once each", () => {
    const week = summariseWeek([at(2026, 8, 28), at(2026, 8, 28, 20), at(2026, 8, 30)], now);
    expect(week.days.map((d) => d.done)).toEqual([true, false, true, false, false, false, false]);
    expect(week.count).toBe(2);
  });

  it("celebrates a run of days", () => {
    const week = summariseWeek([at(2026, 8, 28), at(2026, 8, 29), at(2026, 8, 30)], now);
    expect(week.streak).toBe(3);
    expect(week.line).toBe("3 days in a row. Nice rhythm.");
  });

  it("marks days still to come", () => {
    const week = summariseWeek([], now);
    expect(week.days[3].future).toBe(true);
    expect(week.days[1].future).toBe(false);
  });
});
