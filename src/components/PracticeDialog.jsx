import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { openAccessibleDialog } from '@/lib/accessibleDialog';
import '@/styles/practice-dialog.css';

// Keep practice-specific theme tokens and layouts while sharing the tested
// native/early-WebKit focus, Escape and background-isolation lifecycle.
export default function PracticeDialog({ titleId, theme, className, onClose, dismissBackdrop = false, children }) {
  const dialog = useRef(null), layer = useRef(null);
  const opener = useRef(document.activeElement), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => openAccessibleDialog(dialog.current, layer.current, { opener: opener.current, onClose: () => close.current() }), []);
  return createPortal(
    <div ref={layer} className={`mcn-modal-layer mcn-practice-layer ${theme}`}>
      <dialog ref={dialog} className={className} role="dialog" aria-modal="true" aria-labelledby={titleId}
        onCancel={event => { event.preventDefault(); onClose(); }}
        onClick={event => { if (dismissBackdrop && event.target === event.currentTarget) onClose(); }}>
        {children}
      </dialog>
    </div>, document.body);
}
