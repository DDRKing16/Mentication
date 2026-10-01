// Programme data and the on-device "which programme is active" bookkeeping.
//
// Nothing here needs the intervention data (narration, steps, etc.), so
// screens that only need to know "is a programme active" — like Home —
// can use this without pulling in the whole intervention/recommendation
// engine just to render a badge. `programmeProgress` and `launchStateFor`,
// which do need intervention details, live in `@/lib/programmes` instead.
export const PROGRAMMES = Object.freeze([
  {
    id: "calmer-seven",
    title: "Seven calmer days",
    goal: "calm",
    plus: false,
    promise: "A week of short practices that settle your system, one a day.",
    days: [
      { id: "boxV2", intention: "Find a steady breath" },
      { id: "grounding54321V2", intention: "Come back to the room" },
      { id: "progressive-muscle-relaxation-v2", intention: "Let the body let go" },
      { id: "factCheck", intention: "Loosen a sticky thought" },
      { id: "boxV2", intention: "Return to your breath" },
      { id: "urgeSurf", intention: "Ride out a strong feeling" },
      { id: "progressive-muscle-relaxation-v2", intention: "Close the week softly" },
    ],
  },
  {
    id: "small-lifts-five",
    title: "Five days of small lifts",
    goal: "lift",
    plus: true,
    promise: "When things feel flat: five small, doable lifts, one a day.",
    days: [
      { id: "happyBump", intention: "Build a little momentum" },
      { id: "changeScene", intention: "Shift the scene" },
      { id: "grounding54321V2", intention: "Notice what's around you" },
      { id: "happyBump", intention: "Stack another small win" },
      { id: "changeScene", intention: "Take the lift with you" },
    ],
  },
  {
    id: "better-nights-five",
    title: "Five better nights",
    goal: "sleep",
    plus: true,
    promise: "An evening practice each night to help your mind wind down.",
    days: [
      { id: "tomorrowParking", intention: "Park tomorrow's thoughts" },
      { id: "progressive-muscle-relaxation-v2", intention: "Release the day from your body" },
      { id: "tomorrowParking", intention: "Set down what's left" },
      { id: "boxV2", intention: "Slow the breath before bed" },
      { id: "progressive-muscle-relaxation-v2", intention: "End the week rested" },
    ],
  },
]);

export const getProgramme = (id) => PROGRAMMES.find((p) => p.id === id) || null;

const STORE_KEY = "mentation.programmes.v1";

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* storage unavailable */ }
}

/** When this person started a programme (ISO string), or null. */
export const programmeStartedAt = (id) => readStore()[id]?.startedAt || null;

/** The programme currently in progress (most recently started), if any. */
export function activeProgrammeId() {
  const store = readStore();
  const started = Object.entries(store).filter(([, v]) => v?.startedAt && !v?.finishedAt);
  started.sort((a, b) => Date.parse(b[1].startedAt) - Date.parse(a[1].startedAt));
  return started[0]?.[0] || null;
}

export function startProgramme(id, now = new Date()) {
  const store = readStore();
  store[id] = { startedAt: now.toISOString() };
  writeStore(store);
}

export function markProgrammeFinished(id, now = new Date()) {
  const store = readStore();
  if (store[id]) { store[id].finishedAt = now.toISOString(); writeStore(store); }
}

export function leaveProgramme(id) {
  const store = readStore();
  delete store[id];
  writeStore(store);
}
