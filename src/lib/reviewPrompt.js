// @ts-check
// Apple's native "Rate this app" dialog, triggered programmatically — never
// from a custom button (Apple guideline: SKStoreReviewRequest cannot be
// wrapped in app UI). History is kept device-local so the prompt only ever
// fires a small, spaced-out number of times.
//
// NOTE: the native call itself needs a Capacitor plugin that talks to
// StoreKit's SKStoreReviewRequest. None is installed yet — AGENTS.md asks
// that new native plugins be approved before adding them (haptics,
// local-notifications and @capgo/native-purchases are the only ones
// approved so far). `requestNativeReview()` below is the single seam to
// wire that plugin into once approved; everything else (trigger
// conditions, history, annual reset) is already live.
const KEY = "mentation.reviewPromptHistory.v1";
const MAX_PROMPTS_PER_YEAR = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 90;
const MIN_SESSIONS_BEFORE_PROMPT = 3;
const ANNUAL_RESET_DAYS = 365;

const DEFAULT_HISTORY = Object.freeze({
  totalPromptsFired: 0,
  lastFiredAt: null,
  firstFiredAt: null,
});

const storage = () => (typeof window === "undefined" ? null : window.localStorage);
const daysSince = (iso) => (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);

export function getReviewPromptHistory() {
  try {
    const raw = JSON.parse(storage()?.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return { ...DEFAULT_HISTORY };
    return { ...DEFAULT_HISTORY, ...raw };
  } catch {
    return { ...DEFAULT_HISTORY };
  }
}

function save(history) {
  try {
    storage()?.setItem(KEY, JSON.stringify(history));
  } catch {
    // storage unavailable — history just won't persist this session
  }
  return history;
}

function withAnnualReset(history) {
  if (history.firstFiredAt && daysSince(history.firstFiredAt) >= ANNUAL_RESET_DAYS) {
    return { totalPromptsFired: 0, lastFiredAt: history.lastFiredAt, firstFiredAt: null };
  }
  return history;
}

function canFire(history) {
  if (history.totalPromptsFired >= MAX_PROMPTS_PER_YEAR) return false;
  if (history.lastFiredAt && daysSince(history.lastFiredAt) < MIN_DAYS_BETWEEN_PROMPTS) return false;
  return true;
}

/** Seam for the native call. No-ops until a review plugin is approved and installed. */
async function requestNativeReview() {
  // eslint-disable-next-line no-console
  console.info("[reviewPrompt] would call SKStoreReviewRequest.requestReview() here.");
}

/**
 * Call after the intervention completion animation finishes. `sessionCount`
 * is the user's total completed-session count (sessionHistory.length).
 * Fires the native dialog and writes history when all trigger conditions
 * are met; otherwise does nothing.
 */
export async function maybeRequestReview(sessionCount) {
  let history = withAnnualReset(getReviewPromptHistory());
  if (sessionCount < MIN_SESSIONS_BEFORE_PROMPT || !canFire(history)) {
    save(history);
    return false;
  }
  const now = new Date().toISOString();
  history = {
    totalPromptsFired: history.totalPromptsFired + 1,
    lastFiredAt: now,
    firstFiredAt: history.firstFiredAt || now,
  };
  save(history);
  await requestNativeReview();
  return true;
}
