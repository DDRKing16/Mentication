const activeFallbacks = [];
const FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[contenteditable="true"],[tabindex]';

function focus(element) {
  if (!element?.isConnected || typeof element.focus !== 'function') return;
  try { element.focus({ preventScroll: true }); } catch { element.focus(); }
}

// Native <dialog> arrived in iOS 15.4. Keep the same accessible sheet on earlier
// supported WebKit, without relaxing focus/background isolation or device support.
export function openAccessibleDialog(node, layer, { opener, onClose }) {
  if (typeof node.showModal === 'function' && typeof node.close === 'function') {
    try {
      node.showModal();
      return () => { if (node.open) node.close(); focus(opener); };
    } catch { /* A partial implementation still gets the keyboard-safe fallback. */ }
  }

  const doc = node.ownerDocument;
  const body = doc.body;
  const overflow = body.style.overflow;
  const previousTabIndex = node.getAttribute('tabindex');
  const hidden = new Map();
  const identity = { layer };
  activeFallbacks.push(identity);
  layer.dataset.fallback = 'true';
  node.setAttribute('open', '');
  node.setAttribute('tabindex', '-1');
  body.style.overflow = 'hidden';

  const candidates = () => [...node.querySelectorAll(FOCUSABLE)].filter(element =>
    element.tabIndex >= 0 && !element.closest('[hidden],[inert],[aria-hidden="true"]') && element.getClientRects().length > 0);
  const focusFirst = () => focus(candidates()[0] || node);
  const isTop = () => activeFallbacks[activeFallbacks.length - 1] === identity;
  const containFocus = event => { if (isTop() && !node.contains(event.target)) focusFirst(); };
  const keydown = event => {
    if (!isTop()) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return; }
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
  focusFirst();
  const isolateBackground = () => {
    for (const sibling of body.children) {
      if (sibling === layer || hidden.has(sibling)) continue;
      // Do not hide a newer modal while React mounts it or while it is on top.
      const siblingModal = activeFallbacks.findIndex(item => item.layer === sibling);
      if (sibling.classList.contains('mcn-modal-layer') &&
          (siblingModal < 0 || siblingModal > activeFallbacks.indexOf(identity))) continue;
      hidden.set(sibling, { aria: sibling.getAttribute('aria-hidden'), inert: sibling.getAttribute('inert'), pointerEvents: sibling.style.pointerEvents });
      sibling.setAttribute('aria-hidden', 'true');
      sibling.setAttribute('inert', '');
      // The overlay and focus handlers also work where `inert` is unsupported.
      sibling.style.pointerEvents = 'none';
    }
  };
  isolateBackground();
  const Observer = doc.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(isolateBackground) : null;
  observer?.observe(body, { childList: true });
  doc.addEventListener('keydown', keydown, true);
  doc.addEventListener('focusin', containFocus, true);

  return () => {
    observer?.disconnect();
    doc.removeEventListener('keydown', keydown, true);
    doc.removeEventListener('focusin', containFocus, true);
    activeFallbacks.splice(activeFallbacks.indexOf(identity), 1);
    for (const [sibling, previous] of hidden) {
      for (const [name, value] of [['aria-hidden', previous.aria], ['inert', previous.inert]]) {
        if (value === null) sibling.removeAttribute(name); else sibling.setAttribute(name, value);
      }
      sibling.style.pointerEvents = previous.pointerEvents;
    }
    body.style.overflow = overflow;
    node.removeAttribute('open');
    if (previousTabIndex === null) node.removeAttribute('tabindex'); else node.setAttribute('tabindex', previousTabIndex);
    delete layer.dataset.fallback;
    focus(opener);
  };
}
