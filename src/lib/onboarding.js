// @ts-check
export const ONBOARDING_KEY = "haven_onboarded";

let completedThisRun = false;

export function resetOnboardingSession() { completedThisRun = false; }

export function hasCompletedOnboarding() {
  if (completedThisRun) return true;
  try {
    return globalThis.localStorage?.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function completeOnboarding() {
  completedThisRun = true;
  try {
    globalThis.localStorage?.setItem(ONBOARDING_KEY, "1");
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
