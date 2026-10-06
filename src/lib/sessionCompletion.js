// A completed practice is never rerun to retry a local history write. Keep the
// same ID, timestamps, answers and measured attempt even after a failed write.
export function createSessionCompletion(payload, write) {
  const clone = value => JSON.parse(JSON.stringify(value));
  const snapshot = clone(payload);
  let pending = null;
  let saved = null;
  return {
    get payload() { return clone(snapshot); },
    save() {
      if (saved) return Promise.resolve(saved);
      if (pending) return pending;
      pending = Promise.resolve()
        .then(() => write(clone(snapshot)))
        .then(record => { saved = record; return record; })
        .finally(() => { pending = null; });
      return pending;
    },
  };
}
