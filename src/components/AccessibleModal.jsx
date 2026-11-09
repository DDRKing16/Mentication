import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { openAccessibleDialog } from '@/lib/accessibleDialog';
import '@/styles/accessible-modal.css';
export default function AccessibleModal({ titleId, onClose, children, className = '' }) {
  const dialog = useRef(null), layer = useRef(null), opener = useRef(document.activeElement), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => openAccessibleDialog(dialog.current, layer.current, { opener: opener.current, onClose: () => close.current() }), []);
  return createPortal(
    <div ref={layer} className="mcn-modal-layer" onClick={event => { if (event.target === event.currentTarget && layer.current?.dataset.fallback === 'true') onClose(); }}>
      <dialog ref={dialog} className={`mcn-accessible-modal ${className}`} aria-labelledby={titleId} role="dialog" aria-modal="true"
        onCancel={event => { event.preventDefault(); onClose(); }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
        }}>{children}</dialog>
    </div>, document.body);
}
