const KEY = "haven_onboarded";
let memoryCompleted = false;

export function hasCompletedOnboarding() {
  try {
    return localStorage.getItem(KEY) === "1" || memoryCompleted;
  } catch {
    return memoryCompleted;
  }
}

export function completeOnboarding() {
  memoryCompleted = true;
  try {
    localStorage.setItem(KEY, "1");
  } catch { /* storage may be unavailable */ }
}

export function resetOnboarding() {
  memoryCompleted = false;
  try {
    localStorage.removeItem(KEY);
  } catch { /* storage may be unavailable */ }
}
