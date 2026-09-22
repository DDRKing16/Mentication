// @ts-check
import React from "react";
import { User, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { MENTICATION_GREEN_PINK_ASSET, MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET, MENTICATION_SLOGAN } from "@/components/Logo";
import { HOME_THEME } from "@/lib/homeTheme";

function greetingFor() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function HomeHero({ onProfile, onInsights }) {
  return (
    <header className="home-hero relative overflow-hidden rounded-b-[2.5rem] px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-12">
      <div aria-hidden="true" className="home-hero-glow" />
      <div className="relative z-[1] flex items-center justify-between">
        <button
          type="button"
          onClick={onProfile}
          aria-label="Profile"
          className="no-tap flex h-12 w-12 items-center justify-center rounded-full bg-[var(--home-control)] text-[var(--home-control-ink)] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
        >
          <User className="h-5 w-5" strokeWidth={1.6} />
        </button>

        <span
          className="relative h-44 w-[15.5rem] shrink-0"
          role="img"
          aria-label={`Mentication — ${MENTICATION_SLOGAN}`}
        >
          <img
            src={HOME_THEME === "navy" ? MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET : MENTICATION_GREEN_PINK_ASSET}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </span>

        <button
          type="button"
          onClick={onInsights}
          aria-label="Insights"
          className="no-tap flex h-12 w-12 items-center justify-center rounded-full bg-[var(--home-control)] text-[var(--home-control-ink)] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
        >
          <BarChart3 className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </div>

      <p className="relative z-[1] mt-1 text-center font-[var(--font-editorial)] text-[1.03rem] italic leading-none text-[var(--home-hero-soft)]">
        {MENTICATION_SLOGAN}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-[1] mt-7 max-w-[19rem] text-left"
      >
        <p className="text-[0.82rem] font-bold uppercase tracking-[0.32em] text-[var(--home-accent)]">{greetingFor()}</p>
        <h1 className="mt-3 font-clean text-[2rem] font-medium leading-[1.08] tracking-[-0.025em] text-[var(--home-hero-text)]">
          Let’s find your reset for today.
        </h1>
      </motion.div>
    </header>
  );
}
