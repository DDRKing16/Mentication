import React from "react";
import { motion } from "framer-motion";
import { X, Type, Move, Captions, Contrast, Hand, RotateCcw } from "lucide-react";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";

const TOGGLES = [
  { key: "largeText", label: "Larger text", icon: Type, hint: "Scale up text app-wide" },
  { key: "reducedMotion", label: "Reduce motion", icon: Move, hint: "Calm, still transitions" },
  { key: "captions", label: "Captions on by default", icon: Captions, hint: "Show narration text" },
  { key: "highContrast", label: "Higher contrast", icon: Contrast, hint: "Stronger text and borders" },
  { key: "oneHanded", label: "One-handed layout", icon: Hand, hint: "Reachable, bottom-anchored" },
];

export default function AccessibilityPanel({ onClose, dark = false }) {
  const { prefs, setPref, reset } = useAccessibilityPrefs();
  const card = dark ? "bg-[hsl(178_36%_13%)] text-cream border-cream/15" : "bg-card text-foreground border-border";
  const row = dark ? "border-cream/10 bg-white/5" : "border-border bg-background/60";
  const sub = dark ? "text-cream/60" : "text-muted-foreground";
  const trackOff = dark ? "bg-cream/20" : "bg-secondary";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={"w-full max-w-md rounded-3xl border p-6 pb-8 soft-depth " + card}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-xl font-medium tracking-tight">Accessibility</span>
          <button onClick={onClose} aria-label="Close" className="no-tap opacity-60 transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className={"mt-1 text-sm " + sub}>Make Mentication work for you. Changes save automatically.</p>

        <div className="mt-5 flex flex-col gap-2.5">
          {TOGGLES.map((t) => {
            const on = !!prefs[t.key];
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setPref(t.key, !on)}
                className={"no-tap flex items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] " + row}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium leading-tight">{t.label}</span>
                  <span className={"block text-xs " + sub}>{t.hint}</span>
                </span>
                <span className={"relative h-6 w-11 shrink-0 rounded-full transition-colors " + (on ? "bg-primary" : trackOff)}>
                  <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all " + (on ? "left-[1.4rem]" : "left-0.5")} />
                </span>
              </button>
            );
          })}
        </div>

        <button onClick={() => reset()} className={"no-tap mt-4 flex w-full items-center justify-center gap-1.5 text-sm " + sub + " hover:opacity-100"}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
        </button>
        <button onClick={onClose} className="no-tap mt-3 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground active:scale-95">
          Done
        </button>
      </motion.div>
    </div>
  );
}