// A note owns one history entry. Closing via browser Back must never go Back twice,
// and route unmount must not navigate away from the user's newly selected route.
export function bindJourneyNoteHistory(key, onClose, host = window) {
  let closed = false;
  const isCurrent = () => host.history.state?.journey_note === key;
  if (!isCurrent()) {
    const state = host.history.state || {};
    try {
      host.history.pushState({ ...state, journey_note: key, idx: Number.isInteger(state.idx) ? state.idx + 1 : state.idx }, '');
    } catch { /* The sheet can still close when browser history is unavailable. */ }
  }
  const popped = () => {
    if (!isCurrent() && !closed) { closed = true; onClose(); }
  };
  host.addEventListener('popstate', popped);
  return {
    close() {
      if (closed) return;
      closed = true;
      onClose();
      if (isCurrent()) {
        try { host.history.back(); } catch { /* Dismissal still works without history access. */ }
      }
    },
    dispose() { host.removeEventListener('popstate', popped); },
  };
}
