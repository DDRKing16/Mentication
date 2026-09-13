import { describe, expect, it } from "vitest";
import { createUrgeSession, reduceUrgeSession, remainingSeconds, URGE_SURF_DEFAULTS } from "./urgeSurfSession.js";

function readySession() {
  return [
    { type: "INITIAL_INTENSITY_SET", value: 8 },
    { type: "BODY_REGION_SET", key: "chest" },
    { type: "SENSATION_TOGGLED", key: "tight" },
    { type: "ANCHOR_CHANGED", value: "Tomorrow morning" },
  ].reduce((state, event) => reduceUrgeSession(state, event), createUrgeSession());
}

describe("Urge Surfing session", () => {
  it("starts directly at Name the wave without collecting any urge details", () => {
    const session = createUrgeSession(1_000);
    expect(session).toMatchObject({
      schemaVersion: 3,
      status: "draft",
      currentRoute: "urge.name",
      savePreference: false,
      timer: { segmentDurationMs: 60_000 },
    });
    expect(URGE_SURF_DEFAULTS.durations).toEqual([30, 35, 40, 45, 50, 55, 60]);
    expect(session).not.toHaveProperty("voiceTranscript");
    expect(session).not.toHaveProperty("audioReference");
  });

  it("does not allow navigation or a timer to bypass the required intensity", () => {
    const empty = createUrgeSession();
    expect(reduceUrgeSession(empty, { type: "NAVIGATE", route: "urge.body" })).toEqual(empty);
    expect(reduceUrgeSession(empty, { type: "TIMER_STARTED", nowEpochMs: 10 })).toEqual(empty);
  });

  it("allows Continue from Name the wave after setting intensity", () => {
    const named = reduceUrgeSession(createUrgeSession(), { type: "INITIAL_INTENSITY_SET", value: 8 });
    expect(reduceUrgeSession(named, { type: "NAVIGATE", route: "urge.body" })).toMatchObject({
      currentRoute: "urge.body",
      initialIntensity: 8,
      categoryKeys: [],
    });
  });

  it("uses an end timestamp so a restored timer does not drift", () => {
    const started = reduceUrgeSession(readySession(), { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    expect(remainingSeconds(started, 31_001)).toBe(30);
    expect(remainingSeconds(started, 61_001)).toBe(0);
  });

  it("moves to post-rating once when the timer elapses", () => {
    const active = reduceUrgeSession(readySession(), { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    const elapsed = reduceUrgeSession(active, { type: "TIMER_ELAPSED", nowEpochMs: 61_000 });
    expect(elapsed.currentRoute).toBe("urge.postRating");
    expect(reduceUrgeSession(elapsed, { type: "TIMER_ELAPSED", nowEpochMs: 100_000 })).toEqual(elapsed);
  });

  it("preserves the remaining choice window while paused", () => {
    const started = reduceUrgeSession(readySession(), { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    const paused = reduceUrgeSession(started, { type: "TIMER_PAUSED", nowEpochMs: 21_000 });
    expect(paused).toMatchObject({
      status: "timer_paused",
      timer: { segmentEndsAtEpochMs: null, pausedRemainingMs: 40_000 },
    });
    expect(reduceUrgeSession(paused, { type: "TIMER_ELAPSED", nowEpochMs: 90_000 })).toEqual(paused);

    const resumed = reduceUrgeSession(paused, { type: "TIMER_RESUMED", nowEpochMs: 100_000 });
    expect(resumed).toMatchObject({
      status: "timer_active",
      timer: { segmentEndsAtEpochMs: 140_000, pausedRemainingMs: null },
    });
    expect(remainingSeconds(resumed, 100_000)).toBe(40);
  });

  it("records only active elapsed time when stopped from pause", () => {
    const started = reduceUrgeSession(readySession(), { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    const paused = reduceUrgeSession(started, { type: "TIMER_PAUSED", nowEpochMs: 21_000 });
    const stopped = reduceUrgeSession(paused, { type: "TIMER_STOPPED", nowEpochMs: 90_000 });
    expect(stopped).toMatchObject({
      status: "timer_complete",
      currentRoute: "urge.postRating",
      timer: { totalElapsedMs: 20_000, completionReason: "stopped" },
    });
  });

  it("can stop an active window without discarding the elapsed time", () => {
    const active = reduceUrgeSession(readySession(), { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    const stopped = reduceUrgeSession(active, { type: "TIMER_STOPPED", nowEpochMs: 31_000 });
    expect(stopped).toMatchObject({ currentRoute: "urge.postRating", status: "timer_complete", timer: { totalElapsedMs: 30_000, completionReason: "stopped" } });
  });

  it("keeps a skipped post-rating null instead of manufacturing a score", () => {
    const session = reduceUrgeSession(readySession(), { type: "POST_INTENSITY_SET", value: null });
    expect(session.postIntensity).toBeNull();
    expect(session.currentRoute).toBe("urge.complete");
  });

  it("allows a choice outcome or an explicit skip without treating intensity as the outcome", () => {
    const observedChoice = reduceUrgeSession(readySession(), { type: "CHOICE_OUTCOME_SET", value: "a_little" });
    const skipped = reduceUrgeSession(readySession(), { type: "CHOICE_OUTCOME_SET", value: null });
    expect(observedChoice).toMatchObject({ currentRoute: "urge.complete", choiceOutcome: "a_little", postIntensity: null });
    expect(skipped).toMatchObject({ currentRoute: "urge.complete", choiceOutcome: null, postIntensity: null });
  });

  it("uses only the exported 30 to 60 second choice-window options", () => {
    const atMinimum = reduceUrgeSession(readySession(), { type: "DURATION_CHANGED", durationMs: 2_000, nowEpochMs: 10 });
    const atMaximum = reduceUrgeSession(readySession(), { type: "DURATION_CHANGED", durationMs: 999_000, nowEpochMs: 20 });
    const middle = reduceUrgeSession(readySession(), { type: "DURATION_CHANGED", durationMs: 47_000, nowEpochMs: 15 });
    expect(atMinimum.timer.segmentDurationMs).toBe(30_000);
    expect(middle.timer.segmentDurationMs).toBe(45_000);
    expect(atMaximum.timer.segmentDurationMs).toBe(60_000);
  });

  it("keeps one selected urge category while preserving the stable key", () => {
    const first = reduceUrgeSession(createUrgeSession(), { type: "CATEGORY_TOGGLED", key: "send", nowEpochMs: 10 });
    const second = reduceUrgeSession(first, { type: "CATEGORY_TOGGLED", key: "check", nowEpochMs: 20 });
    expect(second.categoryKeys).toEqual(["check"]);
  });

  it("uses one body or environment selection, never both", () => {
    const body = reduceUrgeSession(readySession(), { type: "BODY_REGION_SET", key: "chest" });
    const environment = reduceUrgeSession(body, { type: "ENVIRONMENT_CUE_SET", key: "phone" });
    expect(environment).toMatchObject({ bodyRegionKey: null, environmentCueKey: "phone" });
  });

  it("keeps one sensation selected at a time", () => {
    const first = reduceUrgeSession(readySession(), { type: "SENSATION_TOGGLED", key: "tight" });
    const second = reduceUrgeSession(first, { type: "SENSATION_TOGGLED", key: "buzzing" });
    expect(second.sensationKeys).toEqual(["buzzing"]);
  });

  it("requires a body/environment and sensation before continuing to the anchor", () => {
    const named = [
      { type: "INITIAL_INTENSITY_SET", value: 8 },
      { type: "NAVIGATE", route: "urge.body" },
    ].reduce((state, event) => reduceUrgeSession(state, event), createUrgeSession());
    expect(reduceUrgeSession(named, { type: "NAVIGATE", route: "urge.anchor" })).toEqual(named);
    const complete = reduceUrgeSession(
      reduceUrgeSession(named, { type: "BODY_REGION_SET", key: "chest" }),
      { type: "SENSATION_TOGGLED", key: "tight" },
    );
    const anchored = reduceUrgeSession(complete, { type: "NAVIGATE", route: "urge.anchor" });
    expect(anchored.currentRoute).toBe("urge.anchor");
    expect(reduceUrgeSession(anchored, { type: "NAVIGATE_BACK" })).toMatchObject({
      currentRoute: "urge.body", bodyRegionKey: "chest", sensationKeys: ["tight"],
    });
  });

  it("allows the choice window to start without an anchor", () => {
    const withoutAnchor = [
      { type: "INITIAL_INTENSITY_SET", value: 8 },
      { type: "BODY_REGION_SET", key: "chest" },
      { type: "SENSATION_TOGGLED", key: "tight" },
    ].reduce((state, event) => reduceUrgeSession(state, event), createUrgeSession());
    const started = reduceUrgeSession(withoutAnchor, { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    expect(started).toMatchObject({ status: "timer_active", currentRoute: "urge.timer" });
  });

  it("allows one explicit local save preference without saving a draft", () => {
    const saved = reduceUrgeSession(readySession(), { type: "SAVE_PREFERENCE_SET", value: true });
    expect(saved.savePreference).toBe(true);
  });

  it("creates exactly one ten-minute extension after completion", () => {
    const started = reduceUrgeSession(readySession(), { type: "TIMER_STARTED", nowEpochMs: 1_000 });
    const rated = reduceUrgeSession(started, { type: "TIMER_ELAPSED", nowEpochMs: 61_000 });
    const complete = reduceUrgeSession(rated, { type: "POST_INTENSITY_SET", value: 5, nowEpochMs: 61_500 });
    const extended = reduceUrgeSession(complete, { type: "EXTEND_TIMER", nowEpochMs: 62_000 });
    expect(extended.timer.segmentDurationMs).toBe(600_000);
    expect(reduceUrgeSession(extended, { type: "EXTEND_TIMER", nowEpochMs: 93_000 })).toEqual(extended);
  });
});
