// @ts-check
import { ratedShift, finishedPracticeIds } from "./sessionEvidence.js";
import { getIntervention } from "./interventions";

// Moved to `./streak` (no intervention-data dependency) so screens that only
// need the streak don't have to load the recommendation engine; re-exported
// here so existing imports of it from insights.js keep working.
export { computeLocalCalendarStreak } from "./streak";
import { computeLocalCalendarStreak } from "./streak";

export function computeEffectivenessInsights(sessions = [], options = {}) {
  // Recommendation priors are not observations. Only matched ratings after
  // confirmed practice may support a claim of a helpful result.
  const observed = new Map();
  const contexts = new Map();
  sessions.forEach(session => {
    const shift = ratedShift(session);
    if (shift == null) return;
    for (const id of new Set(finishedPracticeIds(session))) {
      const values = observed.get(id) || [];
      observed.set(id, [...values, shift]);
      const location = session.context_snapshot?.location || session.location;
      if (session.direction && location) {
        const key = JSON.stringify([session.direction, location, id]);
        const entry = contexts.get(key) || { direction: session.direction, location, intervention: getIntervention(id)?.name || id, shifts: [] };
        entry.shifts.push(shift);
        contexts.set(key, entry);
      }
    }
  });
  const mean = values => +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  const interventionRanks = [...observed.entries()]
    .map(([id, shifts]) => ({ id, avgShift: mean(shifts), ratedUses: shifts.length, name: getIntervention(id)?.name || id }))
    .filter(result => result.avgShift > 0)
    .sort((a, b) => b.avgShift - a.avgShift);

  // Group by direction to find "best direction" (most improvement, most use)
  const byDirection = {};
  sessions.forEach((s) => {
    if (s.direction) {
      if (!byDirection[s.direction]) {
        byDirection[s.direction] = { sessions: [], improvements: [] };
      }
      byDirection[s.direction].sessions.push(s);
      const improvement = ratedShift(s);
      if (improvement !== null) byDirection[s.direction].improvements.push(improvement);
    }
  });
  
  const directionStats = Object.entries(byDirection).map(([direction, data]) => {
    const avgImprovement = data.improvements.length
      ? data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length
      : null;
    return {
      direction,
      count: data.sessions.length,
      avgImprovement: avgImprovement === null ? null : +avgImprovement.toFixed(1),

    };
  }).sort((a, b) => b.count - a.count);
  
  // Location-based insights: where is user most successful
  const byLocation = {};
  sessions.forEach((s) => {
    const loc = s.context_snapshot?.location || s.location || "home";
    if (!byLocation[loc]) {
      byLocation[loc] = { count: 0, improvements: [] };
    }
    byLocation[loc].count += 1;
    const improvement = ratedShift(s);
    if (improvement !== null) byLocation[loc].improvements.push(improvement);
  });
  
  const locationStats = Object.entries(byLocation).map(([location, data]) => {
    const avgImprovement = data.improvements.length
      ? data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length
      : null;
    return {
      location,
      count: data.count,
      avgImprovement: avgImprovement === null ? null : +avgImprovement.toFixed(1),
    };
  }).sort((a, b) => b.count - a.count);
  
  const contextPatterns = [...contexts.values()]
    .map(({shifts, ...context}) => ({...context, avgShift: mean(shifts), ratedUses: shifts.length}))
    .filter(result => result.ratedUses >= 2 && result.avgShift > 0)
    .sort((a,b) => b.avgShift - a.avgShift);

  return {
    topInterventions: interventionRanks.slice(0, 5),
    directionStats,
    locationStats,
    contextPatterns: contextPatterns.slice(0, 8),
    totalSessions: sessions.length,
    currentStreak: computeLocalCalendarStreak(sessions, options),
    thisWeek: sessions.filter((s) => {
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(s.created_date).getTime() >= since;
    }).length,
  };
}
