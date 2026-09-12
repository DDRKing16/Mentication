import React from "react";
import {
  Brain, Activity, Waves, Volume2, Feather, VolumeX,
  Shuffle, Armchair, EyeOff, Sparkles, Check,
  Home, Briefcase, Users, TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  Brain, Activity, Waves, Volume2, Feather, VolumeX,
  Shuffle, Armchair, EyeOff, Sparkles,
  Home, Briefcase, Users, TreePine,
};

export default function ChoiceButtons({ options, value, onSelect, columns = "grid-cols-1 sm:grid-cols-3" }) {
  return (
    <div className={cn("grid gap-3", columns)}>
      {options.map((opt) => {
        const Icon = opt.icon ? ICONS[opt.icon] : null;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value, opt)}
            className={cn(
              "no-tap flex items-center gap-3 rounded-2xl border p-5 text-left transition-all duration-300 active:scale-[0.98]",
              active
                ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                : "border-border bg-card hover:border-primary/30 hover:-translate-y-0.5"
            )}
          >
            {Icon && (
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  active ? "bg-white/15" : "bg-secondary text-primary"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
            )}
            <span className="flex-1 font-heading text-lg font-medium leading-tight tracking-tight">
              {opt.label}
            </span>
            {active && <Check className="h-5 w-5 shrink-0 text-primary-foreground" strokeWidth={2.2} />}
          </button>
        );
      })}
    </div>
  );
}