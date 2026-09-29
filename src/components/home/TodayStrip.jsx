// "Today strip": Your Week, plus two circular "power buttons" for the
// active programme and the one personalised suggestion. Round on purpose —
// the category grid right below is square cards, so keeping these circular
// means the two rows never compete for the same visual language; they're
// clearly two different kinds of thing.
import React, { useMemo } from "react";
import { CalendarDays, Play } from "lucide-react";
import { summariseWeek } from "@/components/home/YourWeek";
import { activeProgrammeId, getProgramme, programmeProgress, programmeStartedAt } from "@/lib/programmes";

function PowerButton({ onClick, icon: Icon, gradient, glow, ring, ariaLabel, eyebrow, title }) {
  return (
    <div className="flex w-[8.25rem] flex-col items-center gap-2 text-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="no-tap group relative grid h-20 w-20 shrink-0 place-items-center rounded-full transition-transform duration-150 active:scale-90"
        style={{ boxShadow: `0 14px 28px -12px ${glow}, inset 0 1px 1px rgba(255,255,255,0.5)` }}
      >
        {ring != null && (
          <span
            aria-hidden="true"
            className="absolute inset-[-6px] rounded-full transition-opacity duration-300"
            style={{ background: `conic-gradient(#FFFFFF ${ring * 360}deg, rgba(255,255,255,0.2) 0deg)`, mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))" }}
          />
        )}
        {/* The body of the button, plus a glossy highlight near the top-left
            so it reads as a real, pressable object instead of a flat disc. */}
        <span className="absolute inset-0 rounded-full" style={{ background: gradient }} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-90" style={{ background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 55%)" }} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-150 group-active:opacity-100" style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), transparent 70%)" }} />
        <Icon className="relative h-7 w-7 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.8} fill={Icon === Play ? "#FFFFFF" : "none"} />
      </button>
      <span className="min-w-0">
        <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--home-ink)]/50">{eyebrow}</span>
        <span className="mt-0.5 block text-[0.78rem] font-semibold leading-tight text-[var(--home-ink)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{title}</span>
      </span>
    </div>
  );
}

export default function TodayStrip({ sessions, onOpenWeek, onOpenProgramme, onStartDay, quick }) {
  const week = useMemo(() => summariseWeek(sessions), [sessions]);

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

  const PROGRAMME_GRADIENT = "radial-gradient(circle at 35% 30%, #F09477, #C1462F 78%)";
  const QUICK_GRADIENT = "radial-gradient(circle at 35% 30%, #3E5F97, #0E2A52 78%)";

  return (
    <section className="px-5 pt-6">
      {/* Your Week: a slim, brushed-silver strip — a soft diagonal sheen and
          a bright highlight edge, instead of a flat white card — with a
          little more shine on each day dot than a plain outline circle. */}
      <button
        type="button"
        onClick={onOpenWeek}
        aria-label={`Your week: ${week.line} Open your progress.`}
        className="no-tap relative block w-full overflow-hidden rounded-[20px] px-4 py-2.5 text-left shadow-[0_8px_20px_-14px_rgba(17,43,80,0.45)]"
        style={{ background: "linear-gradient(128deg, #FFFFFF 0%, #F7F4EE 38%, #FFFFFF 58%, #EFEAE0 100%)", border: "1px solid rgba(255,255,255,0.9)" }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -top-10 h-16 rotate-[-7deg]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.85), transparent)" }} />
        <span className="relative flex items-center justify-between gap-3">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--home-ink)]/50">Your week</span>
          {week.streak >= 2 ? (
            <span className="flex items-center gap-1 rounded-full bg-[#E0715C]/12 px-2 py-0.5 text-[0.68rem] font-bold text-[#B94E3B]">🔥 {week.streak}-day streak</span>
          ) : (
            <span className="text-[0.72rem] font-medium text-[var(--home-ink)]/70">{week.line}</span>
          )}
        </span>
        <span className="relative mt-2 flex justify-between" aria-hidden="true">
          {week.days.map((day, index) => (
            <span key={index} className="flex flex-col items-center gap-1">
              <span
                className={`relative grid h-6 w-6 place-items-center overflow-hidden rounded-full text-[0.58rem] font-bold transition ${
                  day.done
                    ? "bg-[#E0715C] text-white shadow-[0_4px_10px_-3px_rgba(224,113,92,0.8)]"
                    : day.today
                      ? "border-2 border-[#E0715C]/55 text-[var(--home-ink)]/70"
                      : "border border-[var(--home-ink)]/12 text-[var(--home-ink)]/30"
                }`}
              >
                {day.done && <span aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6), transparent 55%)" }} />}
                <span className="relative">{day.done ? "✓" : ""}</span>
              </span>
              <span
                className={`grid h-4 w-4 place-items-center rounded-full text-[0.56rem] font-bold ${
                  day.today ? "bg-[var(--home-ink)] text-white" : "text-[var(--home-ink)]/45"
                }`}
              >
                {day.label}
              </span>
            </span>
          ))}
        </span>
      </button>

      {/* Two circular power buttons, centred, clearly their own kind of
          control — not competing with the square grid cards right below. */}
      <div className="mt-4 flex items-start justify-center gap-6">
        {programmeState ? (
          <PowerButton
            onClick={canStartToday ? () => onStartDay(today) : onOpenProgramme}
            ariaLabel={`${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}: ${today.intention}${canStartToday ? " — start" : " — opens tomorrow"}`}
            icon={CalendarDays}
            gradient={PROGRAMME_GRADIENT}
            glow="rgba(193,70,47,0.45)"
            ring={(programmeState.progress.todayIndex + 1) / programmeState.programme.days.length}
            eyebrow={canStartToday ? `Day ${programmeState.progress.todayIndex + 1} · Start` : `Day ${programmeState.progress.todayIndex + 1} of ${programmeState.programme.days.length}`}
            title={today.intention}
          />
        ) : (
          <PowerButton
            onClick={onOpenProgramme}
            ariaLabel="Try seven calmer days, a free programme"
            icon={CalendarDays}
            gradient={PROGRAMME_GRADIENT}
            glow="rgba(193,70,47,0.45)"
            eyebrow="Free · Start"
            title="Seven calmer days"
          />
        )}

        {quick && (
          <PowerButton
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
