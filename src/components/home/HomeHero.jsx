// @ts-check
import React, { useEffect, useRef, useState } from "react";
import { User, BarChart3, Sunrise, Sun, Sunset, Moon, Menu } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MENTICATION_CHERRY_BABYBLUE_ASSET, MENTICATION_FOREST_GOLD_ASSET, MENTICATION_INK_OCHRE_ASSET, MENTICATION_HOLIDAY_ASSET, MENTICATION_NAVY_GOLD_ASSET, MENTICATION_COBALT_RED_ASSET, MENTICATION_GREEN_PINK_ASSET, MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET, MENTICATION_SLOGAN } from "@/components/Logo";
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
      className="home-hero-btn no-tap relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--home-control)] text-[var(--home-control-ink)] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] transition-transform active:scale-95"
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
      {badge && <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--brand-warm)] ring-2 ring-[var(--home-control)]" />}
    </button>
  );
}

// The hero wordmark recoloured to match the active Home theme.
const HERO_LOGO =
  HOME_THEME === "navy" ? MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET
    : HOME_THEME === "cobalt" ? MENTICATION_COBALT_RED_ASSET
      : HOME_THEME === "cherry" ? MENTICATION_CHERRY_BABYBLUE_ASSET
        : HOME_THEME === "ochre" ? MENTICATION_INK_OCHRE_ASSET
          : HOME_THEME === "luxe" ? MENTICATION_FOREST_GOLD_ASSET
            : HOME_THEME === "deco" ? MENTICATION_NAVY_GOLD_ASSET
              : HOME_THEME === "sunset" ? MENTICATION_HOLIDAY_ASSET
      : MENTICATION_GREEN_PINK_ASSET;

export default function HomeHero({ onMenu, onProfile, onInsights, hasNewInsight = false, headline = "Let’s find your reset for today." }) {
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
      <header data-time={time} className="home-hero relative overflow-hidden rounded-b-[2.5rem] px-5 pt-[max(0.6rem,env(safe-area-inset-top))] pb-4">
        <div aria-hidden="true" className="home-hero-glow" />
        {/* A genuinely marbled surface instead of a flat gradient fill: broad
            light and dark blotches for depth, underneath finer, more
            numerous veins in white and coral at varied angles and
            thicknesses — the "blue bit" now reads as a real polished stone,
            not a gradient with a couple of faint streaks. */}
        <div
          aria-hidden="true"
          className="home-hero-marble pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 55% 40% at 15% 20%, rgba(255,255,255,0.16), transparent 65%)",
              "radial-gradient(ellipse 60% 45% at 88% 75%, rgba(0,0,0,0.16), transparent 65%)",
              "radial-gradient(ellipse 45% 35% at 70% 10%, rgba(255,255,255,0.1), transparent 60%)",
            ].join(", "),
          }}
        />
        <div
          aria-hidden="true"
          className="home-hero-streaks pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 150% 4% at 8% 10%, rgba(255,255,255,0.95), transparent 60%)",
              "radial-gradient(ellipse 130% 3% at 55% 22%, rgba(255,255,255,0.55), transparent 65%)",
              "radial-gradient(ellipse 140% 5% at 30% 34%, rgb(var(--brand-warm-rgb) / 0.7), transparent 55%)",
              "radial-gradient(ellipse 120% 3% at 80% 46%, rgba(255,255,255,0.7), transparent 60%)",
              "radial-gradient(ellipse 160% 4% at 15% 58%, rgba(255,255,255,0.4), transparent 65%)",
              "radial-gradient(ellipse 130% 3% at 65% 68%, rgb(var(--brand-warm-rgb) / 0.5), transparent 60%)",
              "radial-gradient(ellipse 150% 5% at 40% 80%, rgba(255,255,255,0.65), transparent 55%)",
              "radial-gradient(ellipse 120% 3% at 90% 92%, rgba(255,255,255,0.45), transparent 60%)",
            ].join(", "),
            transform: "rotate(-13deg) scale(1.4)",
            filter: "blur(1px)",
          }}
        />
        {/* An alternative finish some themes switch on instead of the marble
            and streaks: the same felt grain and soft sheen as the category
            tiles, plus a very faint repeating pattern. Hidden by default. */}
        <div aria-hidden="true" className="home-hero-finish pointer-events-none absolute inset-0">
          <span className="home-hero-pattern absolute inset-0" />
          <span className="home-felt absolute inset-0" />
          <span className="home-hero-gloss absolute inset-0" />
        </div>
        {/* Palm silhouettes against the sky, for themes that switch them on:
            a tall one leaning in from the right with its fronds reaching
            across the top, and a smaller one on the left. Hidden by default. */}
        <div aria-hidden="true" className="home-hero-palms pointer-events-none absolute inset-0">
          <img src="/media/brand/palm-silhouette.svg" alt="" draggable={false} className="absolute -bottom-6 -right-16 h-[118%] w-auto select-none" />
          <img src="/media/brand/palm-silhouette.svg" alt="" draggable={false} className="absolute -bottom-4 -left-20 h-[72%] w-auto select-none -scale-x-100" />
        </div>
        {/* A faint watermark of the flourish mark and a soft vignette at the
            corners, for a touch more depth than a flat gradient fill. */}
        <img aria-hidden="true" alt="" draggable={false} src={HERO_LOGO} className="home-hero-watermark pointer-events-none absolute -right-10 -top-6 h-40 w-40 select-none object-contain opacity-[0.05]" />
        <div aria-hidden="true" className="home-hero-vignette pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 70px 10px rgba(0,0,0,0.18)" }} />

        {HOME_THEME === "sunset" && (
          // A slim top bar: a menu button on the left and a small wordmark on
          // the right, echoing the tab bar at the bottom.
          <div className="home-topbar relative z-[1] flex h-12 items-center justify-between">
            <button type="button" onClick={onMenu} aria-label="Menu" className="home-topbar-btn no-tap grid h-10 w-10 place-items-center rounded-full">
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <img src={HERO_LOGO} alt="Mentication" draggable={false} className="home-topbar-logo h-[3.6rem] w-auto -mr-1 select-none" />
          </div>
        )}
        <div className="home-hero-row relative z-[1] flex items-center justify-between gap-2">
        <IconButton onClick={onProfile} ariaLabel="Profile">
          <User className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
        </IconButton>

        {/* The wordmark is the header's main event, not a small logo above
            other content — sized to the image's own aspect ratio so it
            fills essentially all the width between the two icon buttons,
            with everything else built tightly around it. */}
        <motion.span
          className="relative h-[181px] w-[240px] shrink-0"
          role="img"
          aria-label={`Mentication — ${MENTICATION_SLOGAN}`}
          style={{ opacity: logoOpacity, y: logoY }}
          initial={wipeIn ? { scale: 0.82 } : false}
          animate={wipeIn ? { scale: 1 } : false}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <img
            src={HERO_LOGO}
            className="home-hero-logo pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </motion.span>

        <IconButton onClick={onInsights} ariaLabel="Insights" badge={hasNewInsight}>
          <BarChart3 className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
        </IconButton>
      </div>

      {HOME_THEME === "sunset" ? (
        <h1 className="home-tagline relative z-[1] mt-6 text-left text-[2.15rem] font-bold text-white [text-shadow:0_2px_14px_rgba(120,40,50,0.45)]">
          Take your mind<br />on a holiday
        </h1>
      ) : (
        <p className="relative z-[1] -mt-3 text-center font-[var(--font-editorial)] text-[0.76rem] italic leading-none text-[var(--home-hero-soft)]">
          {MENTICATION_SLOGAN}
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ y: textY }}
        className="home-greeting relative z-[1] mt-1.5 max-w-[19rem] text-left"
      >
        {/* A pale, clearly-legible eyebrow instead of the coral accent, which
            clashed against navy and read muddy rather than clear. */}
        <p className="flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[var(--home-hero-soft)]">
          <motion.span initial={{ rotate: -25, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <TimeIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
          </motion.span>
          {GREETINGS[time]}
        </p>
        <h1 className="mt-0.5 font-clean text-[1.24rem] font-medium leading-[1.16] tracking-[-0.015em] text-[var(--home-hero-text)]">
          {headline}
        </h1>
        <p className="mt-0.5 text-[0.7rem] font-medium text-[var(--home-hero-soft)]">{dateLabel}</p>
        </motion.div>
      </header>

      {/* Softens the hard rounded-corner cut into the cream page below: a
          wide, blurred glow in the hero's own colour bleeding just past the
          seam, instead of the background changing abruptly at the corner. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 -bottom-5 h-10 rounded-full opacity-30 blur-2xl" style={{ background: "var(--home-hero)" }} />
    </div>
  );
}
