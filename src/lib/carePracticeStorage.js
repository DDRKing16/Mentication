import { clearActiveFlagship, getActiveFlagship, saveActiveFlagship } from './flagshipMemory';
import { restoreCareState } from './carePractices';

// One adapter for all three experiences. Drafts use the host's existing 24h store.
// The mentation prefix includes saved cards in Settings → Delete all local data.
export const CARE_SAVED_KEY = 'mentation.carePractices.saved.v1';
export function readCareDraft(id) {
  const active = getActiveFlagship();
  return active?.interventionId === id && active?.experience?.version === 1 ? restoreCareState(active.experience) : null;
}
export function writeCareDraft(id, state) {
  saveActiveFlagship({ interventionId: id, step: state.stage, experience: state });
  const readback = getActiveFlagship();
  return readback?.interventionId === id && JSON.stringify(readback.experience) === JSON.stringify(state);
}
export function deleteCareDraft(id) {
  try {
    clearActiveFlagship(id);
    // The host helper swallows access errors; read back directly to avoid claiming deletion.
    const active = JSON.parse(localStorage.getItem('mentation.flagship.active.v1') || 'null');
    return active?.interventionId !== id;
  } catch { return false; }
}
export function readCareCards() {
  const records = JSON.parse(localStorage.getItem(CARE_SAVED_KEY) || '{}');
  if (!records || typeof records !== 'object' || Array.isArray(records) || Object.values(records).some(value => !value || value.version !== 1)) throw new Error('Unreadable saved cards');
  return Object.fromEntries(Object.entries(records).map(([id, value]) => [id, restoreCareState(value)]));
}
export function readCareSaved(id) {
  try {
    const records = readCareCards();
    return records?.[id]?.version === 1 ? restoreCareState(records[id]) : null;
  } catch { return null; }
}
export function writeCareSaved(id, state) {
  try {
    const records = readCareCards();
    records[id] = restoreCareState(state);
    localStorage.setItem(CARE_SAVED_KEY, JSON.stringify(records));
    return JSON.stringify(readCareSaved(id)) === JSON.stringify(records[id]);
  } catch { return false; }
}
export function deleteCareSaved(id) {
  try {
    const records = readCareCards();
    if (records && typeof records === 'object') delete records[id];
    localStorage.setItem(CARE_SAVED_KEY, JSON.stringify(records || {}));
    return !Object.hasOwn(readCareCards(), id);
  } catch { return false; }
}
