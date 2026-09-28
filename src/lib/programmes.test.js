import { describe, expect, it } from "vitest";
import { PROGRAMMES, getProgramme, launchStateFor, programmeProgress } from "./programmes.js";
import { getIntervention } from "./interventions.js";

const calm = getProgramme("calmer-seven");
const start = new Date(2026, 8, 28, 8, 0).toISOString(); // Mon 28 Sep, 8am
const at = (d, h, ...ids) => ({ created_date: new Date(2026, 8, d, h).toISOString(), pathway: ids, completed_pathway: ids });

describe("Programmes", () => {
  it("only uses exercises that exist", () => {
    PROGRAMMES.forEach((p) => p.days.forEach((day) => expect(getIntervention(day.id), `${p.id}:${day.id}`).toBeTruthy()));
  });

  it("starts on day 1, open today", () => {
    const p = programmeProgress(calm, [], start, new Date(2026, 8, 28, 9));
    expect(p.doneCount).toBe(0);
    expect(p.days[0].status).toBe("today");
    expect(p.days[1].status).toBe("later");
  });

  it("ticks off today's day when that exercise is finished", () => {
    const p = programmeProgress(calm, [at(28, 10, "boxV2")], start, new Date(2026, 8, 28, 11));
    expect(p.days[0].status).toBe("done");
    expect(p.days[1].status).toBe("tomorrow");
  });

  it("opens the next day the following calendar day", () => {
    const p = programmeProgress(calm, [at(28, 10, "boxV2")], start, new Date(2026, 8, 29, 7));
    expect(p.days[1].status).toBe("today");
  });

  it("does not let two practices on the same day count as two days", () => {
    const p = programmeProgress(calm, [at(28, 10, "boxV2"), at(28, 12, "grounding54321V2")], start, new Date(2026, 8, 28, 13));
    expect(p.doneCount).toBe(1);
  });

  it("ignores practices from before the programme started", () => {
    const p = programmeProgress(calm, [at(27, 10, "boxV2")], start, new Date(2026, 8, 28, 13));
    expect(p.doneCount).toBe(0);
  });

  it("ignores a different exercise than today's", () => {
    const p = programmeProgress(calm, [at(28, 10, "happyBump")], start, new Date(2026, 8, 28, 13));
    expect(p.doneCount).toBe(0);
  });

  it("finishes after every day is done", () => {
    const sessions = calm.days.map((day, i) => at(28 + i, 10, day.id));
    const p = programmeProgress(calm, sessions, start, new Date(2026, 9, 6, 12));
    expect(p.finished).toBe(true);
    expect(p.doneCount).toBe(7);
  });

  it("opens each exercise the same way the Library does", () => {
    expect(launchStateFor("boxV2")).toMatchObject({ prebuilt: true, pathway: ["boxV2"], directionLabel: "Box Breathing" });
  });
});
