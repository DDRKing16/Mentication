import { boxPosition } from "./boxPosition.js";
import { groundingPosition } from "./groundingPosition.js";
import { resetCompletionSnapshot } from './resetCompletion.js';
import { captureGoalBaseline, hasGoalBaseline } from './goalAssessment.js';
import { validTaraPlanId } from './taraNotificationRouting.js';

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
    ...(phase === "questions" ? {reset_question:["goal","distress","time"].includes(entry?.reset_question) ? entry.reset_question : "goal"} : {}),
    reset_session_id: session.id || entry?.reset_session_id,
    reset_started_at: session.startedAt || entry?.reset_started_at,
    ...(phase === 'guiding' && entry?.pathway?.length === 1 && entry.pathway[0] === 'taraTactician' && validTaraPlanId(entry.taraNotificationPlanId)
      ? { taraNotificationPlanId: entry.taraNotificationPlanId,
        taraNotificationRequestId: validTaraPlanId(entry.taraNotificationRequestId) ? entry.taraNotificationRequestId : entry.taraNotificationPlanId } : {}),
    ...(phase==='guiding' && entry?.pathway?.length===1 && entry.pathway[0]==='boxV2' && boxPosition(entry?.reset_box,session.id || entry?.reset_session_id) ? {reset_box:boxPosition(entry.reset_box,session.id || entry.reset_session_id)} : {}),
    ...(phase==='guiding' && entry?.pathway?.length===1 && entry.pathway[0]==='grounding54321V2' && groundingPosition(entry?.reset_grounding,session.id || entry?.reset_session_id) ? {reset_grounding:groundingPosition(entry.reset_grounding,session.id || entry.reset_session_id)} : {}),
  };
}
export function freshResetEntry(entry, answers) {
  const fresh = resetNavigationEntry(entry, { ...answers, intensity:null, distress:null, goal_baseline:null }, 'questions');
  fresh.reset_question = "goal";
  delete fresh.reset_session_id;
  delete fresh.reset_started_at;
  return fresh;
}

// Browser Back preserves forward entries. Only a new navigation after going
// back replaces that forward branch, matching the browser's history behavior.
export function appendResetFlowSnapshot(stack, index, snapshot) {
  const next = stack.slice(0, index + 1);
  next[index + 1] = snapshot;
  return next;
}
export function resetFlowHistorySnapshot(stack, index, entry) {
  if (stack[index]) return stack[index];
  if (entry?.reset_phase === 'goalReassessment' && resetCompletionSnapshot(entry.reset_completion, entry.pathway?.[0])) return {phase:'goalReassessment',unsureStep:0};
  return ['questions','pathway','guiding'].includes(entry?.reset_phase) ? {phase:entry.reset_phase,unsureStep:0,...(entry.reset_phase==="questions" ? {questionStep:["goal","distress","time"].includes(entry.reset_question)?entry.reset_question:"goal"} : {})} : null;
}
