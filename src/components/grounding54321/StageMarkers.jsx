import React from "react";
import { motion } from "framer-motion";
import { STAGES } from "@/lib/grounding54321Layout";

// Five small stage markers at the top of the scene. The active stage glows
// softly, completed stages stay subtly filled, and upcoming stages use faint
// outlines.
export default function StageMarkers({ activeSense }) {
  const activeIndex = Math.max(0, STAGES.findIndex((s) => s.sense === activeSense));
  return (
    <div className="flex items-center gap-2.5">
      {STAGES.map((s, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <span key={s.sense} className="relative flex h-2.5 w-2.5 items-center justify-center">
            {active && (
              <motion.span
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{ background: s.accent }}
                animate={{ opacity: [0.45, 0.9, 0.45], scale: [1, 1.3, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span
              className="relative h-2 w-2 rounded-full"
              style={
                active
                  ? { background: s.accent, boxShadow: `0 0 10px 2px ${s.accent}55` }
                  : done
                  ? { background: `${s.accent}66` }
                  : { background: "transparent", boxShadow: `inset 0 0 0 1px ${s.accent}66` }
              }
            />
          </span>
        );
      })}
    </div>
  );
}