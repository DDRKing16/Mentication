import { useEffect, useRef } from 'react';

// History contains only a public screen identifier. Personal entries stay in
// the journey's existing state/storage, and are never copied into navigation.
// A new answer after Back naturally replaces the forward browser branch.
export function useJourneyScreenHistory(id, screen, restore) {
  const callback = useRef(restore);
  callback.current = restore;
  const previous = useRef(null);
  const returning = useRef(null);
  const current = useRef(screen);
  current.current = screen;
  useEffect(() => {
    const onPop = event => {
      const position = event.state?.journey_screen;
      if (position?.id !== id || typeof position.screen !== 'string') return;
      const result = callback.current(position.screen);
      const accepted = typeof result === 'string' && result.length <= 100 ? result : position.screen;
      returning.current = accepted === current.current ? null : accepted;
      previous.current = accepted;
      if (accepted !== position.screen) {
        try { window.history.replaceState({...event.state,journey_screen:{id,screen:accepted}},''); } catch { /* In-app position stays available. */ }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [id]);
  useEffect(() => {
    if (typeof screen !== 'string' || screen.length > 100) return;
    if (returning.current === screen) { returning.current = null; previous.current = screen; return; }
    returning.current = null;
    if (previous.current === screen) return;
    const state = window.history.state || {};
    const next = {...state,journey_screen:{id,screen}};
    try {
      if (previous.current === null) window.history.replaceState(next,'');
      else window.history.pushState({...next,idx:Number.isInteger(state.idx)?state.idx+1:state.idx,key:globalThis.crypto?.randomUUID?.() || `${Date.now()}`},'');
      previous.current = screen;
    } catch { /* In-app Back remains available if browser history is blocked. */ }
  }, [id, screen]);
}
