export const INTENSITY_QUESTION = Object.freeze({
  title: "How intense is it right now?",
  description: "There’s no wrong number. Just an honest first read.",
});

export const REMAINING_STATE_OPTIONS = Object.freeze([
  { id: "thoughts", label: "Racing thoughts", direction: "reset", whereFelt: "thoughts" },
  { id: "body", label: "Tense body", direction: "calm", whereFelt: "body" },
  { id: "low", label: "Low / flat", direction: "lift", whereFelt: "both" },
  { id: "focus", label: "Can’t focus", direction: "focus", whereFelt: "thoughts" },
  { id: "wired", label: "Wired / wakeful", direction: "sleep", whereFelt: "body" },
  { id: "none", label: "Nothing — I’m good", direction: null, whereFelt: null },
]);

export const REMAINING_STATE_BY_ID = Object.freeze(
  Object.fromEntries(
    REMAINING_STATE_OPTIONS.map(({ id, direction, whereFelt }) => [id, { direction, whereFelt }]),
  ),
);

export const UNSURE_FIRST_STEP = Object.freeze({
  title: "Let’s find your direction",
  description: "No idea needed — just pick what’s closest.",
  options: [
    { label: "Too high", description: "Wound up, racing", branch: "high" },
    { label: "Too low", description: "Flat, heavy", branch: "low" },
    { label: "Stuck", description: "Neither — just stuck", branch: "stuck" },
  ],
});

const UNSURE_SECOND_STEPS = Object.freeze({
  high: {
    title: "Where is it loudest?",
    description: "One more and we’ll begin.",
    options: [
      { label: "In my body", description: "Tense, racing heart", direction: "calm", directionLabel: "Calm down" },
      { label: "In my thoughts", description: "Can’t switch off", direction: "reset", directionLabel: "Get unstuck" },
      { label: "I want to sleep", description: "Wired at bedtime", direction: "sleep", directionLabel: "Sleep" },
    ],
  },
  low: {
    title: "What’s closer?",
    description: "One more and we’ll begin.",
    options: [
      { label: "Low mood", description: "Down, flat", direction: "lift", directionLabel: "Feel better" },
      { label: "Can’t get going", description: "Stuck on a task", direction: "focus", directionLabel: "Focus" },
    ],
  },
  stuck: {
    title: "Where’s the stuckness?",
    description: "One more and we’ll begin.",
    options: [
      { label: "In my head", description: "Looping thoughts", direction: "reset", directionLabel: "Get unstuck" },
      { label: "Disconnected", description: "Spaced out, not here", direction: "ground", directionLabel: "Feel grounded" },
    ],
  },
});

export function unsureSecondStep(branch) {
  return UNSURE_SECOND_STEPS[branch] || UNSURE_SECOND_STEPS.stuck;
}

const WHERE_FELT_DEFAULT = Object.freeze({
  calm: "body",
  lift: "both",
  reset: "thoughts",
  ground: "both",
  focus: "thoughts",
  sleep: "body",
});

export function createInitialResetAnswers(entry) {
  return {
    direction: entry?.direction ?? (entry?.immediate ? "calm" : null),
    directionLabel: entry?.directionLabel ?? (entry?.immediate ? "Calm down" : ""),
    immediate: Boolean(entry?.immediate),
    intensity: entry?.intensity ?? (entry?.immediate ? 9 : null),
    whereFelt: entry?.whereFelt ?? (entry?.direction ? (WHERE_FELT_DEFAULT[entry.direction] || "both") : null),
    timeMin: entry?.timeMin ?? 5,
    audio: entry?.audio ?? "yes",
    movement: entry?.movement ?? "seated",
    location: entry?.location ?? "home",
    situation: entry?.situation ?? null,
    awake_reason: null,
    discreet: Boolean(entry?.discreet),
    eyesOpen: false,
    noBreathing: false,
    noAudio: false,
    bedtime: Boolean(entry?.bedtime),
    subtype: entry?.subtype ?? null,
  };
}
