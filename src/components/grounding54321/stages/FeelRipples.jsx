import React from "react";
import { motion } from "framer-motion";
import { FEEL_POINTS } from "@/lib/grounding54321Layout";
import { useActivation } from "@/components/grounding54321/useActivation";

// FEEL — four soft translucent touch-ripples. Each expands gently toward a
// different area of the figure, suggesting a subtle distortion across the
// glass surface. Slow, tactile and restrained.
export default function FeelRipples({ progress, running }) {
  const { activated, activate } = useActivation(FEEL_POINTS.length, progress);
  return (
    <g>
      {FEEL_POINTS.map((p, i) => {
        const on = activated[i];
        return (
          <g key={p.id}>
            {on && (
              <>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  fill="none"
                  stroke="rgba(201,184,224,0.5)"
                  strokeWidth={0.4}
                  initial={{ r: 2, opacity: 0.6 }}
                  animate={{ r: [2, 7, 9], opacity: [0.6, 0.22, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  fill="none"
                  stroke="rgba(168,200,224,0.45)"
                  strokeWidth={0.35}
                  initial={{ r: 1, opacity: 0.7 }}
                  animate={{ r: [1, 5, 7], opacity: [0.7, 0.2, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 0.85 }}
                />
                <circle cx={p.x} cy={p.y} r={1.1} fill="rgba(255,253,248,0.85)" />
              </>
            )}
            {!on && (
              <circle
                cx={p.x}
                cy={p.y}
                r={2.4}
                fill="transparent"
                stroke="rgba(201,184,224,0.2)"
                strokeWidth={0.3}
                style={{ cursor: "pointer" }}
                onClick={() => activate(i)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}