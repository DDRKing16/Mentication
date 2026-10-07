import { STANDARD_CHOICE_WINDOWS } from "./urgeSurfState.js";

export const URGE_SURF_DEFAULTS = Object.freeze({
  durationSeconds: 60,
  extensionSeconds: 600,
  durations: STANDARD_CHOICE_WINDOWS,
  bodyRegions: ["head_face", "throat_neck", "shoulders", "chest", "upper_abdomen", "lower_abdomen", "pelvis", "arms_hands", "legs_feet", "whole_body"],
});

const previousRoute = Object.freeze({
  "urge.voice": "urge.name",
  "urge.rating": "urge.name",
  "urge.body": "urge.rating",
  "urge.sensation": "urge.body",
  "urge.duration": "urge.anchor",
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
    entryMode: "guided",
    initialIntensity: null,
    postIntensity: null,
    categoryKeys: [],
    bodyRegionKey: null,
    environmentCueKey: null,
    sensationKeys: [],
    anchorText: "",
    choiceOutcome: null,
    helpfulness: null,
    completionRoute: null,
    savePreference: false,
    timer: { segmentIndex: 0, segmentDurationMs: URGE_SURF_DEFAULTS.durationSeconds * 1000, segmentStartedAtEpochMs: null, segmentEndsAtEpochMs: null, pausedRemainingMs: null, totalElapsedMs: 0, totalPlannedMs: 0, hapticsEnabled: false, completionReason: null },
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
const hasObservation = (state) => Boolean(state.environmentCueKey || (state.bodyRegionKey && state.sensationKeys.length));
const canStartTimer = (state) => Boolean(
  validIntensity(state.initialIntensity)
  && hasObservation(state)
);
const canNavigateTo = (state, route) => {
  if (state.currentRoute === "urge.rating" && route === "urge.body") return true;
  if (state.currentRoute === "urge.body" && route === "urge.sensation") return Boolean(state.bodyRegionKey);
  if (state.currentRoute === "urge.sensation" && route === "urge.anchor") return hasObservation(state);
  if (state.currentRoute === "urge.anchor" && route === "urge.duration") return hasObservation(state);
  if (state.currentRoute === "urge.name" && route === "urge.body") {
    return Boolean(validIntensity(state.initialIntensity));
  }
  if (state.currentRoute === "urge.body" && route === "urge.anchor") {
    return hasObservation(state);
  }
  return false;
};

export function reduceUrgeSession(session, event) {
  const state = session || createUrgeSession();
  const at = event.nowEpochMs || Date.now();
  const next = (patch) => ({ ...state, ...patch, updatedAtEpochMs: at });
  if (event.type === "SCREEN_RESTORED") {
    if(state.status === "draft" && ["urge.name","urge.rating","urge.body","urge.sensation","urge.anchor","urge.duration"].includes(event.route)) {
      // Private setup details are intentionally absent after refresh. Return to
      // the visible anchor question instead of showing a Start button with an invisible prerequisite.
      const needsObservation=["urge.anchor","urge.duration"].includes(event.route) && !hasObservation(state);
      const needsLocation=event.route === "urge.sensation" && !state.bodyRegionKey;
      return next({currentRoute:needsObservation || needsLocation ? "urge.body" : event.route});
    }
    if(state.status === "timer_complete" && ["urge.complete","urge.postRating","urge.choice","urge.feedback","urge.record","urge.takeaway"].includes(event.route))return next({currentRoute:event.route});
    // Back during a continuous practice pauses it; it never restarts or gives completion credit.
    if(state.status === "timer_active")return reduceUrgeSession(state,{type:"TIMER_PAUSED",nowEpochMs:at});
    return state;
  }
  if (event.type === "SETUP_OPENED" && state.status === "draft") return next({currentRoute:"urge.rating"});
  if (event.type === "OPTIONAL_ROUTE" && state.status === "timer_complete" && ["urge.complete","urge.postRating","urge.choice","urge.feedback","urge.record","urge.takeaway"].includes(event.route)) return next({currentRoute:event.route});
  if (event.type === "INITIAL_INTENSITY_SET") return next({ initialIntensity: validIntensity(event.value) ?? state.initialIntensity });
  if (event.type === "CATEGORY_TOGGLED") return next({ categoryKeys: state.categoryKeys.includes(event.key) ? [] : [event.key] });
  if (event.type === "BODY_REGION_SET") return next({ bodyRegionKey: event.key, environmentCueKey: null });
  if (event.type === "ENVIRONMENT_CUE_SET") return next({ environmentCueKey: event.key, bodyRegionKey: null, sensationKeys: [] });
  if (event.type === "SENSATION_TOGGLED") return next({ sensationKeys: state.sensationKeys.includes(event.key) ? [] : [event.key] });
  if (event.type === "ANCHOR_CHANGED") return next({ anchorText: String(event.value || "").slice(0, 120) });
  if (event.type === "HELPFULNESS_SELECTED") return next({ helpfulness: ["helpful", "same", "worse", "unsure"].includes(event.value) ? event.value : null });
  if (event.type === "SAVE_PREFERENCE_SET") return next({ savePreference: event.value === true });
  if (event.type === "VOICE_OPENED") return next({ currentRoute: "urge.voice" });
  if (event.type === "VOICE_CANCELLED") return next({ currentRoute: "urge.name" });
  if (event.type === "NAVIGATE") return canNavigateTo(state, event.route) ? next({ currentRoute: event.route }) : state;
  if (event.type === "NAVIGATE_BACK") {
    const previous = state.currentRoute === "urge.anchor" && state.bodyRegionKey ? "urge.sensation" : previousRoute[state.currentRoute];
    return previous ? next({ currentRoute: previous }) : state;
  }
  if (event.type === "DURATION_CHANGED") {
    if (state.status !== "draft") return state;
    const durationMs = validDuration(event.durationMs) ?? state.timer.segmentDurationMs;
    return next({ timer: { ...state.timer, segmentDurationMs: durationMs } });
  }
  if (event.type === "QUICK_PRACTICE_STARTED" || event.type === "TIMER_STARTED" || event.type === "GUIDED_PRACTICE_STARTED") {
    const quick = event.type === "QUICK_PRACTICE_STARTED";
    if (state.status !== "draft" || (quick ? state.currentRoute !== "urge.name" : event.type === "GUIDED_PRACTICE_STARTED" ? state.currentRoute !== "urge.duration" || !hasObservation(state) : !canStartTimer(state))) return state;
    const duration = state.timer.segmentDurationMs;
    return next({ status: "timer_active", currentRoute: "urge.timer", ...(quick ? {entryMode:"external", environmentCueKey:"external", bodyRegionKey:null, sensationKeys:[], anchorText:""} : {}), timer: { ...state.timer, totalPlannedMs: duration, segmentStartedAtEpochMs: at, segmentEndsAtEpochMs: at + duration, pausedRemainingMs: null, completionReason: null } });
  }
  if (event.type === "TIMER_PAUSED") {
    if (state.status !== "timer_active") return state;
    const pausedRemainingMs = Math.max(0, state.timer.segmentEndsAtEpochMs - at);
    return next({ status: "timer_paused", timer: { ...state.timer, segmentEndsAtEpochMs: null, pausedRemainingMs } });
  }
  if (event.type === "TIMER_RESUMED") {
    if (state.status !== "timer_paused") return state;
    const remainingMs = Math.max(0, state.timer.pausedRemainingMs ?? 0);
    return next({ status: "timer_active", timer: { ...state.timer, segmentEndsAtEpochMs: at + remainingMs, pausedRemainingMs: null } });
  }
  if (event.type === "TIMER_ELAPSED") {
    if (state.status !== "timer_active" || remainingSeconds(state, at) > 0) return state;
    return next({ status: "timer_complete", currentRoute: state.entryMode === "external" ? "urge.complete" : "urge.postRating", timer: { ...state.timer, totalElapsedMs: state.timer.totalElapsedMs + state.timer.segmentDurationMs, completionReason: "elapsed" } });
  }
  if (event.type === "TIMER_STOPPED") {
    if (state.status !== "timer_active" && state.status !== "timer_paused") return state;
    const remainingMs = state.status === "timer_paused"
      ? Math.max(0, state.timer.pausedRemainingMs ?? 0)
      : Math.max(0, state.timer.segmentEndsAtEpochMs - at);
    const elapsed = Math.min(state.timer.segmentDurationMs, state.timer.segmentDurationMs - remainingMs);
    return next({ status: "timer_complete", currentRoute: state.entryMode === "external" ? "urge.complete" : "urge.postRating", timer: { ...state.timer, totalElapsedMs: state.timer.totalElapsedMs + elapsed, completionReason: "stopped" } });
  }
  if (event.type === "POST_INTENSITY_SELECTED") return next({ postIntensity: validIntensity(event.value) });
  if (event.type === "POST_INTENSITY_SET") return next({ postIntensity: validIntensity(event.value), currentRoute: "urge.complete" });
  if (event.type === "CHOICE_OUTCOME_SELECTED") return next({ choiceOutcome: event.value || null });
  if (event.type === "POST_RATING_SKIPPED") return next({ postIntensity: null, choiceOutcome: null, currentRoute: "urge.complete" });
  if (event.type === "CHOICE_OUTCOME_SET") return next({ choiceOutcome: event.value || null, currentRoute: "urge.complete" });
  if (event.type === "COMPLETION_ROUTE_SELECTED") return next({ completionRoute: event.route, status: "completed" });
  if (event.type === "EXTEND_TIMER") {
    if (state.currentRoute !== "urge.complete" || state.status !== "timer_complete") return state;
    const duration = URGE_SURF_DEFAULTS.extensionSeconds * 1000;
    return next({ status: "timer_active", currentRoute: "urge.timer", postIntensity: null, choiceOutcome: null, helpfulness: null, timer: { ...state.timer, totalPlannedMs: state.timer.totalPlannedMs + duration, segmentIndex: state.timer.segmentIndex + 1, segmentDurationMs: duration, segmentStartedAtEpochMs: at, segmentEndsAtEpochMs: at + duration, pausedRemainingMs: null, completionReason: null } });
  }
  if (event.type === "REPEAT_WAVE") {
    // Rides the same wave again: same length as the one just finished,
    // fresh timer, back to the start of the animation, ready to rate again.
    if (state.currentRoute !== "urge.complete" || state.status !== "timer_complete") return state;
    const duration = state.timer.segmentDurationMs;
    return next({
      status: "timer_active",
      currentRoute: "urge.timer",
      postIntensity: null,
      choiceOutcome: null,
      helpfulness: null,
      timer: { ...state.timer, totalPlannedMs: state.timer.totalPlannedMs + duration, segmentIndex: state.timer.segmentIndex + 1, segmentDurationMs: duration, segmentStartedAtEpochMs: at, segmentEndsAtEpochMs: at + duration, pausedRemainingMs: null, completionReason: null },
    });
  }
  return state;
}

export function urgePracticeCompletion(session) {
  const planned = session.timer.totalPlannedMs;
  return {
    exitReason: session.timer.completionReason === "elapsed" ? "completed" : "stopped",
    completedPercentage: planned > 0 ? Math.min(1, Math.max(0, session.timer.totalElapsedMs / planned)) : 0,
  };
}

// Coarse position in the existing browser entry, not a saved return point.
// Never put anchor words, body locations, sensations or private text in history.
export function captureUrgeRuntime(session, sessionId, now = Date.now()) {
  if (!sessionId || !["urge.timer", "urge.postRating", "urge.complete", "urge.choice", "urge.feedback", "urge.record", "urge.takeaway"].includes(session.currentRoute)) return null;
  const paused = session.status === "timer_active" ? reduceUrgeSession(session, {type:"TIMER_PAUSED", nowEpochMs:now}) : session;
  const {segmentIndex, segmentDurationMs, pausedRemainingMs, totalElapsedMs, totalPlannedMs, completionReason} = paused.timer;
  return {
    version:1, sessionId, capturedAt:now, entryMode:paused.entryMode,
    status:paused.status, currentRoute:paused.currentRoute,
    initialIntensity:paused.initialIntensity, postIntensity:paused.postIntensity,
    choiceOutcome:paused.choiceOutcome, helpfulness:paused.helpfulness, savePreference:paused.savePreference,
    timer:{segmentIndex, segmentDurationMs, pausedRemainingMs, totalElapsedMs, totalPlannedMs, completionReason},
  };
}

export function restoreUrgeRuntime(raw, sessionId, now = Date.now()) {
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const bounded = (value, min, max) => finite(value) && value >= min && value <= max;
  if (!sessionId || raw?.version !== 1 || raw.sessionId !== sessionId || !bounded(raw.capturedAt,0,now) || now - raw.capturedAt > 86400000) return null;
  const timer = raw.timer;
  if (!["external", "guided"].includes(raw.entryMode) || !timer || !Number.isInteger(timer.segmentIndex) || !bounded(timer.segmentIndex,0,100)
    || ![...STANDARD_CHOICE_WINDOWS.map(s=>s*1000),600000].includes(timer.segmentDurationMs)
    || !bounded(timer.totalPlannedMs,timer.segmentDurationMs,86400000) || !bounded(timer.totalElapsedMs,0,timer.totalPlannedMs)) return null;
  const paused = raw.status === "timer_paused" && raw.currentRoute === "urge.timer" && bounded(timer.pausedRemainingMs,0,timer.segmentDurationMs) && timer.totalElapsedMs <= timer.totalPlannedMs - timer.segmentDurationMs && timer.completionReason === null;
  const complete = raw.status === "timer_complete" && ["urge.postRating", "urge.complete", "urge.choice", "urge.feedback", "urge.record", "urge.takeaway"].includes(raw.currentRoute) && ["elapsed","stopped"].includes(timer.completionReason);
  if (!paused && !complete) return null;
  const fresh = createUrgeSession(now);
  return {...fresh, status:raw.status, currentRoute:raw.currentRoute, entryMode:raw.entryMode,
    environmentCueKey:raw.entryMode === "external" ? "external" : null,
    initialIntensity:validIntensity(raw.initialIntensity), postIntensity:validIntensity(raw.postIntensity),
    choiceOutcome:["a_little","not_yet","stronger"].includes(raw.choiceOutcome) ? raw.choiceOutcome : null,
    helpfulness:["helpful","same","worse","unsure"].includes(raw.helpfulness) ? raw.helpfulness : null,
    savePreference:raw.savePreference === true,
    timer:{...fresh.timer,segmentIndex:timer.segmentIndex, segmentDurationMs:timer.segmentDurationMs,
      totalElapsedMs:timer.totalElapsedMs,totalPlannedMs:timer.totalPlannedMs,
      pausedRemainingMs:paused ? timer.pausedRemainingMs : null, completionReason:timer.completionReason},
  };
}
