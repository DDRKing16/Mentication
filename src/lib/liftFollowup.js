// These are optional, separately opened journeys, not additional short-reset
// catalogue entries. Mood and distress use independent, explicitly answered scales.
export const LIFT_JOURNEYS = Object.freeze([
  { id: 'dear2100', name: 'Dear 2100', route: '/dear-2100', time: '15 minutes' },
  { id: 'goodMap', name: 'The Good Map', route: '/good-map', time: '10 minutes' },
  { id: 'foundations', name: 'Foundations', route: '/foundations', time: 'Longer programme · weekly plan' },
]);

export const isAnsweredRating = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;

export function liftJourneyOptions({ completedHappyBump = false, mood = null, distress = null, confirmed = false, hasMoreTime = false, answers = {} } = {}) {
  if (!completedHappyBump || answers.direction !== 'lift' || !confirmed || !hasMoreTime) return [];
  if (!isAnsweredRating(mood) || !isAnsweredRating(distress) || mood < 5 || distress > 5) return [];
  // A positive mood is never evidence that distress or a safety exclusion has cleared.
  if (answers.immediate || answers.acute || answers.location !== 'home') return [];
  if ((answers.contraindicationTags || []).length || (answers.unsuitableSubstates || []).length) return [];
  if (['acute', 'immediate-danger', 'disconnected'].includes(answers.subtype) || answers.disconnected) return [];
  return LIFT_JOURNEYS;
}

export function moodResponse(before, after) {
  if (!isAnsweredRating(before) || !isAnsweredRating(after)) return 'not_answered';
  return after > before ? 'better' : after < before ? 'worse' : 'same';
}

// Updating the same completed session makes repeated confirmation idempotent.
// Defaults and the experience's energy outcome are deliberately not inputs.
export function withLiftCheckin(session, mood, distress, answeredAt = new Date().toISOString()) {
  if (!session?.id || session.direction !== 'lift' || !session.completed_pathway?.includes('happyBump')) return null;
  if (!isAnsweredRating(mood) || !isAnsweredRating(distress)) return null;
  return {
    ...session,
    intensity_end: mood,
    post_happy_bump_checkin: { mood, distress, answered_at: answeredAt },
    attempts: (session.attempts || []).map((attempt) => attempt.intervention_id === 'happyBump' && attempt.exit_reason === 'completed'
      ? { ...attempt, response: moodResponse(session.intensity_start, mood) } : attempt),
  };
}
