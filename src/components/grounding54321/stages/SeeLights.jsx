import React from "react";
import { motion } from "framer-motion";
import { SEE_LIGHTS, GROUNDING_V2_CENTER } from "@/lib/grounding54321Layout";
import { useActivation } from "@/components/grounding54321/useActivation";

// SEE — five sensory lights around the figure (sage, apricot, powder blue,
// lavender, champagne gold). They brighten sequentially across the stage and
// each draws a fine curved trail connecting back into the figure. Tapping a
// light brings it into focus early as a quiet acknowledgement.
export default function SeeLights({ progress, running }) {
  const { activated, activate } = useActivation(SEE_LIGHTS.length, progress);
  return (
    <g>
      <defs>
        <filter id="seeGlow" x="-140%" y="-140%" width="380%" height="380%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      {SEE_LIGHTS.map((l, i) => {
        const on = activated[i];
        const mx = (l.x + GROUNDING_V2_CENTER.x) / 2 + (i % 2 ? 6 : -6);
        const my = (l.y + GROUNDING_V2_CENTER.y) / 2 - 4;
        const d = `M ${l.x} ${l.y} Q ${mx} ${my} ${GROUNDING_V2_CENTER.x} ${GROUNDING_V2_CENTER.y}`;
        return (
          <g key={l.id}>
            <motion.path
              d={d}
              fill="none"
              stroke={l.color}
              strokeWidth={0.35}
              strokeLinecap="round"
              initial={false}
              animate={{ opacity: on ? 0.5 : 0, pathLength: on ? 1 : 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            {on && (
              <motion.circle
                cx={l.x}
                cy={l.y}
                r={3.2}
                fill={l.glow}
                filter="url(#seeGlow)"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <motion.circle
              cx={l.x}
              cy={l.y}
              r={on ? 1.5 : 0.9}
              fill={l.color}
              initial={false}
              animate={{ opacity: on ? 1 : 0.3 }}
              transition={{ duration: 0.6 }}
            />
            <circle
              cx={l.x}
              cy={l.y}
              r={5}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => activate(i)}
            />
          </g>
        );
      })}
    </g>
  );
}