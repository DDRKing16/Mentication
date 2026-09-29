// "Today strip": Your Week, the active programme and the one personalised
// suggestion, bundled into one compact block instead of three separate
// full-size cards. The programme and the suggestion sit side by side as two
// bold, colour-differentiated tiles — real depth and iconography, not flat
// white boxes — so the row reads as designed, not placeholder.
import React, { useMemo } from "react";
import { ArrowRight, CalendarDays, Play } from "lucide-react";
import { summariseWeek } from "@/components/home/YourWeek";
import { activeProgrammeId, getProgramme, programmeProgress, programmeStartedAt } from "@/lib/programmes";

function Tile({ onClick, eyebrow, icon: Icon, title, ariaLabel, cta, gradient, ring }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="no-tap relative flex min-h-[9.5rem] min-w-0 flex-1 basis-0 flex-col justify-between overflow-hidden rounded-[24px] p-4 text-left shadow-[0_18px_36px_-18px_rgba(17,43,80,0.55)] transition-transform active:scale-[0.97]"
      style={{ background: gradient }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />

      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/18 backdrop-blur-sm">
        {ring != null && (
          <span
            aria-hidden="true"
            className="absolute inset-[-4px] rounded-full"
            style={{ background: `conic-gradient(#FFFFFF ${ring * 360}deg, rgba(255,255,255,0.22) 0deg)`, mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))" }}
          />
        )}
        <Icon className="relative h-5 w-5 text-white" strokeWidth={1.8} fill={Icon === Play ? "#FFFFFF" : "none"} />
      </span>

      <span className="relative mt-3 min-w-0">
        <span className="block truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/70">{eyebrow}</span>
        <span className="mt-1 block text-[0.98rem] font-semibold leading-[1.2] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{title}</span>
      </span>

      {cta}
    </button>
  );
}

const ctaPill = (label) => (
  <span className="relative mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[0.74rem] font-bold text-[#0E2A52]">
    {label} <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
  </span>
);

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

  // Warm coral for the programme (ties to the "Start day" colour used
  // everywhere else in programmes) and a distinct deep navy for the
  // recommendation (ties back to the hero), so the two tiles read as
  // different at a glance, not two shades of the same pale tint.
  const PROGRAMME_GRADIENT = "linear-gradient(145deg, #E67A5F 0%, #C1462F 100%)";
  const QUICK_GRADIENT = "linear-gradient(145deg, #1E3F73 0%, #0E2A52 100%)";

  return (
    <section className="px-5 pt-6">
      {/* Your Week keeps its own full-width row — the seven dots need the room. */}
      <button
        type="button"
        onClick={onOpenWeek}
        aria-label={`Your week: ${week.line} Open your progress.`}
        className="no-tap block w-full rounded-[24px] bg-[var(--home-card)] px-4 py-3 text-left shadow-[0_10px_24px_-18px_rgba(17,43,80,0.4)]"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--home-ink)]/50">Your week</span>
          <span className="truncate text-[0.78rem] font-medium text-[var(--home-ink)]/75">{week.line}</span>
        </span>
        <span className="mt-1.5 flex justify-between gap-1" aria-hidden="true">
          {week.days.map((day, index) => (
            <span
              key={index}
              className={`grid h-5 w-5 place-items-center rounded-full text-[0.55rem] font-semibold ${
                day.done
                  ? "bg-[#E0715C] text-white"
                  : day.today
                    ? "border-[1.5px] border-[#E0715C]/60 text-[var(--home-ink)]/70"
                    : "border border-[var(--home-ink)]/12 text-[var(--home-ink)]/30"
              }`}
            >
              {day.done ? "✓" : ""}
            </span>
          ))}
        </span>
      </button>

      {/* The programme and the suggestion side by side — bold, distinctly
          coloured tiles instead of two pale, near-identical lines. */}
      <div className="mt-2.5 flex gap-2.5">
        {programmeState ? (
          <Tile
            onClick={canStartToday ? () => onStartDay(today) : onOpenProgramme}
            ariaLabel={`${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}: ${today.intention}`}
            eyebrow={`Day ${programmeState.progress.todayIndex + 1} of ${programmeState.programme.days.length}`}
            icon={CalendarDays}
            title={today.intention}
            gradient={PROGRAMME_GRADIENT}
            ring={(programmeState.progress.todayIndex + 1) / programmeState.programme.days.length}
            cta={canStartToday ? ctaPill("Start") : <span className="relative mt-3 block text-[0.76rem] font-medium text-white/75">Opens tomorrow</span>}
          />
        ) : (
          <Tile
            onClick={onOpenProgramme}
            ariaLabel="Try seven calmer days, a free programme"
            eyebrow="Programmes · free"
            icon={CalendarDays}
            title="Try seven calmer days"
            gradient={PROGRAMME_GRADIENT}
            cta={ctaPill("Start")}
          />
        )}

        {quick && (
          <Tile
            onClick={quick.onClick}
            ariaLabel={quick.title}
            eyebrow={quick.eyebrow}
            icon={Play}
            title={quick.title}
            gradient={QUICK_GRADIENT}
            cta={ctaPill("Begin")}
          />
        )}
      </div>
    </section>
  );
}
