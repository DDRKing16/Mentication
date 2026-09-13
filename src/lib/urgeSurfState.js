export const STANDARD_CHOICE_WINDOWS = Object.freeze([30, 35, 40, 45, 50, 55, 60]);

export const URGE_CATEGORY_KEYS = Object.freeze(["send", "check", "use", "snap", "avoid"]);
export const URGE_ACTION_KEYS = Object.freeze(["wait", "leave", "support", "substitute", "act"]);
export const URGE_CHOICE_OUTCOMES = Object.freeze(["yes", "a_little", "not_yet", "stronger", "need_support"]);

function permitted(value, values, fallback) {
  return values.includes(value) ? value : fallback;
}

function intensity(value) {
  return Number.isInteger(value) && value >= 0 && value <= 10 ? value : null;
}

export function normaliseChoiceWindow(value) {
  const seconds = Number(value);
  return STANDARD_CHOICE_WINDOWS.reduce((closest, candidate) => (
    Math.abs(candidate - seconds) < Math.abs(closest - seconds) ? candidate : closest
  ), STANDARD_CHOICE_WINDOWS[0]);
}

// Deliberately coarse local learning metadata. It cannot accept raw urge text,
// voice material, or body detail, even if an accidental caller passes it.
export function buildUrgeSurfLearningRecord({
  categoryKey,
  windowSeconds,
  intensityBefore,
  intensityNow,
  action,
  choiceOutcome,
} = {}) {
  return {
    category: permitted(categoryKey, URGE_CATEGORY_KEYS, "unspecified"),
    windowSeconds: normaliseChoiceWindow(windowSeconds),
    intensityBefore: intensity(intensityBefore),
    intensityNow: intensity(intensityNow),
    action: permitted(action, URGE_ACTION_KEYS, "wait"),
    choiceOutcome: permitted(choiceOutcome, URGE_CHOICE_OUTCOMES, "not_yet"),
  };
}
