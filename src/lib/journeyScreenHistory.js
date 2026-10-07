/** Browser-history bridge for documents whose iframe is recreated on app refresh.
 * Store screen IDs/cursors only. Private answers stay in each journey's existing save.
 */
export function bindJourneyScreenHistory({ id, getFrame, onExit, onError, screenIds, cursorNames, host = window }) {
  const field = `menticationScreen:${id}`;
  const allowedIds = new Set(screenIds);
  let pendingRestore = null;
  const normalize = value => {
    if (!value || !allowedIds.has(value.id) || !value.cursors || typeof value.cursors !== 'object') return null;
    if (Object.keys(value).some(key => !['id', 'cursors', 'depth'].includes(key))) return null;
    if (value.depth !== undefined && (!Number.isSafeInteger(value.depth) || value.depth < 0)) return null;
    if (Object.keys(value.cursors).some(key => !cursorNames.includes(key))) return null;
    const cursors = {};
    for (const key of cursorNames) {
      if (!Number.isSafeInteger(value.cursors[key]) || value.cursors[key] < 0) return null;
      cursors[key] = value.cursors[key];
    }
    return { id: value.id, cursors };
  };
  const depthOf = value => Number.isSafeInteger(value?.depth) && value.depth >= 0 ? value.depth : 0;
  const fingerprint = value => JSON.stringify({ id: value.id, cursors: value.cursors });
  const restore = value => {
    pendingRestore = fingerprint(value);
    getFrame()?.contentWindow?.postMessage({ type: 'mentication:restore-screen', journeyId: id, screen: value }, host.location.origin);
  };
  const receive = event => {
    if (event.origin !== host.location.origin || event.source !== getFrame()?.contentWindow || event.data?.journeyId !== id) return;
    const current = host.history.state?.[field];
    if (event.data.type === 'mentication:screen-back') {
      if (normalize(current) && depthOf(current) > 0) {
        try { host.history.back(); }
        catch { onError?.('Browser navigation is unavailable. You can keep using this practice.'); }
      }
      else onExit();
      return;
    }
    if (event.data.type !== 'mentication:screen') return;
    const incoming = normalize(event.data.screen);
    const mode = event.data.mode;
    if (!incoming || !['init', 'push', 'replace'].includes(mode)) return;
    // A frame's delayed echo of Forward must not replace the entry reached by
    // a newer Back. A push is an explicit new user navigation, not an echo.
    if (mode === 'replace' && pendingRestore && fingerprint(incoming) !== pendingRestore) return;
    if (mode !== 'init') pendingRestore = null;
    const existing = normalize(current);
    if (mode === 'init' && existing) { restore({ ...existing, depth: depthOf(current) }); return; }
    const depth = existing ? depthOf(current) : 0;
    const next = { ...incoming, depth: mode === 'push' ? depth + 1 : depth };
    const previous = host.history.state || {};
    // Preserve Router's user state/key. Add to its index only for a real entry.
    const state = { ...previous, [field]: next };
    try {
      if (mode === 'push') {
        state.idx = (Number.isSafeInteger(previous.idx) ? previous.idx : 0) + 1;
        host.history.pushState(state, '');
      } else host.history.replaceState(state, '');
    } catch {
      onError?.('Browser navigation is unavailable. You can keep using this practice.');
      return;
    }
    if (mode === 'init') restore(next);
  };
  const popped = event => {
    const value = event.state?.[field];
    const screen = normalize(value);
    if (screen) restore({ ...screen, depth: depthOf(value) });
  };
  host.addEventListener('message', receive);
  host.addEventListener('popstate', popped);
  return () => {
    host.removeEventListener('message', receive);
    host.removeEventListener('popstate', popped);
  };
}
