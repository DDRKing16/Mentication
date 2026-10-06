// Browser-local persistence. Never replace unreadable or concurrently changed data.
export const BOOK_KEY = 'dear2100-book-v1';
export function createBookStore(storage, parse, empty, locks) {
  let expected;
  const raw = () => storage.getItem(BOOK_KEY);
  const decode = value => {
    const data = JSON.parse(value);
    if (!data || !Number.isSafeInteger(data.version) || data.version < 0) throw new Error('Invalid saved version');
    return { book: parse(data.book), version: data.version };
  };
  const exclusive = action => {
    if (!locks?.request) throw new Error('Safe saving is unavailable in this browser. Export your current copy; use a browser with Web Locks support.');
    return locks.request(BOOK_KEY, action);
  };
  return {
    async load() {
      const value = raw();
      try {
        const result = value === null ? { book: empty(), version: 0 } : decode(value);
        expected = value;
        return result;
      } catch {
        throw new Error('Your saved book could not be read or uses an unsupported format. It has not been changed. Download the original before recovering or importing it.');
      }
    },
    async save(book, version) {
      return exclusive(() => {
        const value = raw();
        if (expected === undefined || value !== expected) throw new Error('This book changed in another tab. Export your current copy, then reload the saved book. Nothing was overwritten.');
        if (value !== null && JSON.parse(value).book?.format !== 7) {
          // Migration is reversible even after subsequent autosaves.
          const backupKey = `${BOOK_KEY}-before-migration`;
          if (storage.getItem(backupKey) === null) storage.setItem(backupKey, value);
        }
        const validated = parse(book);
        const next = JSON.stringify({ book: validated, version: version + 1 });
        storage.setItem(BOOK_KEY, next);
        expected = next;
        return { version: version + 1 };
      });
    },
    async remove() {
      return exclusive(() => {
        if (expected === undefined || raw() !== expected) throw new Error('This book changed in another tab. Reload it before deleting.');
        storage.removeItem(BOOK_KEY);
        expected = null;
      });
    },
    async recover() {
      return exclusive(() => {
        const value = raw();
        if (value !== null) storage.setItem(`${BOOK_KEY}-recovery-${Date.now()}`, value);
        storage.removeItem(BOOK_KEY);
        expected = null;
      });
    },
    original: raw,
  };
}
