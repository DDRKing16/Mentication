// @ts-check
export const ONBOARDING_KEY = "haven_onboarded";

export function hasCompletedOnboarding() {
  try {
    return globalThis.localStorage?.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function completeOnboarding() {
  try {
    globalThis.localStorage?.setItem(ONBOARDING_KEY, "1");
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
