import React from "react";
import {
  CloudRain, Brain, Zap, Waves, Activity, Shuffle, Volume2,
  RefreshCw, Moon, HelpCircle, Sparkles, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  CloudRain, Brain, Zap, Waves, Activity, Shuffle, Volume2,
  RefreshCw, Moon, HelpCircle, Sparkles, PenLine,
};

export default function StateCard({ state, selected, onClick }) {
  const Icon = ICONS[state.icon] || Sparkles;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "no-tap group relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300",
        "min-h-[7.5rem] active:scale-[0.98]",
        selected
          ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
          : "border-border bg-card text-foreground hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_hsl(179_69%_17%_0.35)]"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
          selected ? "bg-white/15 text-primary-foreground" : "bg-secondary text-primary"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <span className="font-heading text-[1.05rem] leading-tight font-medium tracking-tight">
        {state.label}
      </span>
    </button>
  );
}