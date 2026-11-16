// Programmes: short, multi-day journeys made of the existing exercises.
//
// Nothing about the exercises themselves changes. A programme only decides
// which exercise is "today's", and works out progress from the sessions the
// app already saves on the device, so there is no separate tracking to go
// wrong. One day opens at a time; the next opens the following calendar day,
// which gives people a gentle reason to come back tomorrow.
//
// The programme data and "which programme is active" bookkeeping live in
// `@/lib/programmeStore`, which doesn't need the intervention data. Only the
// two functions below (`programmeProgress`, `launchStateFor`) need it, so
// this file is the one to load lazily wherever that's worth doing.
import { getIntervention } from "@/lib/interventions";
import { finishedPracticeIds } from "./sessionEvidence";

export * from "@/lib/programmeStore";

const startOfNextDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

function sessionIds(session) {
  // A selected pathway is not completion evidence, including in legacy records.
  // Modern attempts are authoritative; only records without attempts may use
  // their explicit completed_pathway. Ignore malformed attempt entries safely.
  if (session && Object.prototype.hasOwnProperty.call(session, 'attempts')) {
    if (!Array.isArray(session.attempts)) return new Set();
    return new Set(finishedPracticeIds({ ...session, attempts: session.attempts.filter(attempt => attempt && typeof attempt === 'object') }));
  }
  return new Set(finishedPracticeIds(session));
}

/**
 * Work out progress from saved sessions.
 * Returns { days: [{ ...day, name, status, doneAt }], doneCount, todayIndex, finished }.
 * status: "done" | "today" | "tomorrow" (done today's; next opens tomorrow) | "later".
 */
export function programmeProgress(programme, sessions = [], startedAt, now = new Date()) {
  const parsedStart = startedAt ? new Date(startedAt) : null;
  const start = parsedStart && Number.isFinite(parsedStart.getTime()) ? parsedStart : null;
  const ordered = start
    ? [...sessions]
        .map((s) => ({ ids: sessionIds(s), at: s?.created_date ? new Date(s.created_date) : new Date(NaN) }))
        .filter(({ at }) => !Number.isNaN(at.getTime()) && at >= start && at <= now)
        .sort((a, b) => a.at - b.at)
    : [];
  const used = new Set();
  let opensAt = start;
  const days = programme.days.map((day) => ({ ...day, name: getIntervention(day.id)?.name || day.id, status: "later", doneAt: null }));

  for (const day of days) {
    if (!opensAt) break;
    const match = ordered.find(({ ids, at }, index) => !used.has(index) && at >= opensAt && ids.has(day.id));
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
