// @ts-check
// The Peace Palace: a place that grows as you practice.
//
// It is derived live from session history — no extra persisted state to keep
// in sync (same approach as the streak in src/lib/streak.js). Every
// intervention you try adds a stone; finishing one all the way through lays
// down far more: foundation, gate, walls, towers, hall and finally the
// gardens that make the palace bloom.
import { getIntervention } from "./interventions";

// Stages in the order the palace is built; `at` is the growth score needed.
// `level` (the index) drives which parts of the palace are drawn.
export const PALACE_STAGES = [
  { at: 0, name: "The quiet clearing", blurb: "A still place, waiting. Every practice plants something here." },
  { at: 4, name: "First stones", blurb: "A foundation is laid — evidence that you show up for yourself." },
  { at: 10, name: "The gate & the path", blurb: "A path has worn itself in through repeated visits. The gate stands open." },
  { at: 18, name: "The walls", blurb: "Walls now surround the grounds. A refuge is taking shape." },
  { at: 28, name: "The towers", blurb: "Towers rise above the walls, built from many finished practices." },
  { at: 40, name: "The great hall", blurb: "The great hall stands complete. Your palace is a real place now." },
  { at: 56, name: "The palace in bloom", blurb: "Flowering gardens, lit windows, your flag raised. The palace is complete." },
];

// Growth points ("stones"): a fully finished intervention is worth far more
// than opening one. exit_reason comes from buildAttemptRecord.
const COMPLETE_POINTS = 2;
const SHOWN_UP_POINTS = 1;

/**
 * Derive the palace from session records.
 * @param {Array} sessions sessionStore records
 */
export function derivePeacePalace(sessions = []) {
  let growth = 0;
  let completedCount = 0;
  let sessionCount = 0;
  const builders = new Map();

  for (const session of sessions) {
    const attempts = Array.isArray(session?.attempts) ? session.attempts : [];
    if (attempts.length === 0) continue;
    sessionCount += 1;
    // completed_pathway is derived from the same attempts, so union them per
    // session and count each finished intervention once.
    const finished = new Set(
      (Array.isArray(session?.completed_pathway) ? session.completed_pathway : [])
        .concat(attempts.filter((a) => a?.exit_reason === "completed").map((a) => a.intervention_id))
        .filter(Boolean)
    );
    growth += finished.size * COMPLETE_POINTS + (finished.size === 0 ? SHOWN_UP_POINTS : 0);
    completedCount += finished.size;
    for (const id of finished) {
      builders.set(id, (builders.get(id) || 0) + 1);
    }
  }

  let level = 0;
  for (let i = 0; i < PALACE_STAGES.length; i += 1) {
    if (growth >= PALACE_STAGES[i].at) level = i;
  }
  const stage = PALACE_STAGES[level];
  const next = PALACE_STAGES[level + 1] || null;

  const builderList = [...builders.entries()]
    .map(([id, count]) => ({ id, name: getIntervention(id)?.name || id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    growth,
    level,
    stage,
    next,
    stonesToNext: next ? next.at - growth : 0,
    completedCount,
    sessionCount,
    builders: builderList,
  };
}
