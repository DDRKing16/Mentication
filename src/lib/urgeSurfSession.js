import { STANDARD_CHOICE_WINDOWS } from "./urgeSurfState.js";

export const URGE_SURF_DEFAULTS = Object.freeze({
  durationSeconds: 90,
  extensionSeconds: 600,
  durations: STANDARD_CHOICE_WINDOWS,
  bodyRegions: ["head_face", "throat_neck", "shoulders", "chest", "upper_abdomen", "lower_abdomen", "pelvis", "arms_hands", "legs_feet", "whole_body"],
});

const previousRoute = Object.freeze({
  "urge.voice": "urge.name",
  "urge.body": "urge.name",
  "urge.anchor": "urge.body",
  "urge.postRating": "urge.timer",
  "urge.complete": "urge.postRating",
});

export function createUrgeSession(nowEpochMs = Date.now()) {
  return {
    schemaVersion: 3,
    startedAtEpochMs: nowEpochMs,
    updatedAtEpochMs: nowEpochMs,
    status: "draft",
    currentRoute: "urge.name",
    initialIntensity: null,
    postIntensity: null,
    categoryKeys: [],
    bodyRegionKey: null,
    environmentCueKey: null,
    sensationKeys: [],
    anchorText: "",
    choiceOutcome: null,
    completionRoute: null,
    savePreference: false,
    timer: { segmentIndex: 0, segmentDurationMs: URGE_SURF_DEFAULTS.durationSeconds * 1000, segmentStartedAtEpochMs: null, segmentEndsAtEpochMs: null, totalElapsedMs: 0, hapticsEnabled: false, completionReason: null },
  };
}

export function remainingSeconds(session, nowEpochMs = Date.now()) {
  const endsAt = session?.timer?.segmentEndsAtEpochMs;
  return endsAt ? Math.max(0, Math.ceil((endsAt - nowEpochMs) / 1000)) : 0;
}

const validIntensity = (value) => Number.isInteger(value) && value >= 1 && value <= 10 ? value : null;
const validDuration = (value) => {
  const requested = Number(value);
  if (!Number.isFinite(requested)) return null;
  return URGE_SURF_DEFAULTS.durations.reduce((closest, seconds) => (
    Math.abs(seconds * 1000 - requested) < Math.abs(closest * 1000 - requested) ? seconds : closest
  ), URGE_SURF_DEFAULTS.durations[0]) * 1000;
};
const canStartTimer = (state) => Boolean(
  validIntensity(state.initialIntensity)
  && state.categoryKeys.length
  && (state.bodyRegionKey || state.environmentCueKey)
  && state.sensationKeys.length
  && state.anchorText.trim()
);
const canNavigateTo = (state, route) => {
  if (state.currentRoute === "urge.name" && route === "urge.body") {
    return Boolean(validIntensity(state.initialIntensity) && state.categoryKeys.length);
  }
  if (state.currentRoute === "urge.body" && route === "urge.anchor") {
    return Boolean((state.bodyRegionKey || state.environmentCueKey) && state.sensationKeys.length);
  }
  return false;
};

export function reduceUrgeSession(session, event) {
  const state = session || createUrgeSession();
  const at = event.nowEpochMs || Date.now();
  const next = (patch) => ({ ...state, ...patch, updatedAtEpochMs: at });
  if (event.type === "INITIAL_INTENSITY_SET") return next({ initialIntensity: validIntensity(event.value) ?? state.initialIntensity });
  if (event.type === "CATEGORY_TOGGLED") return next({ categoryKeys: state.categoryKeys.includes(event.key) ? [] : [event.key] });
  if (event.type === "BODY_REGION_SET") return next({ bodyRegionKey: event.key, environmentCueKey: null });
  if (event.type === "ENVIRONMENT_CUE_SET") return next({ environmentCueKey: event.key, bodyRegionKey: null });
  if (event.type === "SENSATION_TOGGLED") return next({ sensationKeys: state.sensationKeys.includes(event.key) ? [] : [event.key] });
  if (event.type === "ANCHOR_CHANGED") return next({ anchorText: String(event.value || "").slice(0, 120) });
  if (event.type === "SAVE_PREFERENCE_SET") return next({ savePreference: event.value === true });
  if (event.type === "VOICE_OPENED") return next({ currentRoute: "urge.voice" });
  if (event.type === "VOICE_CANCELLED") return next({ currentRoute: "urge.name" });
  if (event.type === "NAVIGATE") return canNavigateTo(state, event.route) ? next({ currentRoute: event.route }) : state;
  if (event.type === "NAVIGATE_BACK") {
    const previous = previousRoute[state.currentRoute];
    return previous ? next({ currentRoute: previous }) : state;
  }
  if (event.type === "DURATION_CHANGED") {
    const durationMs = validDuration(event.durationMs) ?? state.timer.segmentDurationMs;
    return next({ timer: { ...state.timer, segmentDurationMs: durationMs } });
  }
  if (event.type === "TIMER_STARTED") {
    if (!canStartTimer(state)) return state;
    const duration = state.timer.segmentDurationMs;
    return next({ status: "timer_active", currentRoute: "urge.timer", timer: { ...state.timer, segmentStartedAtEpochMs: at, segmentEndsAtEpochMs: at + duration, completionReason: null } });
  }
  if (event.type === "TIMER_ELAPSED") {
    if (state.status !== "timer_active" || remainingSeconds(state, at) > 0) return state;
    return next({ status: "timer_complete", currentRoute: "urge.postRating", timer: { ...state.timer, totalElapsedMs: state.timer.totalElapsedMs + state.timer.segmentDurationMs, completionReason: "elapsed" } });
  }
  if (event.type === "TIMER_STOPPED") {
    if (state.status !== "timer_active") return state;
    const elapsed = Math.min(state.timer.segmentDurationMs, Math.max(0, at - state.timer.segmentStartedAtEpochMs));
    return next({ status: "timer_complete", currentRoute: "urge.postRating", timer: { ...state.timer, totalElapsedMs: state.timer.totalElapsedMs + elapsed, completionReason: "stopped" } });
  }
  if (event.type === "POST_INTENSITY_SELECTED") return next({ postIntensity: validIntensity(event.value) });
  if (event.type === "POST_INTENSITY_SET") return next({ postIntensity: validIntensity(event.value), currentRoute: "urge.complete" });
  if (event.type === "CHOICE_OUTCOME_SET") return next({ choiceOutcome: event.value || null, currentRoute: "urge.complete" });
  if (event.type === "COMPLETION_ROUTE_SELECTED") return next({ completionRoute: event.route, status: "completed" });
  if (event.type === "EXTEND_TIMER") {
    if (state.currentRoute !== "urge.complete" || state.status !== "timer_complete") return state;
    const duration = URGE_SURF_DEFAULTS.extensionSeconds * 1000;
    return next({ status: "timer_active", currentRoute: "urge.timer", timer: { ...state.timer, segmentIndex: state.timer.segmentIndex + 1, segmentDurationMs: duration, segmentStartedAtEpochMs: at, segmentEndsAtEpochMs: at + duration, completionReason: null } });
  }
  return state;
}
