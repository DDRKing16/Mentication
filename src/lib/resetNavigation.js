import { captureGoalBaseline, hasGoalBaseline } from './goalAssessment.js';

// Only coarse routing/context data belongs in history.state. Never copy an
// experience's thought, task, note, transcript or mechanism outcome into it.
const CONTEXT_KEYS = ['direction', 'intensity', 'distress', 'whereFelt', 'timeMin', 'audio', 'movement', 'location', 'immediate', 'discreet', 'eyesOpen', 'noBreathing', 'noAudio', 'bedtime', 'subtype', 'acute', 'disconnected', 'contraindicationTags', 'unsuitableSubstates', 'requiredResources'];
const LABELS = { lift:'Lift', calm:'Calm', ground:'Ground', focus:'Focus', reset:'Reset', sleep:'Sleep' };
export function resetNavigationEntry(entry, answers, phase, session = {}) {
  const context = Object.fromEntries(CONTEXT_KEYS.filter(key => answers[key] !== undefined).map(key => [key, answers[key]]));
  const baseline = hasGoalBaseline(answers) ? captureGoalBaseline(answers.direction, answers.goal_baseline.value) : null;
  return {
    ...context,
    directionLabel: LABELS[answers.direction] || '',
    goal_baseline: baseline,
    prebuilt: Boolean(entry?.prebuilt),
    pathway: Array.isArray(entry?.pathway) ? [...entry.pathway] : [],
    unsure: Boolean(entry?.unsure),
    // A mechanism's private final state remains owned by that experience.
    // Refresh during its final assessment returns to that resumable experience.
    reset_phase: ['questions', 'pathway', 'guiding'].includes(phase) ? phase : 'guiding',
    reset_session_id: session.id || entry?.reset_session_id,
    reset_started_at: session.startedAt || entry?.reset_started_at,
  };
}
export function freshResetEntry(entry, answers) {
  const fresh = resetNavigationEntry(entry, { ...answers, intensity:null, distress:null, goal_baseline:null }, 'questions');
  delete fresh.reset_session_id;
  delete fresh.reset_started_at;
  return fresh;
}
