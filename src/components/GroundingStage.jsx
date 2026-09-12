import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Purpose-built grounding stage.
//
// Most grounding practices are counting prompts — "5 things you see", "4 you
// can touch", "Find five textures". Instead of decorative rings, we render the
// count itself as the anchor: a large number the eye can settle on, surrounded
// by that many dots that fill one-by-one as the step's time elapses. Each new
// lit dot is one thing named — a quiet, visible sense of progress that mirrors
// the practice. Steps without a count fall back to calming radiating rings.

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function extractCount(step) {
  const text = `${step?.title || ""} ${step?.body || ""}`.toLowerCase();
  const m = text.match(/\b(\d{1,2})\b/);
  if (m) { const v = parseInt(m[1], 10); if (v >= 1 && v <= 10) return v; }
  for (const w in WORDS) if (new RegExp(`\\b${w}\\b`).test(text)) return WORDS[w];
  return null;
}

function senseFromTitle(title = "") {
  const t = title.toLowerCase();
  if (t.includes("see") || t.includes("colour") || t.includes("gaze") || t.includes("look") || t.includes("orient")) return "sight";
  if (t.includes("touch") || t.includes("feel") || t.includes("texture") || t.includes("contact") || t.includes("weight") || t.includes("feet") || t.includes("hand")) return "touch";
  if (t.includes("hear") || t.includes("sound") || t.includes("listen")) return "sound";
  if (t.includes("smell") || t.includes("scent") || t.includes("aroma")) return "scent";
  if (t.includes("taste") || t.includes("sip") || t.includes("savour")) return "taste";
  return "notice";
}

function Rings({ running, discreet }) {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      <motion.span
        className="absolute h-56 w-56 rounded-full border border-dashed border-teal/15"
        animate={{ rotate: running ? 360 : 0 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-teal/30"
          style={{ height: 56, width: 56 }}
          animate={running ? { scale: [1, 4], opacity: [0.55, 0] } : { scale: 1, opacity: discreet ? 0.3 : 0.5 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: i * 0.9 }}
        />
      ))}
      <motion.span
        className="relative h-4 w-4 rounded-full bg-teal shadow-[0_0_22px_hsl(178_55%_45%/0.7)]"
        animate={{ scale: running ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function GroundingStage({ step, stepRemaining, running, discreet }) {
  const n = useMemo(() => extractCount(step), [step]);
  const sense = useMemo(() => senseFromTitle(step?.title), [step?.title]);

  if (!n) return <Rings running={running} discreet={discreet} />;

  const pct = step?.holdSec ? Math.min(1, Math.max(0, 1 - stepRemaining / step.holdSec)) : 0;
  const lit = Math.round(pct * n);
  const R = 104;
  const dots = Array.from({ length: n });

  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      {!discreet && (
        <motion.div
          className="absolute h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle,hsl(178_55%_45%/0.12),transparent 65%)" }}
          animate={{ scale: running ? [1, 1.06, 1] : 1, opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <svg className="absolute h-64 w-64" viewBox="0 0 256 256">
        {dots.map((_, i) => {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = 128 + R * Math.cos(ang);
          const y = 128 + R * Math.sin(ang);
          const on = i < lit;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={on ? 7 : 5}
              fill={on ? "hsl(178 55% 50%)" : "transparent"}
              stroke={on ? "transparent" : "hsl(30 30% 90% / 0.22)"}
              strokeWidth={1.5}
              initial={false}
              animate={{ opacity: on ? 1 : 0.5 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ filter: on ? "drop-shadow(0 0 6px hsl(178 55% 50% / 0.55))" : "none" }}
            />
          );
        })}
      </svg>
      <div className="relative flex flex-col items-center">
        <motion.span
          key={n}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-[5rem] font-medium leading-none tabular-nums text-cream"
        >
          {n}
        </motion.span>
        <span className="mt-2 text-[0.62rem] uppercase tracking-[0.24em] text-cream/45">{sense}</span>
      </div>
    </div>
  );
}