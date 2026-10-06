// Shared-flow owner: spread this through the existing catalogue's make() factory.
// Register this ID with TappingExperience in the host; no generic step fallback.
export const tappingRegistration = Object.freeze({
  id: 'eftTapping', name: 'Gentle Tapping', category: 'grounding',
  directions: ['calm', 'ground'], energy: 'calming',
  mechanism: 'eft-style-tapping',
  why: 'A gentle guided round of tapping for calming and grounding, with one clear point at a time.',
  targets: ['body', 'both'], states: ['tense', 'anxious', 'overwhelmed', 'restless', 'any'],
  durationMin: 2, cognitiveLoad: 1, physicalDemand: 2, movement: 'seated',
  environment: 'private', eyes: 'open', audio: 'optional', discreet: false,
  gentle: true, panic: false, performanceSafe: false,
  experienceTier: 'flagship', recommendationEligible: true,
  // Explicit selection is available; do not silently introduce it to automatic plans.
  automaticEligible: false,
  steps: [],
});
