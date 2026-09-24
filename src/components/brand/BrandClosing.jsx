import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { haptic } from "@/lib/feedback";
import {
  BRAND_EASE,
  BRAND_HANDOFF_MS,
  getBrandAtmosphere,
  getBrandCoral,
  getBrandInk,
  getBrandLogoParts,
} from "@/lib/interventionBrand";
import { BrandHairline, BrandLockup } from "@/components/brand/BrandLockup";

const BRAND_CLOSING_MS = 1500;

/**
 * The Closing: the mirror of the Threshold, played once as a session ends.
 * The coral thread draws in, then the real logo and wordmark resolve out of
 * it, dressed in the colour world of the intervention the session just
 * finished with -- so every session, whichever door it went through, closes
 * the same way.
 *
 * - Tap anywhere to skip.
 * - Skipped entirely when Reduce motion is on.
 * - `onDone` fires once, whether the moment played or was skipped; the
 *   caller advances to whatever comes after (the shared "done" screen, or
 *   navigating home) only from there, so nothing about the intervention's
 *   own completion logic changes shape.
 */
export default function BrandClosing({ id, onDone }) {
  const { prefs } = useAccessibilityPrefs();
  const reduced = !!prefs.reducedMotion;
  const [open, setOpen] = useState(true);
  const doneRef = useRef(false);
  const liftRef = useRef(null);

  const atmosphere = getBrandAtmosphere(id);
  const coral = getBrandCoral(id);
  const ink = getBrandInk(id);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    liftRef.current = setTimeout(() => setOpen(false), BRAND_HANDOFF_MS);
  };

  useEffect(() => {
    if (reduced) {
      doneRef.current = true;
      onDone?.();
      return undefined;
    }
    const tick = setTimeout(() => haptic(10), 500);
    const end = setTimeout(finish, BRAND_CLOSING_MS);
    return () => {
      clearTimeout(tick);
      clearTimeout(end);
      clearTimeout(liftRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced) return null;

  return (
    <AnimatePresence onExitComplete={() => onDone?.()}>
      {open && (
        <motion.button
          key="closing"
          type="button"
          data-sfx="none"
          aria-label="Closing this session. Tap to skip."
          onClick={finish}
          className="fixed inset-0 z-[80] flex cursor-default flex-col items-center justify-center overflow-hidden px-8 text-center outline-none"
          style={{
            background: `radial-gradient(60% 46% at 50% 42%, ${atmosphere.glow}, transparent 70%), ${atmosphere.background}`,
            color: ink,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: BRAND_EASE } }}
        >
          <BrandLockup parts={getBrandLogoParts(id)} className="w-64 max-w-[75vw]" />
          <BrandHairline coral={coral} delay={1.35} className="mt-6 w-32" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
