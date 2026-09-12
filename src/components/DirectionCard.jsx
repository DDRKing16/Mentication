import React from "react";
import { motion } from "framer-motion";
import { Waves, Sun, Anchor, Target, Moon, HelpCircle } from "lucide-react";

// Premium, restrained differentiation: every card keeps the same neutral
// surface. A direction is signalled only by a subtly tinted icon chip and a
// matching hover border — a whisper of colour, not a wash. No gradients or
// watermarks. Literal class strings only (Tailwind purges the rest).
const ACCENTS = {
  calm: {
    Icon: Waves,
    chipDay: "bg-teal/8 text-teal",
    chipNight: "bg-teal/14 text-teal",
    hoverDay: "hover:border-teal/30",
    hoverNight: "hover:border-teal/40",
  },
  lift: {
    Icon: Sun,
    chipDay: "bg-accent/10 text-accent",
    chipNight: "bg-accent/15 text-accent",
    hoverDay: "hover:border-accent/30",
    hoverNight: "hover:border-accent/40",
  },
  ground: {
    Icon: Anchor,
    chipDay: "bg-emerald-600/8 text-emerald-600",
    chipNight: "bg-emerald-500/14 text-emerald-300",
    hoverDay: "hover:border-emerald-600/25",
    hoverNight: "hover:border-emerald-500/40",
  },
  focus: {
    Icon: Target,
    chipDay: "bg-indigo/8 text-indigo",
    chipNight: "bg-indigo/14 text-indigo",
    hoverDay: "hover:border-indigo/30",
    hoverNight: "hover:border-indigo/40",
  },
  sleep: {
    Icon: Moon,
    chipDay: "bg-violet-600/8 text-violet-600",
    chipNight: "bg-violet-500/14 text-violet-300",
    hoverDay: "hover:border-violet-600/25",
    hoverNight: "hover:border-violet-500/40",
  },
  unsure: {
    Icon: HelpCircle,
    chipDay: "bg-secondary text-muted-foreground",
    chipNight: "bg-white/10 text-cream/70",
    hoverDay: "hover:border-primary/30",
    hoverNight: "hover:border-teal/40",
  },
};

export default function DirectionCard({ card, index = 0, night = false, onClick }) {
  const key = card.unsure ? "unsure" : card.direction;
  const a = ACCENTS[key] || ACCENTS.unsure;
  const { Icon } = a;
  const chip = night ? a.chipNight : a.chipDay;
  const hover = night ? a.hoverNight : a.hoverDay;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      onClick={onClick}
      data-sfx="select"
      className={"no-tap group relative flex min-h-[8rem] flex-col items-start gap-4 rounded-3xl border p-5 text-left transition-all duration-500 ease-out hover:-translate-y-1.5 active:scale-[0.985] " +
        (night
          ? "border-cream/10 bg-white/[0.04] hover:bg-white/[0.08] hover:shadow-[0_30px_60px_-30px_hsl(178_55%_45%/0.45)] " + hover
          : "border-border/60 bg-card hover:shadow-[0_28px_64px_-28px_hsl(179_69%_17%/0.30)] " + hover)}
    >
      <span className={"flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-[1.06] " + chip}>
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <span>
        <span className={"block font-heading text-[1.05rem] font-medium leading-tight tracking-tight " + (night ? "text-cream" : "text-foreground")}>{card.label}</span>
        <span className={"mt-0.5 block text-sm " + (night ? "text-cream/55" : "text-muted-foreground")}>{card.sub}</span>
      </span>
    </motion.button>
  );
}
