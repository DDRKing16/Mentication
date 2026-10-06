// Only terminal events are learning observations. Mount/progress telemetry is not
// a skipped attempt, and an explicit exit must remain an exit.
export function attemptEventDisposition(event) {
  if (!event?.interventionId) return 'ignore';
  if (event.action === 'completed') return 'pending';
  return ['switched', 'skipped', 'exited'].includes(event.action) ? 'record' : 'ignore';
}

const HELPFULNESS = ['helpful', 'same', 'worse', 'unsure'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXITS = ['completed', 'switched', 'skipped', 'exited'];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const bounded = (value, min, max) => finite(value) && value >= min && value <= max;
const ENUMS = {
  type: ['pmr', 'next-easiest-step'], kind: ['box_breathing'],
  tensionResponse: ['less_tension', 'same', 'easier_to_notice', 'more_uncomfortable', 'unknown'],
  mode: ['contrast', 'release'], length: ['full', 'short'],
  presence: ['more_present', 'unchanged', 'more_unsettled'],
  completion: EXITS,
  category: ['send', 'check', 'use', 'snap', 'avoid', 'unspecified'],
  action: ['wait', 'leave', 'support', 'substitute', 'act'],
  choiceOutcome: ['yes', 'a_little', 'not_yet', 'stronger', 'need_support'],
};

// Iframe adapters can complete without emitting a separate attempt event.
// Preserve their measured fraction; stopping must never imply a full practice.
export function finalAssessmentEvent(pending, item, result = {}, timestamp = Date.now()) {
  if (!pending && !item?.id) return null;
  const exit = pending?.exitReason || result.exitReason || 'completed';
  const exitReason = exit === 'stopped' ? 'exited' : EXITS.includes(exit) ? exit : 'exited';
  const percentage = pending?.completedPercentage ?? result.completedPercentage;
  return {
    ...(pending || {interventionId:item.id, mechanism:item.mechanism, action:'completed', timestamp}),
    exitReason,
    completedPercentage: bounded(percentage, 0, 1) ? percentage : exitReason === 'completed' ? 1 : 0,
    ...(HELPFULNESS.includes(result.helpfulness) ? {helpfulness:result.helpfulness} : {}),
  };
}

// This is deliberately an allowlist, not a recursive copy of experience state.
// Unknown/new outcome fields require an explicit privacy review here.
export function coarseCompletionOutcome(outcome, interventionId) {
  if (!outcome || typeof outcome !== 'object' || Array.isArray(outcome)) return undefined;
  const clean = {};
  for (const [key, values] of Object.entries(ENUMS)) {
    if (outcome[key] === null || values.includes(outcome[key])) clean[key] = outcome[key];
  }
  for (const key of ['saved', 'stopped', 'stoppedEarly', 'parked']) {
    if (typeof outcome[key] === 'boolean') clean[key] = outcome[key];
  }
  for (const key of ['certaintyBefore', 'certaintyAfter', 'intensityBefore', 'intensityNow']) {
    const min = key.startsWith('intensity') ? 1 : 0;
    if (outcome[key] === null || bounded(outcome[key], min, 10)) clean[key] = outcome[key];
  }
  for (const key of ['windowSeconds', 'durationSec']) {
    if (bounded(outcome[key], 0, 86400)) clean[key] = outcome[key];
  }
  if (outcome.interventionId === interventionId) clean.interventionId = interventionId;
  if (Array.isArray(outcome.skippedRegions)) clean.skippedRegions = [...new Set(outcome.skippedRegions.filter(region => ['whole', 'hands', 'shoulders', 'face', 'torso', 'hips', 'thighs', 'lowerLegs'].includes(region)))];
  if (outcome.classificationCounts && typeof outcome.classificationCounts === 'object') {
    clean.classificationCounts = Object.fromEntries(['mixed', 'not-sure', 'fact', 'interpretation', 'prediction', 'catastrophe', 'feeling'].filter(key => Number.isInteger(outcome.classificationCounts[key]) && bounded(outcome.classificationCounts[key], 0, 10000)).map(key => [key, outcome.classificationCounts[key]]));
  }
  if (interventionId === 'nextAction') {
    for (const key of ['completedSteps', 'skippedSteps']) if (Number.isInteger(outcome[key]) && bounded(outcome[key], 0, 20)) clean[key] = outcome[key];
    if (outcome.gettingStarted === null || ['easier', 'same', 'harder', 'unsure'].includes(outcome.gettingStarted)) clean.gettingStarted = outcome.gettingStarted;
  }
  if (interventionId === 'vectorShift') {
    for (const key of ['easierMode', 'gameplayOnly']) if (typeof outcome[key] === 'boolean') clean[key] = outcome[key];
    if (Array.isArray(outcome.skippedStages)) clean.skippedStages = [...new Set(outcome.skippedStages.filter(stage => Number.isInteger(stage) && stage >= 2 && stage <= 6))];
  }
  if (interventionId === 'changeScene') {
    if (typeof outcome.handoffToken === 'string' && UUID.test(outcome.handoffToken)) clean.handoffToken = outcome.handoffToken;
    for (const key of ['confirmedActions', 'skippedActions']) if (Number.isInteger(outcome[key]) && bounded(outcome[key], 0, 6)) clean[key] = outcome[key];
    if (outcome.actions && typeof outcome.actions === 'object') {
      clean.actions = {};
      for (const key of ['1', '2', '3', '4', '5', '6']) {
        const action = outcome.actions[key];
        if (!action || !['chosen', 'done', 'skipped'].includes(action.status)) continue;
        clean.actions[key] = {status:action.status};
        if (['primary', 'alternative'].includes(action.choice)) clean.actions[key].choice = action.choice;
      }
    }
  }
  if (["selfCompassion", "unhook", "makeRoom"].includes(interventionId)) {
    const questions = { selfCompassion: ["How harsh is your self-talk right now?", "Not harsh", "Extremely harsh"], unhook: ["How caught up in this thought are you right now?", "Not caught up", "Completely caught up"], makeRoom: ["How much are you struggling with this feeling right now?", "Not struggling", "Struggling a lot"] };
    const [question, left, right] = questions[interventionId];
    const assessment = outcome.assessment;
    if (assessment?.question === question && assessment.min === 0 && assessment.max === 10 && assessment.left === left && assessment.right === right) {
      clean.practice = interventionId;
      clean.assessment = { question, left, right, min: 0, max: 10, before: bounded(assessment.before, 0, 10) ? assessment.before : null, after: bounded(assessment.after, 0, 10) ? assessment.after : null };
      clean.change = clean.assessment.before !== null && clean.assessment.after !== null ? clean.assessment.after - clean.assessment.before : null;
    }
    if (typeof outcome.practiceTaken === "boolean") clean.practiceTaken = outcome.practiceTaken;
    if (["done", "planned", "not-now", null].includes(outcome.actionStatus)) clean.actionStatus = outcome.actionStatus;
  }
  if (interventionId === "taraTactician") {
    if (["finished", "stepped-out", "not-attempted", "unknown"].includes(outcome.eventStatus)) clean.eventStatus = outcome.eventStatus;
    if (["less", "same", "more", "different", "not-tested", "unsure"].includes(outcome.predictionComparison)) clean.predictionComparison = outcome.predictionComparison;
    if (typeof outcome.rehearsed === "boolean") clean.rehearsed = outcome.rehearsed;
  }
  if (interventionId === "eftTapping") {
    if (["eft", "grounding"].includes(outcome.mode)) clean.mode = outcome.mode;
    if (outcome.ratingQuestion === "How intense is the discomfort right now?" && outcome.ratingMin === 0 && outcome.ratingMax === 10) {
      clean.ratingQuestion = outcome.ratingQuestion; clean.ratingMin = 0; clean.ratingMax = 10;
      for (const key of ["before", "after"]) clean[key] = bounded(outcome[key], 0, 10) ? outcome[key] : null;
    }
    for (const key of ["roundsCompleted", "skippedPoints", "durationSeconds"]) if (Number.isInteger(outcome[key]) && bounded(outcome[key], 0, 86400)) clean[key] = outcome[key];
    if (typeof outcome.completed === "boolean") clean.completed = outcome.completed;
  }
  return clean;
}

export function resetCompletionSnapshot(snapshot, interventionId) {
  const event = snapshot?.event;
  if (!interventionId || event?.interventionId !== interventionId || attemptEventDisposition(event) !== 'pending') return null;
  const cleanEvent = { interventionId, action:'completed' };
  if (EXITS.includes(event.exitReason)) cleanEvent.exitReason = event.exitReason;
  if (bounded(event.completedPercentage, 0, 1)) cleanEvent.completedPercentage = event.completedPercentage;
  for (const key of ['startedAt', 'timestamp']) if (bounded(event[key], 0, 8640000000000000)) cleanEvent[key] = event[key];
  if (HELPFULNESS.includes(event.helpfulness)) cleanEvent.helpfulness = event.helpfulness;
  const result = { requireGoalReassessment:true };
  if (snapshot.result?.interventionId === interventionId) result.interventionId = interventionId;
  if (HELPFULNESS.includes(snapshot.result?.helpfulness)) result.helpfulness = snapshot.result.helpfulness;
  const outcome = coarseCompletionOutcome(snapshot.result?.outcome, interventionId);
  if (outcome !== undefined) result.outcome = outcome;
  // No arbitrary query strings: these can contain private exercise text.
  if (['/', '/library', '/lift-followup', '/parking-lot', '/night-channel'].includes(snapshot.result?.navigateTo)) result.navigateTo = snapshot.result.navigateTo;
  const destination = snapshot.result?.navigateTo;
  if (interventionId === 'changeScene' && typeof destination === 'string' && destination.startsWith('/scene-followup?') && destination.length < 200) {
    const url = new URL(destination, 'https://mentication.invalid');
    const practice = url.searchParams.get('practice');
    const token = url.searchParams.get('session');
    if (url.pathname === '/scene-followup' && !url.hash && ['happyBump', 'dear2100', 'different'].includes(practice) && token === outcome?.handoffToken && UUID.test(token) && [...url.searchParams.keys()].length === 2) {
      result.navigateTo = `/scene-followup?practice=${practice}&session=${token}`;
    }
  }
  return { event:cleanEvent, result };
}
