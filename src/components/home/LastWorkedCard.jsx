import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

// "Worked for you last time" — wider/taller ivory bar with a deeper overlap
// into the emerald hero. Gold circular play button launches the user's most
// effective recent reset (wired by the parent).
export default function LastWorkedCard({ subtitle = "Repeat your most effective reset", onClick, overlap = true }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      data-sfx="select"
      className={
        "no-tap relative mx-auto flex w-[calc(100%-1.5rem)] max-w-[36rem] items-center gap-4 rounded-[1.5rem] border border-[var(--home-accent)]/40 bg-[var(--home-card)] px-5 py-4 text-left shadow-[0_28px_64px_-30px_var(--home-shadow)] transition-transform active:scale-[0.985] " +
        (overlap ? "-mt-6 " : "")
      }
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--home-accent)]/55 bg-[var(--home-control)]">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="var(--home-accent)" strokeOpacity="0.65" strokeWidth="1.4" />
          <path d="M7.5 12.5l3 3 6-7" stroke="var(--home-ink)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-body text-[0.86rem] font-semibold leading-tight text-[var(--home-ink)]">Worked for you last time</span>
        <span className="mt-1 block truncate text-[0.71rem] text-[var(--home-muted)]">{subtitle}</span>
      </span>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--home-accent)] shadow-[0_12px_26px_-10px_var(--home-accent)] transition-transform active:scale-90">
        <Play className="h-5 w-5 translate-x-[0.5px] text-[var(--home-hero)]" strokeWidth={1.6} fill="var(--home-hero)" />
      </span>
    </motion.button>
  );
}
