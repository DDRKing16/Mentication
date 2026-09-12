// Shared time-of-day recommendation used by the homepage banner and the
// My Plan page. Keeps the two surfaces in sync and avoids duplicating the
// buildPathway wiring.
import { buildPathway, computeEffectiveness, segmentMinutes } from "@/lib/interventions";

export function pickSlot(hour) {
  if (hour < 11) return { direction: "lift", title: "Morning Lift", tag: "Wake gently & find momentum", min: 6 };
  if (hour < 14) return { direction: "focus", title: "Midday Focus", tag: "Restore attention & clarity", min: 6 };
  if (hour < 18) return { direction: "calm", title: "Afternoon Reset", tag: "Settle, release & reset", min: 6 };
  return { direction: "sleep", title: "Evening Reset", tag: "Unwind, release & reset", min: 8 };
}

export function buildRecommendation(sessions = []) {
  const slot = pickSlot(new Date().getHours());
  const effectiveness = computeEffectiveness(sessions);
  const pathway = buildPathway(
    { direction: slot.direction, intensity: 5, whereFelt: "both", timeMin: slot.min, location: "home", audio: "yes", movement: "seated" },
    effectiveness
  );
  return { ...slot, pathway: pathway.map((iv) => iv.id), minutes: segmentMinutes(pathway) };
}