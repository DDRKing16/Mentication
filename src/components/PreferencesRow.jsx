// @ts-check
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
    <details className="group mt-5 rounded-2xl border border-border bg-card">
      <summary className="no-tap flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-foreground">
        Optional preferences
        <span className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true">+</span>
      </summary>
      <p className="px-4 pb-3 text-xs text-muted-foreground">Adjust how the reset is guided.</p>
      <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-4">
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
    </details>
  );
}