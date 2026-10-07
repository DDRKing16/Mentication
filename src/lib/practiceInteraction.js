// An accidental double tap must not answer the next screen. Stop and Back bypass this gate.
export function createProgressGate(interval = 250) {
  let last = -Infinity;
  return (now = Date.now()) => {
    if (now - last < interval) return false;
    last = now;
    return true;
  };
}

// Read back deletion before a journey that promises to clear its draft reports completion.
export function clearPracticeDraft(storage, id) {
  const key = 'mentation.flagship.active.v1';
  try {
    storage ||= globalThis.window?.localStorage;
    if (!storage) return false;
    const raw = storage.getItem(key);
    if (!raw) return true;
    const draft = JSON.parse(raw);
    if (draft?.interventionId !== id) return true;
    storage.removeItem(key);
    const remaining = storage.getItem(key);
    return !remaining || JSON.parse(remaining)?.interventionId !== id;
  } catch { return false; }
}
