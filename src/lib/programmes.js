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

export * from "@/lib/programmeStore";

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
