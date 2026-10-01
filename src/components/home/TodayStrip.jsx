// "Today strip": Your Week, plus two circular "power buttons" for the
// active programme and the one personalised suggestion. Round on purpose —
// the category grid right below is square cards, so keeping these circular
// means the two rows never compete for the same visual language; they're
// clearly two different kinds of thing.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Compass, Wind, Waves, Moon, RefreshCw, Zap, Play, Flame } from "lucide-react";
import { summariseWeek, weekDays } from "@/components/home/YourWeek";
import { activeProgrammeId, getProgramme, programmeProgress, programmeStartedAt } from "@/lib/programmes";
import { hapticPattern } from "@/lib/feedback";
import { HOME_THEME } from "@/lib/homeTheme";

const LAST_STREAK_KEY = "mentication.lastStreak.v1";
const BEST_STREAK_KEY = "mentication.bestStreak.v1";
const START_GLOW_KEY = "mentication.startGlowSeen.v1";
const FULL_WEEK_KEY = "mentication.fullWeekCelebrated.v1";

// A small shape-based celebration instead of a stock confetti graphic or a
// commissioned illustration neither of which exist for this app: a handful
// of dots bursting outward from the week card, once, the moment all seven
// days are done.
function Burst() {
  const dots = Array.from({ length: 10 });
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {dots.map((_, i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{ background: i % 2 ? "var(--brand-warm)" : "var(--brand-gold)" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 70, y: Math.sin(angle) * 70, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

// Which small icon best matches a programme day's practice, so the button
// isn't always the same generic calendar glyph.
const DAY_ICONS = [
  [/breath|box/i, Wind],
  [/ground|5-4-3/i, Compass],
  [/urge|surf/i, Waves],
  [/park|sleep|night/i, Moon],
  [/scene|change/i, RefreshCw],
  [/bump|happy/i, Zap],
];
function iconForDay(id = "") {
  const match = DAY_ICONS.find(([re]) => re.test(id));
  return match ? match[1] : CalendarDays;
}

// A rotating set of phrasings for each rhythm bucket, picked deterministically
// from the day of the year so it's stable within a day but not the exact
// same wording every single time someone opens Home.
const PHRASES = {
  zero: ["Start whenever you're ready.", "Ready when you are."],
  one: ["1 day this week.", "One day down."],
  some: (n) => [`${n} days this week.`, `${n} days in.`],
  streak: (n) => [`${n} days in a row.`, `A ${n}-day rhythm.`],
  rebuilding: "Fresh start today.",
};
function pickPhrase(list) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  return list[dayOfYear % list.length];
}

function weekLine(week) {
  let prevStreak = 0;
  try { prevStreak = Number(localStorage.getItem(LAST_STREAK_KEY)) || 0; } catch { /* unavailable */ }
  try { localStorage.setItem(LAST_STREAK_KEY, String(week.streak)); } catch { /* unavailable */ }
  if (week.streak >= 2) return pickPhrase(PHRASES.streak(week.streak));
  if (prevStreak >= 2 && week.streak === 0 && week.count > 0) return PHRASES.rebuilding;
  if (week.count === 0) return pickPhrase(PHRASES.zero);
  if (week.count === 1) return pickPhrase(PHRASES.one);
  return pickPhrase(PHRASES.some(week.count));
}

function isPersonalBestStreak(streak) {
  let best = 0;
  try { best = Number(localStorage.getItem(BEST_STREAK_KEY)) || 0; } catch { /* unavailable */ }
  if (streak > best) {
    try { localStorage.setItem(BEST_STREAK_KEY, String(streak)); } catch { /* unavailable */ }
    return streak >= 2;
  }
  return streak >= 2 && streak === best;
}

function useRipple(color) {
  const [ripples, setRipples] = useState([]);
  const id = useRef(0);
  const fire = () => {
    const rid = ++id.current;
    setRipples((r) => [...r, rid]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== rid)), 500);
  };
  const node = ripples.map((rid) => (
    <motion.span
      key={rid}
      aria-hidden="true"
      initial={{ scale: 0, opacity: 0.35 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: color }}
    />
  ));
  return [node, fire];
}

function PowerButton({ index = 0, onClick, icon: Icon, gradient, rim, glow, ring, ariaLabel, title, urgent, dim, firstEver }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="home-power min-w-0 flex-1">
      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={() => { setPressed(true); hapticPattern([9]); }}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        aria-label={ariaLabel}
        animate={firstEver ? { scale: [1, 1.045, 1] } : { scale: [1, 1.018, 1] }}
        transition={{ duration: firstEver ? 1.6 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.86, scaleY: 0.82 }}
        className="no-tap group relative grid aspect-square w-full place-items-center rounded-full"
        style={{
          boxShadow: pressed
            ? `0 3px 8px -4px ${glow}, inset 0 3px 6px rgba(0,0,0,0.35), inset 0 -1px 1px rgba(255,255,255,0.25)`
            : `0 10px 22px -10px ${glow}, inset 0 2px 2px rgba(255,255,255,0.6), inset 0 -5px 9px -2px ${rim}`,
          filter: dim ? "saturate(0.55) brightness(0.92)" : "none",
          transition: "box-shadow 0.12s ease",
        }}
      >
        {firstEver && (
          <motion.span
            aria-hidden="true"
            className="absolute -inset-2 rounded-full"
            style={{ background: gradient, filter: "blur(6px)" }}
            animate={{ opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {ring != null && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-[-5px] rounded-full"
            animate={{ opacity: urgent ? [0.85, 1, 0.85] : 1 }}
            transition={{ duration: 2.2, repeat: urgent ? Infinity : 0, ease: "easeInOut" }}
            style={{ background: `conic-gradient(#FFFFFF ${ring * 360}deg, rgba(255,255,255,0.2) 0deg)`, mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))" }}
          />
        )}
        {/* A stronger 3D bevel — a bright highlight top-left, a dark rim at
            the bottom, so it reads as a real, physically pressable sphere
            rather than a flat tinted disc. */}
        <span className="absolute inset-0 rounded-full" style={{ background: gradient }} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-90" style={{ background: "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.65), transparent 52%)" }} />
        <span aria-hidden="true" className={`absolute inset-0 rounded-full transition-opacity duration-150 ${pressed ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(circle at 50% 55%, rgba(0,0,0,0.18), transparent 65%)" }} />
        {urgent && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white">
            <Flame className="h-2 w-2 text-[var(--brand-warm)]" strokeWidth={2.5} fill="currentColor" />
          </span>
        )}
        {/* The label sits inside the circle, under the icon, so the whole
            circle is the button and it can fill its half of the card. */}
        <span className="relative flex flex-col items-center gap-0.5">
          <motion.span animate={pressed ? { rotate: -8 } : { rotate: 0 }} transition={{ duration: 0.15 }}>
            <Icon className="h-6 w-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" style={{ color: `var(--power-icon-${index}, #FFFFFF)` }} strokeWidth={1.8} fill={Icon === Play ? "currentColor" : "none"} />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.08 }}
            className="text-[0.66rem] font-bold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            style={{ color: `var(--power-label-${index}, #FFFFFF)` }}
          >
            {title}
          </motion.span>
        </span>
      </motion.button>
    </div>
  );
}

export default function TodayStrip({ sessions, onOpenWeek, onOpenProgramme, onStartDay, quick, loading = false }) {
  const week = useMemo(() => summariseWeek(sessions), [sessions]);
  const line = useMemo(() => weekLine(week), [week]);
  const isBest = useMemo(() => isPersonalBestStreak(week.streak), [week.streak]);
  const [weekRipple, fireWeekRipple] = useRipple("rgb(var(--brand-warm-rgb) / 0.28)");

  // A one-time celebration the moment a full seven-day week is reached,
  // never repeated for the same week even across reloads.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (week.count < 7) return;
    const weekKey = weekDays()[0]?.toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(FULL_WEEK_KEY) === weekKey) return;
      localStorage.setItem(FULL_WEEK_KEY, weekKey);
    } catch { /* unavailable */ }
    setCelebrate(true);
    const t = window.setTimeout(() => setCelebrate(false), 950);
    return () => window.clearTimeout(t);
  }, [week.count]);

  const programmeState = useMemo(() => {
    const id = activeProgrammeId();
    const programme = id ? getProgramme(id) : null;
    if (!programme) return null;
    const progress = programmeProgress(programme, sessions, programmeStartedAt(id));
    if (progress.finished) return null;
    return { programme, progress };
  }, [sessions]);

  const today = programmeState?.progress.days[programmeState.progress.todayIndex];
  const canStartToday = today && today.status !== "tomorrow";

  // The very first "Start" a brand-new person sees gets a soft one-time glow
  // so it's obvious what to tap, without a tutorial overlay.
  const [firstEverStart] = useState(() => {
    try { return sessions.length === 0 && localStorage.getItem(START_GLOW_KEY) !== "1"; } catch { return false; }
  });
  useEffect(() => { try { if (firstEverStart) localStorage.setItem(START_GLOW_KEY, "1"); } catch { /* unavailable */ } }, [firstEverStart]);

  const PROGRAMME_GRADIENT = "radial-gradient(circle at 35% 30%, var(--brand-warm-light), var(--brand-warm-deep) 78%)";
  const QUICK_GRADIENT = "radial-gradient(circle at 35% 30%, var(--brand-cool-light), var(--brand-cool) 78%)";
  const PROGRAMME_RIM = "rgba(120,35,20,0.55)";
  const QUICK_RIM = "rgba(6,16,34,0.55)";

  // Real sessions haven't loaded yet — a brief skeleton instead of a flash
  // of an empty "your week starts whenever you do" state that would then
  // immediately be replaced by the real data a moment later.
  if (loading) {
    return (
      <section className="px-5 pt-6" aria-hidden="true">
        <div className="h-[8.5rem] animate-pulse rounded-[20px] bg-[var(--home-ink)]/8" />
      </section>
    );
  }

  return (
    <section className="home-week-section px-5 pt-6">
      {/* Your Week and the two power buttons now live in one continuous
          card instead of two separate, spaced-out pieces — the row of
          buttons no longer sits in its own empty stretch of page. */}
      <div
        className="home-week relative overflow-hidden rounded-[20px] shadow-[0_8px_20px_-14px_rgb(var(--brand-shadow-rgb)/0.45)] transition-[border-color] duration-500"
        style={{
          background: "var(--home-week-bg)",
          border: isBest ? "1px solid rgb(var(--brand-gold-rgb) / 0.85)" : "1px solid var(--home-week-border)",
          boxShadow: isBest ? "0 8px 20px -14px rgb(var(--brand-shadow-rgb) / 0.45), 0 0 0 3px rgb(var(--brand-gold-rgb) / 0.15)" : undefined,
        }}
      >
        {/* The light sweep is a compositor-only CSS animation (transform, not
            left) so it stays smooth on a phone. */}
        <span aria-hidden="true" className="home-week-shine pointer-events-none absolute inset-y-0 left-0 w-24" />

        <div className="relative px-4 pt-2.5 pb-2.5">
          <AnimatePresence>{celebrate && <Burst />}</AnimatePresence>

          {/* Your Week (left half, two evenly-spaced rows of days) and the
              two power buttons (right half, spread edge-to-edge to match)
              now share one vertical band instead of stacking — the whole
              card is roughly half the height it was. Both halves are an
              exact 50/50 split so the two sides read as equally weighted. */}
          <div className="relative flex items-center">
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-2xl" style={{ background: "linear-gradient(90deg, var(--brand-cool), var(--brand-warm-deep))" }} />

            <button
              type="button"
              onClick={() => { fireWeekRipple(); onOpenWeek(); }}
              onPointerDown={() => hapticPattern([6])}
              aria-label={`Your week: ${line} Open your progress.`}
              className="no-tap relative w-1/2 min-w-0 pr-3 text-left"
            >
              {weekRipple}
              <span className="flex items-center gap-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[var(--home-ink)]/50">
                <CalendarDays className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" /> Your week
                {week.streak >= 2 ? (
                  <span className="ml-auto flex items-center gap-0.5 rounded-full bg-[rgb(var(--brand-warm-rgb)/0.12)] px-1.5 py-0.5 text-[0.62rem] font-bold text-[var(--brand-warm-ink)]">
                    <Flame className="h-2.5 w-2.5" strokeWidth={2.5} fill="currentColor" />
                    {week.streak}
                  </span>
                ) : null}
              </span>
              {/* Eight half-columns, each day spanning two: the four days in
                  row one fill the full width of the left half, and the three
                  in row two are offset by half a column so they sit centred
                  underneath. Each circle fills its cell, so there's no stray
                  space between days. */}
              <span className="home-week-days mt-1.5 grid grid-cols-8 gap-x-1.5 gap-y-1.5" aria-hidden="true">
                {week.days.map((day, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, delay: index * 0.04, type: "spring", stiffness: 300, damping: 16 }}
                    className={`relative col-span-2 grid aspect-square w-full place-items-center overflow-hidden rounded-full text-[0.64rem] font-bold ${index === 4 ? "col-start-2" : ""} ${
                      day.done
                        ? "bg-[var(--brand-done)] text-white shadow-[0_4px_10px_-3px_rgb(var(--brand-done-rgb)/0.8)]"
                        : day.today
                          ? "border-2 border-[rgb(var(--brand-warm-rgb)/0.55)] text-[var(--home-ink)]/70"
                          : "border border-[var(--home-ink)]/12 text-[var(--home-ink)]/30"
                    }`}
                  >
                    {day.done && <span aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6), transparent 55%)" }} />}
                    <span className="relative">{day.done ? "✓" : day.label}</span>
                  </motion.span>
                ))}
              </span>
              {week.streak < 2 && <span className="mt-1.5 block truncate text-[0.62rem] font-medium text-[var(--home-ink)]/60">{line}</span>}
            </button>

            <span aria-hidden="true" className="h-14 w-px shrink-0 bg-[var(--home-ink)]/10" />

            {HOME_THEME === "sunset" ? (
              // A quieter pair: one clear "Begin" pill and the programme as a
              // text link, instead of two glossy orbs.
              <div className="relative flex w-1/2 flex-col items-stretch justify-center gap-1.5 pl-2.5">
                {quick && (
                  <button
                    type="button"
                    onClick={() => { hapticPattern([9]); quick.onClick(); }}
                    aria-label={`${quick.title} — ${quick.eyebrow}`}
                    className="home-week-begin no-tap flex h-10 items-center justify-center gap-1.5 rounded-full text-[0.86rem] font-semibold"
                  >
                    <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" /> Begin
                  </button>
                )}
                <button
                  type="button"
                  onClick={programmeState && canStartToday ? () => onStartDay(today) : onOpenProgramme}
                  aria-label={programmeState ? `${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}` : "Try seven calmer days, a free programme"}
                  className="home-week-link no-tap text-center text-[0.74rem] font-medium"
                >
                  {programmeState ? `Day ${programmeState.progress.todayIndex + 1} of your 7 days` : "or try 7 calmer days →"}
                </button>
              </div>
            ) : (
            <div className="relative flex w-1/2 items-center gap-2 pl-2.5">
              {programmeState ? (
                <PowerButton
                  index={0}
                  onClick={canStartToday ? () => onStartDay(today) : onOpenProgramme}
                  ariaLabel={`${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}: ${today.intention}${canStartToday ? " — start" : " — opens tomorrow"}`}
                  icon={iconForDay(today.id)}
                  gradient={PROGRAMME_GRADIENT}
                  rim={PROGRAMME_RIM}
                  glow="rgb(var(--brand-warm-deep-rgb) / 0.45)"
                  ring={(programmeState.progress.todayIndex + 1) / programmeState.programme.days.length}
                  title={canStartToday ? `Day ${programmeState.progress.todayIndex + 1}` : `Day ${programmeState.progress.todayIndex + 1}`}
                  urgent={canStartToday}
                  dim={!canStartToday}
                  firstEver={firstEverStart}
                />
              ) : (
                <PowerButton
                  index={0}
                  onClick={onOpenProgramme}
                  ariaLabel="Try seven calmer days, a free programme"
                  icon={CalendarDays}
                  gradient={PROGRAMME_GRADIENT}
                  rim={PROGRAMME_RIM}
                  glow="rgb(var(--brand-warm-deep-rgb) / 0.45)"
                  title="7 days"
                  firstEver={firstEverStart}
                />
              )}

              {quick && (
                <PowerButton
                  index={1}
                  onClick={quick.onClick}
                  ariaLabel={`${quick.title} — ${quick.eyebrow}`}
                  icon={Play}
                  gradient={QUICK_GRADIENT}
                  rim={QUICK_RIM}
                  glow="rgb(var(--brand-cool-rgb) / 0.5)"
                  title="Begin"
                />
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
