import React from "react";
import { User, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Logo, MENTICATION_SLOGAN } from "@/components/Logo";

function greetingFor() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeHero({ onProfile, onInsights }) {
  return (
    <header className="relative overflow-hidden rounded-b-[2.5rem] bg-[var(--mcn-emerald)] px-[18px] pt-[max(1.4rem,env(safe-area-inset-top))] pb-10">
      {/* top row: profile · supplied brand symbol · insights */}
      <div className="relative flex items-center justify-between">
        <button
          type="button"
          onClick={onProfile}
          aria-label="Profile"
          className="no-tap flex h-12 w-12 items-center justify-center rounded-full bg-[#ECE2D2] text-[#0E4536] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
        >
          <User className="h-5 w-5" strokeWidth={1.6} />
        </button>

        <Logo
          className="h-24 w-24 sm:h-28 sm:w-28"
          label={`Mentication — ${MENTICATION_SLOGAN}`}
        />

        <button
          type="button"
          onClick={onInsights}
          aria-label="Insights"
          className="no-tap flex h-12 w-12 items-center justify-center rounded-full bg-[#ECE2D2] text-[#0E4536] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
        >
          <BarChart3 className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </div>

      <p className="mt-2 text-center text-[0.68rem] font-medium tracking-[0.08em] text-[#FFFFFF]/85">
        {MENTICATION_SLOGAN}
      </p>

      {/* left-aligned greeting + statement */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-5 text-left"
      >
        <p className="text-[0.78rem] font-medium tracking-[0.16em] text-[#DDB977]">{greetingFor()}</p>
        <h1 className="mt-3 font-clean text-[1.64rem] font-normal leading-[1.15] tracking-[-0.01em] text-[#FFFFFF]">
          Let’s find your reset for today.
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#FFFFFF]/75">
          Private, guided support that adapts to the moment without making the app feel busy.
        </p>
      </motion.div>
    </header>
  );
}
