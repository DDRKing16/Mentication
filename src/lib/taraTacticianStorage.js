import { validateTaraState } from './taraTacticianState';

export const TARA_STORAGE_KEY = 'mentation.tara-tactician.v1';
export const MAX_TARA_RECAPS = 20;
export class TaraStorageError extends Error {}
function storage(provided) {
  try { const target = provided || globalThis.window?.localStorage; if (!target) throw new Error(); return target; }
  catch { throw new TaraStorageError('Device storage is unavailable. Your current plan is only here until you leave.'); }
}
export function loadTara(provided) {
  let raw;
  try { raw = storage(provided).getItem(TARA_STORAGE_KEY); }
  catch { throw new TaraStorageError('Device storage is unavailable. Your current plan is only here until you leave.'); }
  if (raw === null) return { draft: null, recaps: [] };
  let value;
  try { value = JSON.parse(raw); } catch { throw new TaraStorageError('Your saved Tara data could not be read. It has been kept unchanged.'); }
  if (value?.schemaVersion !== 1 || !Array.isArray(value.recaps)
    || (value.draft !== null && !validateTaraState(value.draft))
    || value.recaps.some(item => !validateTaraState(item) || item.phase !== 'recap')) {
    throw new TaraStorageError('Your saved Tara data could not be read. It has been kept unchanged.');
  }
  return { draft: value.draft && validateTaraState(value.draft), recaps: value.recaps.map(validateTaraState) };
}
function write(value, provided) {
  try {
    const target = storage(provided); const bytes = JSON.stringify({ schemaVersion: 1, ...value });
    target.setItem(TARA_STORAGE_KEY, bytes);
    if (target.getItem(TARA_STORAGE_KEY) !== bytes) throw new Error();
    return value;
  } catch (error) {
    if (error instanceof TaraStorageError) throw error;
    throw new TaraStorageError('This change could not be saved on your device. Keep this screen open or try saving again.');
  }
}
export function saveTaraDraft(state, provided) {
  const valid = validateTaraState(state); if (!valid) throw new TaraStorageError('This draft could not be saved.');
  const current = loadTara(provided); return write({ ...current, draft: valid }, provided);
}
export function saveTaraRecap(state, provided) {
  const valid = validateTaraState({ ...state, saved: true });
  if (!valid || valid.phase !== 'recap') throw new TaraStorageError('Confirm your reflection before saving a recap.');
  const current = loadTara(provided);
  return write({ draft: valid, recaps: [valid, ...current.recaps.filter(item => item.id !== valid.id)].slice(0, MAX_TARA_RECAPS) }, provided);
}
export function clearTara(provided) {
  try {
    const target = storage(provided); target.removeItem(TARA_STORAGE_KEY);
    if (target.getItem(TARA_STORAGE_KEY) !== null) throw new Error();
  } catch { throw new TaraStorageError('Tara data could not be deleted. Please try again.'); }
}
