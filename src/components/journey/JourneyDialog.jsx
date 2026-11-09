import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { openAccessibleDialog } from '@/lib/accessibleDialog';
import '@/styles/accessible-modal.css';

// Keep the children mounted between visits, including a draft in nested Options.
// Each sheet has its own body-level layer for the pre-iOS-15.4 modal fallback.
export default function JourneyDialog({ open, opener, onClose, className, children, ...label }) {
  const dialog = useRef(null), layer = useRef(null), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    return openAccessibleDialog(dialog.current, layer.current, {
      opener: opener.current,
      onClose: () => close.current(),
    });
  }, [open, opener]);
  return createPortal(<div ref={layer} hidden={!open} className={`mcn-modal-layer journey-dialog-layer ${className}-layer`}
    onClick={event => {
      if (event.target === event.currentTarget && layer.current?.dataset.fallback === 'true') onClose();
    }}>
    <dialog ref={dialog} className={`mcn-accessible-modal ${className}`} {...label} role="dialog" aria-modal="true"
      onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
      {children}
    </dialog>
  </div>, document.body);
}
