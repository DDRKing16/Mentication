import { getNarration } from './narrationService';

export const PMR_ID = 'progressive-muscle-relaxation-v2';
export const PMR_RATE = 0.8;
export const PMR_LEAD = 0.25;
export const PMR_SHORT_REGIONS = ['hands', 'shoulders', 'lowerLegs'];
export const PMR_OUTCOMES = [
  ['less_tension', 'Less tension', 'You noticed less tension in some areas.'],
  ['same', 'About the same', 'No change is a valid result. You do not need to keep trying.'],
  ['easier_to_notice', 'Easier to notice', 'Noticing the difference can be useful, even without less tension.'],
  ['more_uncomfortable', 'More uncomfortable', 'Stop tensing and let your body rest comfortably. You can finish or choose a non-body practice from the Library.'],
];

export function pmrTiming(step) {
  const narration = getNarration(step.speak || step.body);
  const alignment = narration?.alignment || [];
  const last = alignment.at(-1)?.end || 0;
  return { narration, alignment, duration: Math.max(step.holdSec || 1, PMR_LEAD + last / PMR_RATE + 0.2) };
}

export function createPMRSteps(steps, { length = 'full', mode = 'contrast' } = {}) {
  return steps.filter(step =>
    (length === 'full' || step.region === 'whole' || PMR_SHORT_REGIONS.includes(step.region)) &&
    (mode !== 'release' || step.phase !== 'tense')
  ).map(step => ({ ...step, releaseOnly: mode === 'release', holdSec: pmrTiming(step).duration }));
}

export function nextPMRArea(steps, index) {
  const region = steps[index]?.region;
  if (region === 'whole') return Math.min(index + 1, steps.length);
  const next = steps.findIndex((step, i) => i > index && step.region !== region);
  return next < 0 ? steps.length : next;
}

export function pmrCueState(step, elapsed) {
  const { alignment } = pmrTiming(step);
  const audioTime = Math.max(0, elapsed - PMR_LEAD) * PMR_RATE;
  // Both sound settings follow this same bundled alignment, including failure
  // or missing audio. Never infer movement from whether words are visible.
  const reached = alignment.filter(word => word.start <= audioTime);
  return { visibleCount: reached.length, audioTime, alignment };
}
