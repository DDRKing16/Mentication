// @ts-check
import { computeEffectiveness, getIntervention } from "./interventions";

function localCalendarDayIndex(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return Math.floor(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) / 86400000);
}

/** @param {Array<{ created_date?: string | Date }>} sessions @param {{ now?: Date, timeZone?: string }} [options] */
export function computeLocalCalendarStreak(sessions = [], { now = new Date(), timeZone } = {}) {
  const today = localCalendarDayIndex(now, timeZone);
  if (today == null) return 0;
  const days = [...new Set(
    sessions
      .map((session) => localCalendarDayIndex(session?.created_date, timeZone))
      .filter((day) => day != null),
  )].sort((a, b) => b - a);
  if (!days.length || days[0] < today - 1) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index] !== days[index - 1] - 1) break;
    streak += 1;
  }
  return streak;
}

export function computeEffectivenessInsights(sessions = [], options = {}) {
  const eff = computeEffectiveness(sessions);
  
  // Top interventions by global effectiveness
  const interventionRanks = Object.entries(eff)
    .filter(([k]) => !["recentMap", "usageCount", "categoryUsage", "totalUses", "contextMap", "mechanismMap", "engineVersion"].includes(k))
    .map(([id, score]) => ({ id, score, name: getIntervention(id)?.name || id }))
    .sort((a, b) => b.score - a.score);
  
  // Group by direction to find "best direction" (most improvement, most use)
  const byDirection = {};
  sessions.forEach((s) => {
    if (s.direction) {
      if (!byDirection[s.direction]) {
        byDirection[s.direction] = { sessions: [], improvements: [] };
      }
      byDirection[s.direction].sessions.push(s);
      const improvement = (s.intensity_start ?? 0) - (s.intensity_end ?? 0);
      if (s.direction !== "lift") {
        byDirection[s.direction].improvements.push(improvement);
      } else {
        byDirection[s.direction].improvements.push((s.intensity_end ?? 0) - (s.intensity_start ?? 0));
      }
    }
  });
  
  const directionStats = Object.entries(byDirection).map(([direction, data]) => {
    const avgImprovement = data.improvements.length
      ? data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length
      : 0;
    return {
      direction,
      count: data.sessions.length,
      avgImprovement: +avgImprovement.toFixed(1),
      bestIntervention: interventionRanks.find((r) => {
        const ivSessions = data.sessions.filter((s) => s.pathway?.includes(r.id));
        return ivSessions.length > 0;
      }),
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
    const improvement = (s.intensity_start ?? 0) - (s.intensity_end ?? 0);
    byLocation[loc].improvements.push(improvement);
  });
  
  const locationStats = Object.entries(byLocation).map(([location, data]) => {
    const avgImprovement = data.improvements.length
      ? data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length
      : 0;
    return {
      location,
      count: data.count,
      avgImprovement: +avgImprovement.toFixed(1),
    };
  }).sort((a, b) => b.count - a.count);
  
  // Context patterns: interventions that work best in specific situations
  const contextPatterns = [];
  if (eff.contextMap) {
    Object.entries(eff.contextMap).forEach(([contextKey, ivMap]) => {
      const [direction, where, intensity, location] = contextKey.split("|");
      const topIv = Object.entries(ivMap)
        .filter(([, score]) => score > 0.6)
        .sort(([, a], [, b]) => b - a)[0];
      if (topIv) {
        contextPatterns.push({
          context: contextKey,
          direction,
          where,
          intensity,
          location,
          intervention: topIv[0],
          score: +(topIv[1]).toFixed(2),
        });
      }
    });
  }
  contextPatterns.sort((a, b) => b.score - a.score);
  
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
