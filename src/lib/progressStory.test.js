import { describe, expect, it } from "vitest";
import { ratedShift, summariseProgress } from "./progressStory.js";

const now = new Date(2026, 8, 28, 12);
const s = (daysAgo, hour, id, start, end, direction = "calm") => {
  const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(hour);
  return { created_date: d.toISOString(), pathway: [id], completed_pathway: [id], intensity_start: start, intensity_end: end, direction };
};

describe("Your progress story", () => {
  it("counts lower-after as better, except for lift", () => {
    expect(ratedShift({ intensity_start: 7, intensity_end: 4, direction: "calm" })).toBe(3);
    expect(ratedShift({ intensity_start: 3, intensity_end: 6, direction: "lift" })).toBe(3);
    expect(ratedShift({ intensity_start: 7, direction: "calm" })).toBe(null);
  });

  it("says nothing about average change until there are a few rated sessions", () => {
    expect(summariseProgress([s(1, 9, "boxV2", 7, 4)], now).avgShift).toBe(null);
    expect(summariseProgress([s(1, 9, "boxV2", 7, 4), s(2, 9, "boxV2", 6, 4), s(3, 9, "boxV2", 8, 5)], now).avgShift).toBe(2.7);
  });

  it("names what helps most, in plain names", () => {
    const story = summariseProgress([
      s(1, 9, "boxV2", 8, 4), s(2, 9, "boxV2", 7, 4),
      s(3, 9, "factCheck", 6, 5), s(4, 9, "factCheck", 6, 5),
    ], now);
    expect(story.helpers[0]).toMatchObject({ name: "Box Breathing", uses: 2, avgShift: 3.5 });
    expect(story.helpers[1].name).toBe("Thought or Fact?");
  });

  it("shows six weeks of rhythm ending this week", () => {
    const story = summariseProgress([s(0, 9, "boxV2", 5, 4), s(7, 9, "boxV2", 5, 4)], now);
    expect(story.weeks).toHaveLength(6);
    expect(story.weeks[5]).toMatchObject({ label: "This week", count: 1 });
    expect(story.weeks[4].count).toBe(1);
  });

  it("only suggests a best time of day when there's enough to say", () => {
    const few = summariseProgress([s(1, 8, "boxV2", 7, 3), s(2, 20, "boxV2", 7, 6)], now);
    expect(few.bestTime).toBe(null);
    const enough = summariseProgress([s(1, 8, "boxV2", 7, 3), s(2, 8, "boxV2", 7, 3), s(3, 20, "boxV2", 7, 6), s(4, 20, "boxV2", 7, 6)], now);
    expect(enough.bestTime).toMatchObject({ slot: "in the morning" });
  });
});

it('never counts selected or explicitly skipped pathways as finished practice', () => {
  const skipped={...s(0,9,'happyBump',5,8,'lift'),completed_pathway:[],attempts:[{intervention_id:'happyBump',exit_reason:'skipped',completed_percentage:0}]};
  expect(summariseProgress([skipped],now)).toMatchObject({total:0,helpers:[],avgShift:null});
});
it('rejects omitted, malformed and unmatched ratings without turning them into improvement', () => {
  for (const end of [null,undefined,'0',false,-1,11]) expect(ratedShift({direction:'calm',intensity_start:8,intensity_end:end})).toBeNull();
  expect(ratedShift({direction:'calm',intensity_start:8,intensity_end:0,goal_baseline:null})).toBeNull();
  expect(ratedShift({direction:'lift',intensity_start:5,intensity_end:0})).toBe(-5);
});

describe('positive evidence for help claims', () => {
  it.each([[null,null],[0,0],[5,0]])('does not call missing, unchanged or worse Lift ratings helpful (%s → %s)', (start,end) => {
    const story=summariseProgress([s(1,9,'happyBump',start,end,'lift'),s(2,9,'happyBump',start,end,'lift')],now);
    expect(story.helpers).toEqual([]);
  });
  it('requires two actual ratings and averages mixed results without ignoring worse ratings', () => {
    const story=summariseProgress([
      s(1,9,'boxV2',8,4),s(2,9,'boxV2',4,6),s(3,9,'boxV2',8,null),
      s(1,9,'happyBump',5,8,'lift'),s(2,9,'happyBump',5,0,'lift'),
      s(1,9,'factCheck',8,0),s(2,9,'factCheck',8,null),
      s(1,9,'grounding54321V2',0,0),s(2,9,'grounding54321V2',0,0),
    ],now);
    expect(story.helpers).toHaveLength(1);
    expect(story.helpers[0]).toMatchObject({id:'boxV2',avgShift:1,uses:3,ratedUses:2});
  });
  it.each([[0,0],[0,1]])('does not call the least-negative or unchanged time of day helpful', (start,end) => {
    const story=summariseProgress([s(1,8,'boxV2',start,end),s(2,8,'boxV2',start,end),s(3,20,'boxV2',0,3),s(4,20,'boxV2',0,3)],now);
    expect(story.bestTime).toBeNull();
  });
});
