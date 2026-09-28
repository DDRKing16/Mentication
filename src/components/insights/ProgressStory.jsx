// The top of "What's helping you": a warm, plain-English summary of the
// person's own progress, built only from their on-device check-ins.
import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const fade = (delay) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay } });

function Headline({ story }) {
  if (story.avgShift != null && story.avgShift > 0) {
    return (
      <>
        <p className="font-heading text-[2.6rem] font-medium leading-none text-white">{story.avgShift} <span className="text-lg text-white/70">{story.avgShift === 1 ? "point" : "points"}</span></p>
        <p className="mt-2 text-sm text-white/80">On average, that's how much better you rated yourself after a practice this month.</p>
      </>
    );
  }
  if (story.last30.count > 0) {
    return (
      <>
        <p className="font-heading text-[2.6rem] font-medium leading-none text-white">{story.last30.days} <span className="text-lg text-white/70">{story.last30.days === 1 ? "day" : "days"}</span></p>
        <p className="mt-2 text-sm text-white/80">You made time for yourself this month. Rate how you feel before and after, and this will show what's changing.</p>
      </>
    );
  }
  return <p className="font-heading text-2xl leading-snug text-white">Your story starts with your first practice.</p>;
}

export default function ProgressStory({ story }) {
  const maxWeek = Math.max(1, ...story.weeks.map((w) => w.count));
  return (
    <div className="space-y-5">
      <motion.section {...fade(0.05)} className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#112b50] via-[#2a3f6e] to-[#E0715C] p-6 shadow-[0_24px_50px_-28px_rgba(17,43,80,0.9)]">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/70">This month</p>
        <div className="mt-3"><Headline story={story} /></div>
        {story.last30.count > 0 && (
          <p className="mt-4 text-xs text-white/65">{story.last30.count} {story.last30.count === 1 ? "practice" : "practices"} on {story.last30.days} {story.last30.days === 1 ? "day" : "days"}. From your own check-ins, not a clinical measure.</p>
        )}
      </motion.section>

      {story.helpers.length > 0 && (
        <motion.section {...fade(0.12)} className="rounded-[24px] border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#E0715C]" /><h2 className="font-heading text-lg font-medium text-primary">What helps you most</h2></div>
          <ol className="mt-4 space-y-3">
            {story.helpers.map((h, i) => (
              <li key={h.id} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${i === 0 ? "bg-[#E0715C] text-white" : "bg-primary/10 text-primary"}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{h.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {h.uses} {h.uses === 1 ? "time" : "times"}{h.avgShift != null && h.avgShift > 0 ? ` · usually ${h.avgShift} ${h.avgShift === 1 ? "point" : "points"} better after` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </motion.section>
      )}

      {story.total > 0 && (
        <motion.section {...fade(0.19)} className="rounded-[24px] border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-medium text-primary">Your rhythm</h2>
          <p className="mt-1 text-xs text-muted-foreground">Practices each week, last six weeks.</p>
          <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={story.weeks.map((w) => `${w.label}: ${w.count}`).join(", ")}>
            {story.weeks.map((w, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[0.65rem] font-semibold text-muted-foreground">{w.count || ""}</span>
                <motion.span
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(w.count ? 8 : 3, (w.count / maxWeek) * 100)}%` }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.5 }}
                  className={`block w-full rounded-t-lg ${i === 5 ? "bg-[#E0715C]" : w.count ? "bg-primary/35" : "bg-primary/10"}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2">
            {story.weeks.map((w, i) => <span key={i} className={`flex-1 text-center text-[0.6rem] ${i === 5 ? "font-bold text-primary" : "text-muted-foreground"}`}>{w.label}</span>)}
          </div>
          {story.bestTime && (
            <p className="mt-4 rounded-2xl bg-primary/5 px-4 py-3 text-sm text-foreground">Practices <span className="font-semibold">{story.bestTime.slot}</span> seem to help you most.</p>
          )}
        </motion.section>
      )}
    </div>
  );
}
