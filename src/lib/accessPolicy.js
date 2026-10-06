// App content access is independent of Apple subscription status.
// All intervention and programme journeys are free on every host and platform.
export const APP_ACCESS_POLICY = Object.freeze({ journeys: "free" });

export function hasJourneyAccess({ active = false, founderPreview = false } = {}) {
  return APP_ACCESS_POLICY.journeys === "free" || active || founderPreview;
}
