// A save/delete is successful only after the same device store confirms it.
export function writeVerified(storage, key, value) {
  if (!storage) throw new Error('Device storage is unavailable.');
  storage.setItem(key,value);
  if (storage.getItem(key)!==value) throw new Error('Device storage could not confirm the save.');
}
export function removeVerified(storage,key) {
  if (!storage) throw new Error('Device storage is unavailable.');
  storage.removeItem(key);
  if (storage.getItem(key)!==null) throw new Error('Device storage could not confirm deletion.');
}
export function readRecordList(storage,key) {
  if (!storage) throw new Error('Device storage is unavailable.');
  const records=JSON.parse(storage.getItem(key)||'[]');
  if(!Array.isArray(records)||records.some(record=>!record||typeof record!=='object'||typeof record.id!=='string')) throw new Error('Existing records could not be read. Nothing has been replaced.');
  return records;
}
