// A baseline exists only after an explicit answer, never from a display default.
export const GOAL_ASSESSMENTS = Object.freeze({
  lift: { question:'How is your mood right now?', scale:'mood', left:'Very low', right:'Great', higherIsBetter:true },
  calm: { question:'How intense is it right now?', scale:'distress', left:'Calm', right:'Extreme', higherIsBetter:false },
  focus: { question:'How intense is it right now?', scale:'focus difficulty', left:'Focused', right:"Can't focus", higherIsBetter:false },
  ground: { question:'How intense is it right now?', scale:'disconnection', left:'Present', right:'Gone', higherIsBetter:false },
  reset: { question:'How intense is it right now?', scale:'rumination', left:'Clear', right:'Consuming', higherIsBetter:false },
  sleep: { question:'How intense is it right now?', scale:'wakefulness', left:'Drowsy', right:'Wide awake', higherIsBetter:false },
});
const valid = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10;
export function captureGoalBaseline(direction, value) {
  const assessment=GOAL_ASSESSMENTS[direction];
  return assessment && valid(value) ? { ...assessment, direction, min:0, max:10, value, answered:true } : null;
}
export function goalPointChange(baseline, direction, after) {
  const expected=GOAL_ASSESSMENTS[direction];
  if (!expected || !baseline?.answered || !valid(baseline.value) || !valid(after) || baseline.direction !== direction) return null;
  if (baseline.question !== expected.question || baseline.scale !== expected.scale || baseline.higherIsBetter !== expected.higherIsBetter || baseline.left !== expected.left || baseline.right !== expected.right || baseline.min !== 0 || baseline.max !== 10) return null;
  return after-baseline.value;
}

export const MATCHED_ASSESSMENT_IDS = new Set(['happyBump', 'boxV2', 'progressive-muscle-relaxation-v2', 'grounding54321V2', 'urgeSurf', 'factCheck', 'changeScene']);
export function hasGoalBaseline(answers) {
  return goalPointChange(answers?.goal_baseline, answers?.direction, answers?.goal_baseline?.value) === 0;
}
