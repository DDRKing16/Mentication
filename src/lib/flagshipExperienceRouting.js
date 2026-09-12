// Data-only routing contract so tests and the Reset flow can verify coverage
// without importing browser-bound experience components.
export const INTERACTIVE_FLAGSHIP_IDS = Object.freeze([
  "factCheck", "urgeSurf", "activationMenu", "changeScene", "testPrediction", "thenWhat",
  "countermove", "openChannel", "pulseShift", "nextAction", "tomorrowParking",
  "reroute", "signalLock", "nightChannel",
]);

export const ENHANCED_GUIDED_IDS = Object.freeze([
  "orienting", "solvableWorry", "nameFeeling", "frictionSweep", "sigh", "move90", "sensoryWake",
]);

export const NEW_FLAGSHIP_IDS = Object.freeze([
  "reroute", "signalLock", "nightChannel",
]);

export const INTERACTIVE_EXPERIENCE_IDS = Object.freeze([
  ...INTERACTIVE_FLAGSHIP_IDS,
  ...ENHANCED_GUIDED_IDS,
]);

export const isInteractiveFlagship = (id) => INTERACTIVE_FLAGSHIP_IDS.includes(id);
export const isInteractiveExperience = (id) => INTERACTIVE_EXPERIENCE_IDS.includes(id);
export const isNewFlagship = (id) => NEW_FLAGSHIP_IDS.includes(id);
