const KEY = "haven_onboarded";
const WELCOME_KEY = "haven_welcome_seen";
let memoryCompleted = false;
let memoryWelcomed = false;

export function hasCompletedOnboarding() {
  try {
    return localStorage.getItem(KEY) === "1"
      || localStorage.getItem(WELCOME_KEY) === "1"
      || memoryCompleted
      || memoryWelcomed;
  } catch {
    return memoryCompleted || memoryWelcomed;
  }
}

export function completeOnboarding() {
  memoryCompleted = true;
  memoryWelcomed = true;
  try {
    localStorage.setItem(KEY, "1");
    localStorage.setItem(WELCOME_KEY, "1");
  } catch { /* storage may be unavailable */ }
}

export function completeWelcome() {
  memoryWelcomed = true;
  try {
    localStorage.setItem(WELCOME_KEY, "1");
  } catch { /* storage may be unavailable */ }
}

export function resetOnboarding() {
  memoryCompleted = false;
  memoryWelcomed = false;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(WELCOME_KEY);
  } catch { /* storage may be unavailable */ }
}
