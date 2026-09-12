import { computeEffectiveness, getIntervention } from "./interventions";

export function computeEffectivenessInsights(sessions = []) {
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
    thisWeek: sessions.filter((s) => {
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(s.created_date).getTime() >= since;
    }).length,
  };
}
