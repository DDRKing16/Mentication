import React from "react";
import { motion } from "framer-motion";
import { TASTE_DROP } from "@/lib/grounding54321Layout";

// TASTE — one warm champagne-gold droplet drifting slowly into the centre of
// the figure. On contact a restrained internal bloom of warm pearl light
// spreads through the figure (handled by the settle bloom in HumanOrb once
// progress is near the end).
export default function TasteDroplet({ progress }) {
  const p = Math.min(1, Math.max(0, progress));
  const travel = Math.min(1, p / 0.7);
  const cx = TASTE_DROP.x + (TASTE_DROP.target.x - TASTE_DROP.x) * travel;
  const cy = TASTE_DROP.y + (TASTE_DROP.target.y - TASTE_DROP.y) * travel;
  const contact = p > 0.7;
  return (
    <g>
      <defs>
        <filter id="tasteGlow" x="-140%" y="-140%" width="380%" height="380%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
      {contact && (
        <motion.circle
          cx={TASTE_DROP.target.x}
          cy={TASTE_DROP.target.y}
          fill="rgba(232,217,168,0.4)"
          filter="url(#tasteGlow)"
          initial={{ r: 2, opacity: 0 }}
          animate={{ r: [2, 10], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <motion.circle
        cx={cx}
        cy={cy}
        r={2.1}
        fill="rgba(232,217,168,0.95)"
        filter="url(#tasteGlow)"
        animate={{ opacity: contact ? 0 : [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}