// Completion describes confirmed practice, never setup choices or feeling better.
export function happyBumpCompletion(state) {
  const reflection = state.reflectionConfirmed === true && ['proud', 'grateful', 'lookingForward'].some(key => state[key]?.trim());
  const performed = [state.hydrated === true, state.aired === true,
    ['completed', 'started'].includes(state.walkStatus),
    ['contacted', 'attempted'].includes(state.contactStatus),
    ['completed', 'started'].includes(state.taskStatus), reflection].filter(Boolean).length;
  return { exitReason: performed ? 'completed' : 'skipped', completedPercentage: performed / 6 };
}

export function carePracticeCompletion(state) {
  const tried = state.practiceTaken === true || state.anchorNoticed === true || state.actionStatus === 'done';
  return { exitReason: state.practiceStopped ? 'exited' : tried ? 'completed' : 'skipped', completedPercentage: tried ? 1 : 0 };
}

export function taraPracticeCompletion(state) {
  const tried = state.rehearsed === true || state.eventStatus === 'finished';
  return { exitReason: state.eventStatus === 'stepped-out' ? 'exited' : tried ? 'completed' : 'skipped', completedPercentage: tried ? 1 : 0 };
}

export function vectorPracticeCompletion(result) {
  const stages = [...new Set(Array.isArray(result.practicedStages) ? result.practicedStages.filter(stage => [2, 3, 4, 5].includes(stage)) : [])];
  return { exitReason: result.exitReason === 'stopped' ? 'stopped' : stages.length ? 'completed' : 'skipped', completedPercentage: stages.length / 4 };
}

export function groundingPracticeCompletion(noticed, atEnd) {
  const count = new Set((noticed || []).filter(index => Number.isInteger(index) && index >= 0 && index < 5)).size;
  return { exitReason: count ? atEnd ? 'completed' : 'exited' : 'skipped', completedPercentage: count / 5 };
}
