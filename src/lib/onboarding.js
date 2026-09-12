const KEY = "haven_onboarded";

export function hasCompletedOnboarding() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function completeOnboarding() {
  try {
    localStorage.setItem(KEY, "1");
  } catch { /* storage may be unavailable */ }
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* storage may be unavailable */ }
}
