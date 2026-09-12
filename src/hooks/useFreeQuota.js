export const FREE_DAILY_PERSONALIZED = Infinity;

export function useFreeQuota() {
  return { used: 0, limit: Infinity, allowed: Infinity, loading: false, isPremium: true };
}
