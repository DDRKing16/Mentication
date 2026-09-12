import React from "react";
import { motion } from "framer-motion";
import { HEAR_WAVES, GROUNDING_V2_CENTER } from "@/lib/grounding54321Layout";
import { useActivation } from "@/components/grounding54321/useActivation";

// HEAR — three delicate powder-blue sound waves arriving from different
// directions and passing softly through the figure. No speaker or audio
// icons.
export default function HearWaves({ progress, running }) {
  const { activated, activate } = useActivation(HEAR_WAVES.length, progress);
  return (
    <g>
      {HEAR_WAVES.map((w, i) => {
        const on = activated[i];
        return (
          <g key={w.id}>
            {on &&
              [0, 1, 2].map((k) => (
                <motion.circle
                  key={k}
                  fill="none"
                  stroke="rgba(168,200,224,0.55)"
                  strokeWidth={0.4}
                  initial={{ cx: w.x, cy: w.y, r: 2, opacity: 0 }}
                  animate={{
                    cx: [w.x, GROUNDING_V2_CENTER.x],
                    cy: [w.y, GROUNDING_V2_CENTER.y],
                    r: [2, 9],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: k * 0.85 }}
                />
              ))}
            {!on && (
              <circle
                cx={w.x}
                cy={w.y}
                r={3}
                fill="transparent"
                stroke="rgba(168,200,224,0.2)"
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