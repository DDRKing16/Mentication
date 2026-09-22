// Data-only routing contract so tests and the Reset flow can verify coverage
// without importing browser-bound experience components.
export const INTERACTIVE_FLAGSHIP_IDS = Object.freeze([
  "factCheck", "urgeSurf", "activationMenu", "changeScene", "testPrediction", "thenWhat",
  "countermove", "openChannel", "pulseShift", "nextAction", "tomorrowParking",
  "vectorShift", "signalLock", "nightChannel", "happyBump",
]);

export const isInteractiveFlagship = (id) => INTERACTIVE_FLAGSHIP_IDS.includes(id);
