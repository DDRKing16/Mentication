import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { haptic } from "@/lib/feedback";
import {
  BRAND_EASE,
  BRAND_HANDOFF_MS,
  BRAND_THRESHOLD_MS,
  getBrandAtmosphere,
  getBrandCoral,
  getBrandInk,
} from "@/lib/interventionBrand";
import { BrandDoorway, BrandSwash } from "@/components/brand/BrandDoorway";

/**
 * The Threshold: a short (under 2s) brand moment shown before an intervention
 * begins. It is dressed in that intervention's own colour world, but the mark
 * on top is always the same: the coral Doorway draws itself, the coral Thread
 * sweeps under the name, then the door opens onto the intervention.
 *
 * - Tap anywhere to skip.
 * - Skipped entirely when Reduce motion is on.
 * - Nothing about the intervention itself is delayed or changed; the
 *   intervention mounts after the threshold, so its clocks and narration start
 *   fresh.
 */
export default function BrandThreshold({ id, name, onReady, onDone }) {
  const { prefs } = useAccessibilityPrefs();
  const reduced = !!prefs.reducedMotion;
  const [open, setOpen] = useState(true);
  const doneRef = useRef(false);
  const liftRef = useRef(null);

  const atmosphere = getBrandAtmosphere(id);
  const coral = getBrandCoral(id);
  const ink = getBrandInk(id);

  // Two-step finish: (1) tell the wrapper to mount the intervention underneath
  // the still-opaque overlay, (2) after a short handoff, lift the overlay.
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onReady?.();
    liftRef.current = setTimeout(() => setOpen(false), BRAND_HANDOFF_MS);
  };

  useEffect(() => {
    if (reduced) {
      doneRef.current = true;
      onReady?.();
      onDone?.();
      return undefined;
    }
    const tick = setTimeout(() => haptic(10), 900);
    const end = setTimeout(finish, BRAND_THRESHOLD_MS);
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
          key="threshold"
          type="button"
          data-sfx="none"
          aria-label={`Starting ${name}. Tap to skip.`}
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
          <BrandDoorway coral={coral} ink={ink} className="h-32 w-28" />

          <motion.p
            className="mt-7 text-[0.68rem] font-semibold uppercase tracking-[0.32em]"
            style={{ color: ink, opacity: 0.6 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: BRAND_EASE }}
          >
            Mentication
          </motion.p>

          <motion.h1
            className="mt-2 text-[2rem] italic leading-tight"
            style={{ fontFamily: "var(--font-editorial)", color: ink }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: BRAND_EASE }}
          >
            {name}
          </motion.h1>

          <BrandSwash coral={coral} delay={1} className="mt-3 h-5 w-52" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
