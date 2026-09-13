import React from "react";
import { motion } from "framer-motion";
import { Play, Sparkle } from "lucide-react";

// Emerald recommendation banner using the primary Mentication tokens.
// Gold eyebrow + serif title + ivory play button.
export default function RecommendedCard({ title, descriptor, onClick }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      data-sfx="select"
      className="no-tap relative flex w-full items-center gap-4 overflow-hidden rounded-[1.5rem] bg-[var(--home-hero)] px-6 py-5 text-left shadow-[0_28px_64px_-28px_var(--home-shadow)] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--home-accent)]/40 active:scale-[0.985]"
    >
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--home-accent)]">
          <Sparkle className="h-3.5 w-3.5" strokeWidth={1.6} /> Recommended for you
        </span>
        <span className="mt-2 block font-clean text-[1.45rem] font-semibold leading-tight text-[var(--home-hero-text)]">{title}</span>
        <span className="mt-1 block text-[0.92rem] text-[var(--home-hero-soft)]">{descriptor}</span>
      </span>
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--home-control)] shadow-[0_10px_20px_-8px_rgba(0,0,0,0.45)] transition-transform active:scale-90">
        <Play className="h-5 w-5 translate-x-[1px] text-[var(--home-control-ink)]" strokeWidth={1.6} fill="var(--home-control-ink)" />
      </span>
    </motion.button>
  );
}
