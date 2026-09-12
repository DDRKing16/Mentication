import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LifeBuoy, Trash2, ShieldCheck, Download } from "lucide-react";
import { useAccessibility } from "@/lib/accessibility";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { Button } from "@/components/ui/button";
import { deleteFlagshipMemory } from "@/lib/flagshipMemory";
import { exportLocalAppData } from "@/lib/localData";

function Toggle({ label, desc, on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="no-tap flex w-full items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 active:scale-[0.99]"
    >
      <span className="pr-4">
        <span className="block font-heading text-lg font-medium text-foreground">{label}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
      <span className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (on ? "bg-primary" : "bg-secondary")}>
        <span className={"absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all " + (on ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const a11y = useAccessibility() || {};
  const { update } = a11y;
  const amb = useAccessibilityPrefs();
  const [memoryCleared, setMemoryCleared] = useState(false);
  const [exported, setExported] = useState(false);

  const exportData = () => {
    const payload = exportLocalAppData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mentation-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pt-10 pb-28">
        <button
          onClick={() => navigate(-1)}
          className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mt-6 font-heading text-3xl font-medium tracking-tight text-primary">Settings</h1>
        <p className="mt-2 text-lg text-muted-foreground">Make Mentication work for your body and eyes.</p>

        <div className="mt-8 flex flex-col gap-3">
          <Toggle
            label="Reduce motion"
            desc="Calm animations and transitions"
            on={!!a11y.reducedMotion}
            onToggle={() => update({ reducedMotion: !a11y.reducedMotion })}
          />
          <Toggle
            label="High contrast"
            desc="Stronger text and borders"
            on={!!a11y.highContrast}
            onToggle={() => update({ highContrast: !a11y.highContrast })}
          />
          <Toggle
            label="Captions on by default"
            desc="Show guide text during resets"
            on={!!a11y.captions}
            onToggle={() => update({ captions: !a11y.captions })}
          />
          <Toggle
            label="One-handed reach"
            desc="Narrow layout for thumb use"
            on={!!a11y.oneHanded}
            onToggle={() => update({ oneHanded: !a11y.oneHanded })}
          />
          <Toggle
            label="Ambient soundscape"
            desc="Soft rain or white noise under narration"
            on={!!amb.prefs.ambientSoundscape}
            onToggle={() => amb.setPref("ambientSoundscape", !amb.prefs.ambientSoundscape)}
          />
        </div>

        {amb.prefs.ambientSoundscape && (
          <div className="mt-3 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Soundscape</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[{ v: "rain", label: "Soft rain" }, { v: "whitenoise", label: "Soft white noise" }].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => amb.setPref("ambientType", o.v)}
                  className={
                    "no-tap rounded-2xl border py-3 text-sm font-medium transition-all active:scale-95 " +
                    (amb.prefs.ambientType === o.v
                      ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                      : "border-border bg-card text-foreground hover:border-primary/30")
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">Text size</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { v: 1, label: "Default" },
              { v: 1.15, label: "Large" },
              { v: 1.3, label: "Extra large" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => update({ textScale: o.v })}
                className={
                  "no-tap rounded-2xl border py-3 text-sm font-medium transition-all active:scale-95 " +
                  (a11y.textScale === o.v
                    ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                    : "border-border bg-card text-foreground hover:border-primary/30")
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <LifeBuoy className="h-4 w-4" /> Need urgent support?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">If you’re in crisis, reach a support line now.</p>
          <Button variant="outline" onClick={() => navigate("/support")} className="mt-4 rounded-full">
            Crisis support
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Trash2 className="h-4 w-4" /> Your data
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We store as little as possible and never keep raw free-text beyond what you choose to save. Delete your
            session history any time from your Profile.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/profile")} className="rounded-full">
              Manage & delete my data
            </Button>
            <Button variant="outline" onClick={exportData} className="rounded-full">
              <Download className="mr-2 h-4 w-4" /> Export my data
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              if (!window.confirm("Delete local intervention memory, saved return points and handoff preferences from this device?")) return;
              deleteFlagshipMemory("all");
              setMemoryCleared(true);
            }}
            className="mt-2 rounded-full text-muted-foreground"
          >
            Delete local intervention memory
          </Button>
          {memoryCleared && <p role="status" className="mt-2 text-sm text-muted-foreground">Local intervention memory deleted.</p>}
          {exported && <p role="status" className="mt-2 text-sm text-muted-foreground">A local data export was downloaded to this device.</p>}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Privacy
          </p>
          <p className="mt-2 text-sm text-muted-foreground">No account, tracking or remote session database. Your history stays on this device.</p>
          <Button variant="outline" onClick={() => navigate("/privacy")} className="mt-4 rounded-full">
            Read the privacy summary
          </Button>
        </div>
      </div>
    </div>
  );
}
