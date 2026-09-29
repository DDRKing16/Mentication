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
            style={{ background: i % 2 ? "#E0715C" : "#E0B25A" }}
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
  zero: ["Your week starts whenever you do.", "Ready when you are."],
  one: ["1 day this week.", "One down. However it happened."],
  some: (n) => [`${n} days this week.`, `${n} days in — steady going.`],
  streak: (n) => [`${n} days in a row. Nice rhythm.`, `${n} in a row. That's a real rhythm.`],
  rebuilding: "Different day, fresh start.",
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

function PowerButton({ index = 0, onClick, icon: Icon, gradient, glow, ring, ariaLabel, eyebrow, title, urgent, dim, firstEver }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="flex w-[8.25rem] flex-col items-center gap-2 text-center">
      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={() => { setPressed(true); hapticPattern([6]); }}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        aria-label={ariaLabel}
        animate={firstEver ? { scale: [1, 1.045, 1] } : { scale: [1, 1.018, 1] }}
        transition={{ duration: firstEver ? 1.6 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.9, rotate: [0, -3, 2, 0] }}
        className="no-tap group relative grid h-20 w-20 shrink-0 place-items-center rounded-full"
        style={{
          boxShadow: `0 ${pressed ? 8 : 14}px ${pressed ? 18 : 28}px -12px ${glow}, inset 0 1px 1px rgba(255,255,255,0.5)`,
          filter: dim ? "saturate(0.55) brightness(0.92)" : "none",
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
            className="absolute inset-[-6px] rounded-full"
            animate={{ opacity: urgent ? [0.85, 1, 0.85] : 1 }}
            transition={{ duration: 2.2, repeat: urgent ? Infinity : 0, ease: "easeInOut" }}
            style={{ background: `conic-gradient(#FFFFFF ${ring * 360}deg, rgba(255,255,255,0.2) 0deg)`, mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))" }}
          />
        )}
        {/* The body of the button, plus a glossy highlight near the top-left
            so it reads as a real, pressable object instead of a flat disc. */}
        <span className="absolute inset-0 rounded-full" style={{ background: gradient }} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-90" style={{ background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 55%)" }} />
        <span aria-hidden="true" className={`absolute inset-0 rounded-full transition-opacity duration-150 ${pressed ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), transparent 70%)" }} />
        {urgent && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white">
            <Flame className="h-2 w-2 text-[#E0715C]" strokeWidth={2.5} fill="currentColor" />
          </span>
        )}
        <motion.span animate={pressed ? { rotate: -8 } : { rotate: 0 }} transition={{ duration: 0.15 }}>
          <Icon className="relative h-7 w-7 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.8} fill={Icon === Play ? "#FFFFFF" : "none"} />
        </motion.span>
      </motion.button>
      <motion.span
        className="min-w-0"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 + index * 0.08 }}
      >
        <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--home-ink)]/50">{eyebrow}</span>
        <span className="mt-0.5 block text-[0.78rem] font-semibold leading-tight text-[var(--home-ink)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{title}</span>
      </motion.span>
    </div>
  );
}

export default function TodayStrip({ sessions, onOpenWeek, onOpenProgramme, onStartDay, quick, loading = false }) {
  const week = useMemo(() => summariseWeek(sessions), [sessions]);
  const line = useMemo(() => weekLine(week), [week]);
  const isBest = useMemo(() => isPersonalBestStreak(week.streak), [week.streak]);
  const [weekRipple, fireWeekRipple] = useRipple("rgba(224,113,92,0.28)");

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

  const PROGRAMME_GRADIENT = "radial-gradient(circle at 35% 30%, #F09477, #C1462F 78%)";
  const QUICK_GRADIENT = "radial-gradient(circle at 35% 30%, #3E5F97, #0E2A52 78%)";

  // Real sessions haven't loaded yet — a brief skeleton instead of a flash
  // of an empty "your week starts whenever you do" state that would then
  // immediately be replaced by the real data a moment later.
  if (loading) {
    return (
      <section className="px-5 pt-6" aria-hidden="true">
        <div className="h-[4.25rem] animate-pulse rounded-[20px] bg-[var(--home-ink)]/8" />
        <div className="mt-4 flex justify-center gap-6">
          <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--home-ink)]/10" />
          <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--home-ink)]/10" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pt-6">
      {/* Your Week: a slim, brushed-silver strip — a soft, continuously
          looping sheen and a gold edge on a personal-best streak, instead
          of a flat white card with plain outline dots. */}
      <button
        type="button"
        onClick={() => { fireWeekRipple(); onOpenWeek(); }}
        onPointerDown={() => hapticPattern([6])}
        aria-label={`Your week: ${line} Open your progress.`}
        className="no-tap relative block w-full overflow-hidden rounded-[20px] px-4 py-2.5 text-left shadow-[0_8px_20px_-14px_rgba(17,43,80,0.45)] transition-[border-color] duration-500"
        style={{
          background: "linear-gradient(128deg, #FFFFFF 0%, #F7F4EE 38%, #FFFFFF 58%, #EFEAE0 100%)",
          border: isBest ? "1px solid rgba(224,178,90,0.85)" : "1px solid rgba(255,255,255,0.9)",
          boxShadow: isBest ? "0 8px 20px -14px rgba(17,43,80,0.45), 0 0 0 3px rgba(224,178,90,0.15)" : undefined,
        }}
      >
        {weekRipple}
        <AnimatePresence>{celebrate && <Burst />}</AnimatePresence>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 h-16 w-24 rotate-[-7deg]"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9), transparent)" }}
          animate={{ left: ["-15%", "115%"] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
        />
        <span className="relative flex items-center justify-between gap-3">
          <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--home-ink)]/50">
            <CalendarDays className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> Your week
          </span>
          {week.streak >= 2 ? (
            <span className="flex items-center gap-1 rounded-full bg-[#E0715C]/12 px-2 py-0.5 text-[0.68rem] font-bold text-[#B94E3B]">
              <motion.span animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                <Flame className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
              </motion.span>
              {week.streak}-day streak
            </span>
          ) : (
            <span className="text-[0.72rem] font-medium text-[var(--home-ink)]/70">{line}</span>
          )}
        </span>
        <span className="relative mt-2 flex justify-between" aria-hidden="true">
          {week.days.map((day, index) => {
            const prevDone = index > 0 && week.days[index - 1].done;
            return (
              <span key={index} className="relative flex flex-col items-center gap-1">
                {prevDone && day.done && <span className="absolute right-full top-3 h-0.5 w-[calc(100%-1.5rem)] -translate-y-1/2 bg-[#E0715C]/35" />}
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, delay: index * 0.04, type: "spring", stiffness: 300, damping: 16 }}
                  className={`relative grid h-6 w-6 place-items-center overflow-hidden rounded-full text-[0.58rem] font-bold ${
                    day.done
                      ? "bg-[#E0715C] text-white shadow-[0_4px_10px_-3px_rgba(224,113,92,0.8)]"
                      : day.today
                        ? "border-2 border-[#E0715C]/55 text-[var(--home-ink)]/70"
                        : "border border-[var(--home-ink)]/12 text-[var(--home-ink)]/30"
                  }`}
                >
                  {day.done && <span aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6), transparent 55%)" }} />}
                  <span className="relative">{day.done ? "✓" : ""}</span>
                </motion.span>
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[0.56rem] font-bold ${
                    day.today ? "bg-[var(--home-ink)] text-white" : "text-[var(--home-ink)]/45"
                  }`}
                >
                  {day.label}
                </span>
              </span>
            );
          })}
        </span>
      </button>

      {/* Two circular power buttons, centred, clearly their own kind of
          control — not competing with the square grid cards right below.
          A soft blurred glow sits behind them, like a shallow depth of
          field, so they read as floating slightly above the page. */}
      <div className="relative mt-4 flex items-start justify-center gap-6">
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-6 h-20 w-[85%] -translate-x-1/2 rounded-full opacity-25 blur-2xl" style={{ background: "linear-gradient(90deg, #C1462F, #0E2A52)" }} />
        {programmeState ? (
          <PowerButton
            index={0}
            onClick={canStartToday ? () => onStartDay(today) : onOpenProgramme}
            ariaLabel={`${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}: ${today.intention}${canStartToday ? " — start" : " — opens tomorrow"}`}
            icon={iconForDay(today.id)}
            gradient={PROGRAMME_GRADIENT}
            glow="rgba(193,70,47,0.45)"
            ring={(programmeState.progress.todayIndex + 1) / programmeState.programme.days.length}
            eyebrow={canStartToday ? `Day ${programmeState.progress.todayIndex + 1} · Start` : `Day ${programmeState.progress.todayIndex + 1} of ${programmeState.programme.days.length}`}
            title={today.intention}
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
            glow="rgba(193,70,47,0.45)"
            eyebrow="Free · Start"
            title="Seven calmer days"
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
            glow="rgba(14,42,82,0.5)"
            eyebrow={`${quick.eyebrow} · Begin`}
            title={quick.title}
          />
        )}
      </div>
    </section>
  );
}
