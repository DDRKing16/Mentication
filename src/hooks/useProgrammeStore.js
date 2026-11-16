import { useCallback, useEffect, useRef, useState } from 'react';
import { readProgrammeStore, subscribeProgrammeStore } from '@/lib/programmeStore';

// A failed read retains the last snapshot but marks it unverified. Callers must
// gate completion/launch decisions on ready && !error, not infer a fresh start.
export function useProgrammeStore() {
  const [store, setStore] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const reload = useCallback(async () => {
    const current = ++request.current;
    try {
      const next = await Promise.resolve().then(readProgrammeStore);
      if (current === request.current) { setStore(next); setError(''); setReady(true); }
    } catch {
      if (current === request.current) {
        setError('Your saved programme progress could not be read. Try again; nothing has been replaced.');
        setReady(true);
      }
    }
  }, []);
  useEffect(() => {
    void reload();
    const unsubscribe = subscribeProgrammeStore(reload);
    return () => { request.current += 1; unsubscribe(); };
  }, [reload]);
  return { store, ready, error, reload };
}
