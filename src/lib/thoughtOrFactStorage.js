import { readRecordList, writeVerified } from './verifiedStorage';

export const THOUGHT_RECORD_KEY = 'mentation.thought-or-fact.records.v1';
export function readThoughtRecords(storage = globalThis.localStorage) {
  return readRecordList(storage, THOUGHT_RECORD_KEY);
}
function changed() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('mentation:thoughts-changed'));
}
export function saveThoughtRecord(record, storage = globalThis.localStorage) {
  if (!record || typeof record.id !== 'string' || !record.id) throw new Error('A reflection identity is required.');
  const records = readThoughtRecords(storage);
  // An explicit edit updates the same reflection. Keep all other valid saved work.
  writeVerified(storage, THOUGHT_RECORD_KEY, JSON.stringify([record, ...records.filter(item => item.id !== record.id)]));
  changed();
  return record;
}
export function deleteThoughtRecord(id, storage = globalThis.localStorage) {
  writeVerified(storage, THOUGHT_RECORD_KEY, JSON.stringify(readThoughtRecords(storage).filter(item => item.id !== id)));
  changed();
}
export function thoughtReflectionContent(data) {
  return {
    thought: data.thought,
    ruling: data.balancedConfirmed ? data.fairerView?.adaptive : 'Left unresolved',
    fairerView: data.balancedConfirmed ? data.fairerView : null,
    balancedConfirmed: data.balancedConfirmed === true,
    returnPhrase: data.returnPhrase || '',
    certaintyBefore: data.certaintyBefore,
    certaintyAfter: data.certaintyAfter,
    support: data.support || [],
    evidenceAgainst: data.evidenceAgainst || [],
  };
}
export function isCurrentThoughtReflection(record, data) {
  if (!record) return false;
  const content = thoughtReflectionContent(data);
  return Object.keys(content).every(key => JSON.stringify(record[key]) === JSON.stringify(content[key]));
}
