import { resetCompletionSnapshot } from './resetCompletion.js';
import { captureGoalBaseline, hasGoalBaseline } from './goalAssessment.js';

// Only coarse routing/context data belongs in history.state. Never copy an
// experience's thought, task, note or transcript into it. Final outcomes use
// a separate explicit coarse-field allowlist.
const CONTEXT_KEYS = ['direction', 'intensity', 'distress', 'whereFelt', 'timeMin', 'audio', 'movement', 'location', 'immediate', 'discreet', 'eyesOpen', 'noBreathing', 'noAudio', 'bedtime', 'subtype', 'acute', 'disconnected', 'contraindicationTags', 'unsuitableSubstates', 'requiredResources'];
const LABELS = { lift:'Lift', calm:'Calm', ground:'Ground', focus:'Focus', reset:'Reset', sleep:'Sleep' };
export function resetNavigationEntry(entry, answers, phase, session = {}) {
  const context = Object.fromEntries(CONTEXT_KEYS.filter(key => answers[key] !== undefined).map(key => [key, answers[key]]));
  const baseline = hasGoalBaseline(answers) ? captureGoalBaseline(answers.direction, answers.goal_baseline.value) : null;
  const completion = phase === 'goalReassessment' ? resetCompletionSnapshot(entry?.reset_completion, entry?.pathway?.[0]) : null;
  return {
    ...context,
    directionLabel: LABELS[answers.direction] || '',
    goal_baseline: baseline,
    prebuilt: Boolean(entry?.prebuilt),
    pathway: Array.isArray(entry?.pathway) ? [...entry.pathway] : [],
    unsure: Boolean(entry?.unsure),
    reset_phase: completion ? 'goalReassessment' : ['questions', 'pathway', 'guiding'].includes(phase) ? phase : 'guiding',
    ...(completion ? { reset_completion:completion } : {}),
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
