// A document owns one isolation snapshot, not one per modal. Nested sheets can
// unmount in either order without restoring another sheet's temporary state.
const dialogDocuments = new WeakMap();
const FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,iframe,[contenteditable="true"],[tabindex]';

function focus(element) {
  if (!element?.isConnected || typeof element.focus !== 'function') return;
  try { element.focus({ preventScroll: true }); } catch { element.focus(); }
}

function restoreAttribute(element, name, value) {
  if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
}

// CSSOM assignment leaves style="" after its last declaration is removed.
// Remove only that empty shell, never styles added by another owner while open.
function restoreEmptyStyle(element, previousStyle) {
  if (previousStyle === null && element.getAttribute('style') === '') element.removeAttribute('style');
}

function createDialogState(doc) {
  const body = doc.body;
  const state = { stack: [], hidden: new Map(), overflow: body.style.overflow, style: body.getAttribute('style'), observer: null };
  state.sync = () => {
    const top = state.stack[state.stack.length - 1];
    const isolate = state.stack.some(item => item.fallback);
    // A native modal's top layer makes an ordinary fallback above it inert.
    // Keep the remaining stack in fallback mode if a partial native API fails.
    if (top?.fallback) {
      for (const item of state.stack) {
        if (!item.fallback) {
          item.fallback = true;
          if (item.node.open) item.node.close();
          item.enableFallback();
        }
      }
    }
    state.stack.forEach((item, index) => {
      if (item.fallback) item.layer.style.zIndex = String(10000 + index);
    });
    const shouldHide = sibling => {
      if (!isolate || sibling === top?.layer || sibling.contains(top?.node)) return false;
      // A portal can mount before its opening effect. Leave it available until
      // it joins the stack, rather than snapshotting an already-hidden modal.
      return !sibling.classList.contains('mcn-modal-layer') || state.stack.some(item => item.layer === sibling);
    };
    for (const [sibling, previous] of state.hidden) {
      if (shouldHide(sibling)) continue;
      restoreAttribute(sibling, 'aria-hidden', previous.aria);
      restoreAttribute(sibling, 'inert', previous.inert);
      sibling.style.pointerEvents = previous.pointerEvents;
      restoreEmptyStyle(sibling, previous.style);
      state.hidden.delete(sibling);
    }
    for (const sibling of body.children) {
      if (!shouldHide(sibling) || state.hidden.has(sibling)) continue;
      state.hidden.set(sibling, { aria: sibling.getAttribute('aria-hidden'), inert: sibling.getAttribute('inert'), pointerEvents: sibling.style.pointerEvents, style: sibling.getAttribute('style') });
      sibling.setAttribute('aria-hidden', 'true');
      sibling.setAttribute('inert', '');
      sibling.style.pointerEvents = 'none';
    }
    body.style.overflow = state.stack.length ? 'hidden' : state.overflow;
    if (!state.stack.length) restoreEmptyStyle(body, state.style);
  };
  const Observer = doc.defaultView?.MutationObserver;
  state.observer = Observer ? new Observer(state.sync) : null;
  state.observer?.observe(body, { childList: true });
  return state;
}

// Native <dialog> arrived in iOS 15.4. Keep the same accessible sheet on earlier
// supported WebKit, without relaxing focus/background isolation or device support.
export function openAccessibleDialog(node, layer, { opener, onClose }) {
  const doc = node.ownerDocument;
  let state = dialogDocuments.get(doc);
  if (!state) { state = createDialogState(doc); dialogDocuments.set(doc, state); }
  const previousTabIndex = node.getAttribute('tabindex');
  const previousOpen = node.getAttribute('open');
  const previousStyle = layer.getAttribute('style');
  const previousZIndex = layer.style.zIndex;
  const previousFallback = layer.getAttribute('data-fallback');
  const identity = { node, layer, opener, fallback: false, enableFallback: () => {
    layer.dataset.fallback = 'true';
    node.setAttribute('open', '');
    node.setAttribute('tabindex', '-1');
  } };
  state.stack.push(identity);
  if (typeof node.showModal === 'function' && typeof node.close === 'function') {
    try { node.showModal(); } catch { identity.fallback = true; }
  } else identity.fallback = true;
  if (identity.fallback) identity.enableFallback();

  const candidates = () => [...node.querySelectorAll(FOCUSABLE)].filter(element =>
    element.tabIndex >= 0 && !element.closest('[hidden],[inert],[aria-hidden="true"]') && element.getClientRects().length > 0);
  const focusFirst = () => focus(candidates()[0] || node);
  identity.focusFirst = focusFirst;
  const isTop = () => state.stack[state.stack.length - 1] === identity;
  const containFocus = event => { if (identity.fallback && isTop() && !node.contains(event.target)) focusFirst(); };
  const keydown = event => {
    if (!isTop()) return;
    if (event.key === 'Escape' && identity.fallback) { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    if (event.key !== 'Tab') return;
    const items = candidates();
    const first = items[0], last = items[items.length - 1];
    if (!first) { event.preventDefault(); focus(node); return; }
    if (!node.contains(doc.activeElement) || doc.activeElement === node ||
        (event.shiftKey && doc.activeElement === first) || (!event.shiftKey && doc.activeElement === last)) {
      event.preventDefault(); focus(event.shiftKey ? last : first);
    }
  };
  // Move focus before hiding the opener's tree from assistive technology.
  if (identity.fallback) focusFirst();
  state.sync();
  // Demoting a native ancestor can move focus back to its opener.
  if (!node.contains(doc.activeElement)) focusFirst();
  doc.addEventListener('keydown', keydown, true);
  doc.addEventListener('focusin', containFocus, true);

  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    const wasTop = isTop();
    doc.removeEventListener('keydown', keydown, true);
    doc.removeEventListener('focusin', containFocus, true);
    // If an ancestor disappears first, its descendants must eventually return
    // focus to that ancestor's opener, not a control in the removed sheet.
    for (const item of state.stack) {
      if (item !== identity && node.contains(item.opener)) item.opener = identity.opener;
    }
    state.stack.splice(state.stack.indexOf(identity), 1);
    if (!identity.fallback && node.open) node.close();
    if (identity.fallback) {
      restoreAttribute(node, 'open', previousOpen);
      restoreAttribute(node, 'tabindex', previousTabIndex);
      restoreAttribute(layer, 'data-fallback', previousFallback);
      layer.style.zIndex = previousZIndex;
    }
    state.sync();
    if (identity.fallback) restoreEmptyStyle(layer, previousStyle);
    const top = state.stack[state.stack.length - 1];
    if (!top) {
      state.observer?.disconnect();
      dialogDocuments.delete(doc);
    }
    if (wasTop) {
      const opener = identity.opener;
      if (!top || top.node.contains(opener)) focus(opener);
      else top.focusFirst();
    }
    if (top && !top.node.contains(doc.activeElement)) top.focusFirst();
  };
}
