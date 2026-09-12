// V1 ships as a complete, account-free product. Apple In-App Purchase can be
// added later without gating any safety-critical intervention.
export function usePremium() {
  return { isPremium: true, status: "included" };
}
