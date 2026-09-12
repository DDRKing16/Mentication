import React from "react";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";

const PRESETS = [
  { min: 5, label: "5 min" },
  { min: 10, label: "10 min" },
  { min: 15, label: "15 min" },
  { min: 20, label: "20 min" },
  { min: 30, label: "30 min" },
  { min: 45, label: "45 min" },
];

export default function SleepTimerSheet({ active, secondsLeft, onPick, onCancel, onClose }) {
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-28 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-cream/10 bg-[hsl(178_36%_13%)]/95 p-5 backdrop-blur-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cream/55">
          <Moon className="h-3.5 w-3.5" /> Sleep timer
        </span>
        <button onClick={onClose} className="no-tap text-cream/50 transition-colors hover:text-cream text-xs">Done</button>
      </div>

      {active ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <span className="font-heading text-4xl tabular-nums text-cream">{fmt(secondsLeft)}</span>
          <button onClick={onCancel} className="no-tap rounded-full border border-cream/15 bg-white/5 px-5 py-2 text-sm text-cream/80 transition-colors hover:bg-white/10">
            Cancel timer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.min}
              onClick={() => onPick(p.min)}
              className="no-tap rounded-xl border border-cream/10 bg-white/5 py-3 text-sm font-medium text-cream/80 transition-colors hover:bg-white/10"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-cream/40">Sounds fade out gently when the timer ends.</p>
    </motion.div>
  );
}