import { describe, expect, it } from "vitest";
import { beliefRating, buildBalancedThought, buildThoughtOrFactLearningRecord, commitEvidenceDrafts, normaliseThoughtOrFactDraft } from "./thoughtOrFactState";

describe("Thought or Fact answered belief and evidence", () => {
  it.each([null, undefined, "", 5.5, -1, 11])("does not manufacture a belief rating from %s", (value) => {
    expect(beliefRating(value)).toBeNull();
    expect(buildThoughtOrFactLearningRecord({ certaintyBefore: value, certaintyAfter: 2 }).certaintyShift).toBeNull();
  });
  it.each([[0, 0, 0], [8, 8, 0], [4, 8, 4], [8, 2, -6], [8, null, null]])("preserves neutral, stronger, weaker and skipped outcomes", (certaintyBefore, certaintyAfter, shift) => {
    expect(buildThoughtOrFactLearningRecord({ certaintyBefore, certaintyAfter }).certaintyShift).toBe(shift);
  });
  it("drops legacy default/mood scores when restoring a draft", () => {
    expect(normaliseThoughtOrFactDraft({ certaintyBefore: 5, certaintyAfter: 5 })).toMatchObject({ certaintyBefore: null, certaintyAfter: null });
    expect(normaliseThoughtOrFactDraft({ beliefVersion: 2, certaintyBefore: 0, certaintyAfter: 10 })).toMatchObject({ certaintyBefore: 0, certaintyAfter: 10 });
  });
  it("commits both typed lanes atomically without needing Add, retaining previous entries", () => {
    expect(commitEvidenceDrafts({ support: ["The deadline passed"] }, { support: "  Due yesterday  ", against: "Outcome unknown" })).toEqual({ support: ["The deadline passed", "Due yesterday"], evidenceAgainst: ["Outcome unknown"] });
    expect(commitEvidenceDrafts({ support: ["a", "b", "c"] }, { support: "hidden fourth", against: " " })).toEqual({ support: ["a", "b", "c"], evidenceAgainst: [] });
  });
  it("retains mixed and uncertain fragment classifications across resume", () => {
    expect(normaliseThoughtOrFactDraft({ fragments: [{ id: "a", text: "The deadline passed; maybe it is too late" }, { id: "b", text: "I may be rejected" }], assignments: { a: "mixed", b: "not-sure" } }).assignments).toEqual({ a: "mixed", b: "not-sure" });
  });
  it("preserves difficult facts and unknowns rather than declaring a prediction false", () => {
    const result = buildBalancedThought({ thought: "The deadline passed. I may lose the opportunity.", facts: ["The deadline passed."], support: ["Applications closed yesterday."], evidenceAgainst: ["Late applications are sometimes considered."], alternatives: ["The decision is unknown."] });
    ["The deadline passed.", "Applications closed yesterday.", "Late applications are sometimes considered.", "The decision is unknown."].forEach((text) => expect(result).toContain(text));
    expect(result).not.toContain("will be fine");
  });
  it("does not leak private statements into learning records", () => {
    const record = buildThoughtOrFactLearningRecord({ thought: "PRIVATE", support: ["PRIVATE"], fairerView: { adaptive: "PRIVATE" }, assignments: { a: "mixed" }, certaintyBefore: null, certaintyAfter: 5 });
    expect(JSON.stringify(record)).not.toContain("PRIVATE");
    expect(record.certaintyShift).toBeNull();
  });
});
