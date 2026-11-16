import { sessionStore } from './localData';

// A handoff is an exact lookup, not a recent-history summary. Older retained
// sessions remain valid; use the same verified reader and propagate read errors.
export async function loadSceneFollowupSession(token) {
  if (typeof token !== 'string' || token.length === 0) return null;
  const records = await sessionStore.listAll();
  return records.find(record => record.intervention_outcome?.handoffToken === token &&
    Array.isArray(record.pathway) && record.pathway.includes('changeScene')) || null;
}
