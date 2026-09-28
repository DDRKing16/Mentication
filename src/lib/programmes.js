// Programmes: short, multi-day journeys made of the existing exercises.
//
// Nothing about the exercises themselves changes. A programme only decides
// which exercise is "today's", and works out progress from the sessions the
// app already saves on the device, so there is no separate tracking to go
// wrong. One day opens at a time; the next opens the following calendar day,
// which gives people a gentle reason to come back tomorrow.
import { getIntervention } from "@/lib/interventions";

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

const startOfNextDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

function sessionIds(session) {
  const ids = [...(session?.completed_pathway || []), ...(session?.pathway || [])];
  return new Set(ids);
}

/**
 * Work out progress from saved sessions.
 * Returns { days: [{ ...day, name, status, doneAt }], doneCount, todayIndex, finished }.
 * status: "done" | "today" | "tomorrow" (done today's; next opens tomorrow) | "later".
 */
export function programmeProgress(programme, sessions = [], startedAt, now = new Date()) {
  const start = startedAt ? new Date(startedAt) : null;
  const ordered = start
    ? [...sessions]
        .map((s) => ({ s, at: new Date(s?.created_date) }))
        .filter(({ at }) => !Number.isNaN(at.getTime()) && at >= start)
        .sort((a, b) => a.at - b.at)
    : [];
  const used = new Set();
  let opensAt = start;
  const days = programme.days.map((day) => ({ ...day, name: getIntervention(day.id)?.name || day.id, status: "later", doneAt: null }));

  for (const day of days) {
    if (!opensAt) break;
    const match = ordered.find(({ s, at }, index) => !used.has(index) && at >= opensAt && sessionIds(s).has(day.id));
    if (!match) break;
    used.add(ordered.indexOf(match));
    day.status = "done";
    day.doneAt = match.at.toISOString();
    opensAt = startOfNextDay(match.at);
  }

  const doneCount = days.filter((d) => d.status === "done").length;
  const finished = doneCount === days.length;
  const todayIndex = finished ? -1 : doneCount;
  if (!finished && start) {
    days[todayIndex].status = opensAt <= now ? "today" : "tomorrow";
  }
  return { days, doneCount, todayIndex, finished };
}

/** The navigation state that opens one exercise, the same way the Library does. */
export function launchStateFor(interventionId, programme) {
  const iv = getIntervention(interventionId);
  if (!iv) return null;
  return {
    prebuilt: true,
    pathway: [iv.id],
    direction: iv.primaryDirection || iv.directions?.[0] || programme?.goal || "calm",
    directionLabel: iv.name,
    intensity: 5,
    whereFelt: iv.targets?.includes("body") ? "body" : "thoughts",
    timeMin: iv.durationMin,
    audio: "yes",
  };
}
