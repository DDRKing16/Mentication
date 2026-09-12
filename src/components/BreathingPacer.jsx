import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { haptic, setHapticsEnabled } from "@/lib/feedback";
import EmeraldGlassSquare from "@/components/EmeraldGlassSquare";

// phases: [{ label, sec }]. Loops continuously; calls onPhaseChange with the label.
export default function BreathingPacer({ phases, discreet = false, tone = "primary", shape = "circle" }) {
  const [index, setIndex] = useState(0);
  const phase = phases[index % phases.length];
  const roundClass = shape === "square" ? "rounded-[2.2rem]" : "rounded-full";
  const a11y = useAccessibilityPrefs();

  useEffect(() => { setHapticsEnabled(!a11y.prefs.reducedMotion); }, [a11y.prefs.reducedMotion]);

  useEffect(() => {
    // a faint tactile pulse at the moment the breath changes direction
    if (!discreet) haptic(10);
    const t = setTimeout(() => setIndex((i) => (i + 1) % phases.length), phase.sec * 1000);
    return () => clearTimeout(t);
  }, [index, phase.sec, phases.length, discreet]);

  const isExpand = phase.label.toLowerCase().includes("in") || phase.label.toLowerCase().includes("more");
  const target = isExpand ? 1 : 0.55;
  const isSquare = shape === "square";

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex h-56 w-56 items-center justify-center">
        {isSquare ? (
          /* Box / hold patterns — premium translucent emerald-glass square.
             Same scale + opacity animation as the circle; only the material
             is upgraded. Timing, size range and breathing logic unchanged. */
          <motion.div
            className="absolute h-44 w-44"
            initial={false}
            animate={{ scale: target, opacity: discreet ? 0.45 : (isExpand ? 0.95 : 0.55) }}
            transition={{ duration: phase.sec, ease: "easeInOut" }}
          >
            <EmeraldGlassSquare discreet={discreet} />
          </motion.div>
        ) : (
          <>
            <motion.div
              className={`absolute h-44 w-44 ${roundClass} bg-gradient-to-br from-teal/30 to-indigo/30 ${discreet ? "" : "breath-glow"}`}
              initial={false}
              animate={{ scale: target, opacity: discreet ? 0.4 : (isExpand ? 0.9 : 0.5) }}
              transition={{ duration: phase.sec, ease: "easeInOut" }}
            />
            <motion.div
              className={`absolute h-28 w-28 ${roundClass} bg-gradient-to-br from-teal/50 to-indigo/50`}
              initial={false}
              animate={{ scale: target }}
              transition={{ duration: phase.sec, ease: "easeInOut" }}
            />
          </>
        )}
        <div className="relative z-10 h-3 w-3 rounded-full bg-white/90 shadow" />
      </div>
      <span className={"font-heading text-2xl tracking-tight " + (tone === "cream" ? "text-cream/90" : "text-primary")}>{phase.label}</span>
    </div>
  );
}