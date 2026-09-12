import React from "react";
import { motion } from "framer-motion";
import { SMELL_WISPS } from "@/lib/grounding54321Layout";
import { useActivation } from "@/components/grounding54321/useActivation";

// SMELL — two translucent apricot-lavender wisps rising and curling gently
// around the figure before dissolving into its pearl material. Abstract and
// elegant, not like smoke.
export default function SmellWisps({ progress, running }) {
  const { activated, activate } = useActivation(SMELL_WISPS.length, progress);
  return (
    <g>
      <defs>
        <filter id="smellBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>
      {SMELL_WISPS.map((p, i) => {
        const on = activated[i];
        const curl = i === 0 ? 1 : -1;
        const path = `M ${p.x} ${p.y} C ${p.x + curl * 8} ${p.y - 14}, ${p.x - curl * 6} ${p.y - 26}, ${p.x + curl * 2} ${p.y - 40}`;
        return (
          <g key={p.id}>
            {on && (
              <motion.path
                d={path}
                fill="none"
                stroke={i === 0 ? "rgba(242,201,160,0.6)" : "rgba(201,184,224,0.6)"}
                strokeWidth={1.1}
                strokeLinecap="round"
                filter="url(#smellBlur)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.7, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            {!on && (
              <circle
                cx={p.x}
                cy={p.y}
                r={3}
                fill="transparent"
                stroke="rgba(242,201,160,0.2)"
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