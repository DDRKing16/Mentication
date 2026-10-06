import { useEffect, useState } from 'react';

const SAVED_KEYS = {
  foundations: ['mentication.foundations.draft.v2', 'mentication.foundations.weekly-plan.v2', 'mentication.foundations.weekly-plan.v1'],
  signalLock: ['mentation.signal-lock.grounding.v1'],
  goodMap: ['goodmap-journey-v4'],
};

// Another tab may clear a record while its old document is mounted here. Dispose
// that document first, then clear once more after pagehide and reload cleanly.
// The second clear prevents a pagehide autosave from resurrecting deleted work.
export function useStandaloneDataReset(frame, id, src) {
  const [error, setError] = useState('');
  useEffect(() => {
    let pending = null;
    const receive = event => {
      if (event.storageArea !== window.localStorage || event.newValue !== null || !SAVED_KEYS[id] || (event.key !== null && (event.oldValue === null || !SAVED_KEYS[id].includes(event.key)))) return;
      const keys = event.key === null ? SAVED_KEYS[id] : [event.key];
      const node = frame.current;
      if (!node || pending) return;
      const afterDispose = () => {
        if (node.contentWindow?.location.href !== 'about:blank') return;
        node.removeEventListener('load', afterDispose);
        pending = null;
        try { keys.forEach(key => window.localStorage.removeItem(key)); node.src = src; setError(''); }
        catch { setError('This practice was closed, but its local data could not be cleared. Try deleting it again in Settings.'); }
      };
      pending = { node, afterDispose };
      node.addEventListener('load', afterDispose);
      node.src = 'about:blank';
    };
    window.addEventListener('storage', receive);
    return () => {
      window.removeEventListener('storage', receive);
      pending?.node.removeEventListener('load', pending.afterDispose);
    };
  }, [frame, id, src]);
  return error;
}
