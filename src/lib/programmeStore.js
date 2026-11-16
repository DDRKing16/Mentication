import { writeVerified } from './verifiedStorage';

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

export const PROGRAMME_STORE_KEY = "mentation.programmes.v1";
export const PROGRAMME_CHANGED_EVENT = "mentation:programmes-changed";
const storage = () => globalThis.window?.localStorage ?? globalThis.localStorage;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const validDate = value => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));

/** Read without repairing or replacing malformed data. Missing storage is not an empty programme. */
export function readProgrammeStore() {
  const local = storage();
  if (!local) throw new Error('Device storage is unavailable.');
  const encoded = local.getItem(PROGRAMME_STORE_KEY);
  if (encoded === null) return {};
  const raw = JSON.parse(encoded);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      Object.values(raw).some(record => !record || typeof record !== 'object' || Array.isArray(record) ||
        !validDate(record.startedAt) || (own(record, 'finishedAt') && !validDate(record.finishedAt)))) {
    throw new Error('Saved programme progress could not be read. Nothing has been replaced.');
  }
  return raw;
}

function writeStore(store) {
  writeVerified(storage(), PROGRAMME_STORE_KEY, JSON.stringify(store));
  // Notify only after storage confirms the write; failed saves cannot unlock UI.
  globalThis.window?.dispatchEvent(new CustomEvent(PROGRAMME_CHANGED_EVENT));
}

/** When this person started a programme (ISO string), or null. */
export const programmeStartedAt = (id, store = readProgrammeStore()) => own(store, id) ? store[id].startedAt : null;

/** The programme currently in progress (most recently started), if any. */
export function activeProgrammeId(store = readProgrammeStore()) {
  const started = Object.entries(store).filter(([, value]) => !value.finishedAt);
  started.sort((a, b) => Date.parse(b[1].startedAt) - Date.parse(a[1].startedAt));
  return started[0]?.[0] || null;
}

function requireProgramme(id) {
  if (!getProgramme(id)) throw new Error('That programme is not available.');
}

export function startProgramme(id, now = new Date()) {
  requireProgramme(id);
  const store = readProgrammeStore();
  // Starting again must not erase history, even from a stale screen.
  // Restarting is explicit: leave the programme, then start it.
  if (own(store, id)) return store[id];
  const record = { startedAt: now.toISOString() };
  store[id] = record;
  writeStore(store);
  return record;
}

export function markProgrammeFinished(id, now = new Date()) {
  requireProgramme(id);
  const store = readProgrammeStore();
  if (!own(store, id)) return null;
  // The completion effect may run again after its own storage event.
  if (store[id].finishedAt) return store[id];
  store[id] = { ...store[id], finishedAt: now.toISOString() };
  writeStore(store);
  return store[id];
}

export function leaveProgramme(id) {
  requireProgramme(id);
  const store = readProgrammeStore();
  if (!own(store, id)) return null;
  delete store[id];
  writeStore(store);
  return null;
}

/** Subscribe to actual lifecycle changes, without polling or writing. */
export function subscribeProgrammeStore(refresh, target = globalThis.window, page = globalThis.document) {
  const changed = event => { if (event.key === null || event.key === PROGRAMME_STORE_KEY) refresh(); };
  const visible = () => { if (page.visibilityState === 'visible') refresh(); };
  target.addEventListener(PROGRAMME_CHANGED_EVENT, refresh);
  target.addEventListener('storage', changed);
  target.addEventListener('focus', refresh);
  page.addEventListener('visibilitychange', visible);
  return () => {
    target.removeEventListener(PROGRAMME_CHANGED_EVENT, refresh);
    target.removeEventListener('storage', changed);
    target.removeEventListener('focus', refresh);
    page.removeEventListener('visibilitychange', visible);
  };
}
