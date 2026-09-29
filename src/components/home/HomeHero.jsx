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
    <header className="home-hero relative overflow-hidden rounded-b-[2.5rem] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
      <div aria-hidden="true" className="home-hero-glow" />
      <div className="relative z-[1] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onProfile}
          aria-label="Profile"
          className="no-tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--home-control)] text-[var(--home-control-ink)] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
        >
          <User className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
        </button>

        {/* The wordmark is the header's main event, not a small logo above
            other content — it now fills most of the header's height, with
            everything else built tightly around it instead of stacked below. */}
        <span
          className="relative h-[6.75rem] w-[11rem] shrink-0"
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
          className="no-tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--home-control)] text-[var(--home-control-ink)] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
        >
          <BarChart3 className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
        </button>
      </div>

      <p className="relative z-[1] -mt-1 text-center font-[var(--font-editorial)] text-[0.78rem] italic leading-none text-[var(--home-hero-soft)]">
        {MENTICATION_SLOGAN}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-[1] mt-2.5 max-w-[19rem] text-left"
      >
        {/* A pale, clearly-legible eyebrow instead of the coral accent, which
            clashed against navy and read muddy rather than clear. */}
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[var(--home-hero-soft)]">{greetingFor()}</p>
        <h1 className="mt-1 font-clean text-[1.28rem] font-medium leading-[1.18] tracking-[-0.015em] text-[var(--home-hero-text)]">
          Let’s find your reset for today.
        </h1>
      </motion.div>
    </header>
  );
}
