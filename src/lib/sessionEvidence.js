import { goalPointChange } from "./goalAssessment.js";

/**
 * How much better a session left someone, from their own ratings.
 * Positive = better. For "lift" a higher after-rating is better; for
 * everything else (calm, ground, sleep, focus) a lower one is.
 */
export function ratedShift(session) {
  const start = session?.intensity_start, end = session?.intensity_end;
  if (![start,end].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10)) return null;
  if (Object.hasOwn(session, 'goal_baseline') && goalPointChange(session.goal_baseline,session.direction,end) === null) return null;
  return session?.direction === "lift" ? end - start : start - end;
}

// An explicit empty completion list must not fall back to the selected pathway.
export function finishedPracticeIds(session) {
  if (Array.isArray(session?.attempts)) return [...new Set(session.attempts.filter(a => a.exit_reason === 'completed' && a.completed_percentage > 0).map(a => a.intervention_id).filter(Boolean))];
  return Array.isArray(session?.completed_pathway) ? session.completed_pathway : [];
}
