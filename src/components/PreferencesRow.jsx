import React from "react";
import { Eye, EyeOff, Ban, VolumeX } from "lucide-react";

const PREFS = [
  { key: "discreet", label: "Discreet", icon: EyeOff, hint: "No spoken audio, subtle visuals" },
  { key: "eyesOpen", label: "Eyes open", icon: Eye, hint: "No eyes-closed practices" },
  { key: "noBreathing", label: "No breathing", icon: Ban, hint: "Skip paced-breath work" },
  { key: "noAudio", label: "No audio", icon: VolumeX, hint: "Silent only" },
];

export default function PreferencesRow({ answers, setAnswers }) {
  const toggle = (key) => setAnswers((a) => ({ ...a, [key]: !a[key] }));
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-muted-foreground">
        Any preferences? <span className="text-muted-foreground/60">Optional — make this reset work for you.</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PREFS.map((p) => {
          const on = !!answers[p.key];
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => toggle(p.key)}
              title={p.hint}
              className={
                "no-tap flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition-all active:scale-95 " +
                (on
                  ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                  : "border-border bg-card text-foreground hover:border-primary/30")
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span className="text-sm font-medium leading-tight">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}