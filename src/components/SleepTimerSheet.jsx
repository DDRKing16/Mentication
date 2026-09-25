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
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-50 flex justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="intervention-themed-surface pointer-events-auto w-[min(92vw,24rem)] rounded-2xl border p-5 backdrop-blur-md"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="intervention-copy-muted flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
            <Moon className="h-3.5 w-3.5" /> Sleep timer
          </span>
          <button onClick={onClose} className="no-tap intervention-copy-muted text-xs transition-opacity hover:opacity-70">Done</button>
        </div>

        {active ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="intervention-copy-primary font-heading text-4xl tabular-nums">{fmt(secondsLeft)}</span>
            <button onClick={onCancel} className="intervention-chip no-tap rounded-full border px-5 py-2 text-sm transition-colors">
              Cancel timer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.min}
                onClick={() => onPick(p.min)}
                className="intervention-chip no-tap rounded-xl border py-3 text-sm font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <p className="intervention-copy-muted mt-3 text-center text-xs opacity-80">Sounds fade out gently when the timer ends.</p>
      </motion.div>
    </div>
  );
}
