// @ts-check
import React, { useEffect, useRef, useState } from "react";
import { User, BarChart3, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MENTICATION_GREEN_PINK_ASSET, MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET, MENTICATION_SLOGAN } from "@/components/Logo";
import { HOME_THEME } from "@/lib/homeTheme";
import { hapticPattern } from "@/lib/feedback";

const HERO_SEEN_KEY = "mentication.heroWordmarkSeen.v1";
const todayKey = () => new Date().toISOString().slice(0, 10);

function timeOfDay(hour = new Date().getHours()) {
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "day";
  if (hour < 21) return "evening";
  return "night";
}

const GREETINGS = { night: "GOOD EVENING", morning: "GOOD MORNING", day: "GOOD AFTERNOON", evening: "GOOD EVENING" };
const TIME_ICONS = { night: Moon, morning: Sunrise, day: Sun, evening: Sunset };

function IconButton({ onClick, ariaLabel, children, badge = false }) {
  // A small expanding ring on press instead of only a scale-down, plus an
  // optional notification dot for "something new to see".
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);
  const press = () => {
    const id = ++rippleId.current;
    setRipples((r) => [...r, id]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 500);
    hapticPattern([6]);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label={ariaLabel}
      className="no-tap relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--home-control)] text-[var(--home-control-ink)] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
    >
      {ripples.map((id) => (
        <motion.span
          key={id}
          aria-hidden="true"
          initial={{ scale: 0, opacity: 0.45 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none absolute h-full w-full rounded-full bg-[var(--home-control-ink)]"
        />
      ))}
      {children}
      {badge && <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E0715C] ring-2 ring-[var(--home-control)]" />}
    </button>
  );
}

export default function HomeHero({ onProfile, onInsights, hasNewInsight = false, headline = "Let’s find your reset for today." }) {
  const time = timeOfDay();
  const TimeIcon = TIME_ICONS[time];
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  // The wordmark reveals itself with a quick wipe the first time the app is
  // opened on a given day; every load after that, it's just there.
  const [wipeIn] = useState(() => {
    try { return localStorage.getItem(HERO_SEEN_KEY) !== todayKey(); } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(HERO_SEEN_KEY, todayKey()); } catch { /* storage unavailable */ }
  }, []);

  // A gentle parallax: the wordmark (closest to the eye) fades and drifts up
  // faster than the greeting text beneath it (a step further back), so the
  // header reads as having depth rather than scrolling as one flat sheet.
  const { scrollY } = useScroll();
  const logoOpacity = useTransform(scrollY, [0, 160], [1, 0.35]);
  const logoY = useTransform(scrollY, [0, 160], [0, -14]);
  const textY = useTransform(scrollY, [0, 220], [0, -6]);

  return (
    <div className="relative">
      <header data-time={time} className="home-hero relative overflow-hidden rounded-b-[2.5rem] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
        <div aria-hidden="true" className="home-hero-glow" />
        {/* A faint watermark of the flourish mark and a soft vignette at the
            corners, for a touch more depth than a flat gradient fill. */}
        <img aria-hidden="true" alt="" draggable={false} src={HOME_THEME === "navy" ? MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET : MENTICATION_GREEN_PINK_ASSET} className="pointer-events-none absolute -right-10 -top-6 h-40 w-40 select-none object-contain opacity-[0.05]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 70px 10px rgba(0,0,0,0.18)" }} />

        <div className="relative z-[1] flex items-center justify-between gap-2">
        <IconButton onClick={onProfile} ariaLabel="Profile">
          <User className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
        </IconButton>

        {/* The wordmark is the header's main event, not a small logo above
            other content — it fills most of the header's height, with
            everything else built tightly around it. */}
        <motion.span
          className="relative h-[6.75rem] w-[11rem] shrink-0"
          role="img"
          aria-label={`Mentication — ${MENTICATION_SLOGAN}`}
          style={{ opacity: logoOpacity, y: logoY }}
          initial={wipeIn ? { clipPath: "inset(0 100% 0 0)" } : false}
          animate={wipeIn ? { clipPath: "inset(0 0% 0 0)" } : false}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <img
            src={HOME_THEME === "navy" ? MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET : MENTICATION_GREEN_PINK_ASSET}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </motion.span>

        <IconButton onClick={onInsights} ariaLabel="Insights" badge={hasNewInsight}>
          <BarChart3 className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
        </IconButton>
      </div>

      <p className="relative z-[1] -mt-1 text-center font-[var(--font-editorial)] text-[0.78rem] italic leading-none text-[var(--home-hero-soft)]">
        {MENTICATION_SLOGAN}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ y: textY }}
        className="relative z-[1] mt-2.5 max-w-[19rem] text-left"
      >
        {/* A pale, clearly-legible eyebrow instead of the coral accent, which
            clashed against navy and read muddy rather than clear. */}
        <p className="flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[var(--home-hero-soft)]">
          <motion.span initial={{ rotate: -25, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <TimeIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
          </motion.span>
          {GREETINGS[time]}
        </p>
        <h1 className="mt-1 font-clean text-[1.28rem] font-medium leading-[1.18] tracking-[-0.015em] text-[var(--home-hero-text)]">
          {headline}
        </h1>
        <p className="mt-1 text-[0.72rem] font-medium text-[var(--home-hero-soft)]">{dateLabel}</p>
        </motion.div>
      </header>

      {/* Softens the hard rounded-corner cut into the cream page below: a
          wide, blurred glow in the hero's own colour bleeding just past the
          seam, instead of the background changing abruptly at the corner. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 -bottom-5 h-10 rounded-full opacity-30 blur-2xl" style={{ background: "var(--home-hero)" }} />
    </div>
  );
}
