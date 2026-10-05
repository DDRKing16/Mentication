import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CloudUpload, LifeBuoy, Trash2, ShieldCheck } from "lucide-react";
import { useAccessibility } from "@/lib/accessibility";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { Button } from "@/components/ui/button";
import { deleteFlagshipMemory } from "@/lib/flagshipMemory";
import { usePlus } from "@/lib/subscription";
import { backupSessionCount, parseBackup, restoreBackup, saveBackup } from "@/lib/backup";
import { disableDailyReminder, enableDailyReminder, formatReminderTime, getReminderPrefs, remindersSupported, setReminderTime } from "@/lib/reminders";

function Toggle({ label, desc, on, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="no-tap flex w-full items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 active:scale-[0.99]"
    >
      <span className="pr-4">
        <span className="block font-heading text-lg font-medium text-foreground">{label}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
      <span aria-hidden="true" className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (on ? "bg-primary" : "bg-secondary")}>
        <span className={"absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all " + (on ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const plus = usePlus();
  const [reminder, setReminder] = useState(getReminderPrefs);
  const [reminderNote, setReminderNote] = useState("");
  const [backupNote, setBackupNote] = useState("");
  const [pendingRestore, setPendingRestore] = useState(null);
  const restoreInput = useRef(null);

  const onSaveBackup = async () => {
    setBackupNote("");
    const result = await saveBackup().catch(() => "failed");
    if (result === "shared") setBackupNote("Backup saved.");
    else if (result === "downloaded") setBackupNote("Backup saved to your downloads.");
    else if (result === "failed") setBackupNote("That didn't work. Please try again.");
  };
  const onPickBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPendingRestore(parseBackup(await file.text()));
      setBackupNote("");
    } catch (error) {
      setPendingRestore(null);
      setBackupNote(error.message);
    }
  };
  const confirmRestore = () => {
    restoreBackup(pendingRestore);
    setPendingRestore(null);
    window.location.assign("/");
  };
  const setReminderOn = async (on, hour = reminder.hour, minute = reminder.minute) => {
    setReminderNote("");
    if (on) {
      const result = await enableDailyReminder(hour, minute);
      if (!result.ok) setReminderNote("Notifications are turned off for Mentication. You can allow them in your iPhone's Settings → Notifications.");
      else if (result.reason === "preview") setReminderNote("Saved. Reminders appear in the iPhone app.");
    } else {
      await disableDailyReminder();
    }
    setReminder(getReminderPrefs());
  };
  const a11y = useAccessibility() || {};
  const { update } = a11y;
  const amb = useAccessibilityPrefs();
  const [memoryCleared, setMemoryCleared] = useState(false);

  return (
    <div className="calmbg min-h-full">
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
            on={!!amb.prefs.reducedMotion}
            onToggle={() => amb.setPref("reducedMotion", !amb.prefs.reducedMotion)}
          />
          <Toggle
            label="High contrast"
            desc="Stronger text and borders"
            on={!!amb.prefs.highContrast}
            onToggle={() => amb.setPref("highContrast", !amb.prefs.highContrast)}
          />
          <Toggle
            label="Captions on by default"
            desc="Show guide text during resets"
            on={!!amb.prefs.captions}
            onToggle={() => amb.setPref("captions", !amb.prefs.captions)}
          />
          <Toggle
            label="One-handed reach"
            desc="Narrow layout for thumb use"
            on={!!amb.prefs.oneHanded}
            onToggle={() => amb.setPref("oneHanded", !amb.prefs.oneHanded)}
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
                onClick={() => { update({ textScale: o.v }); amb.setPref("largeText", o.v > 1); }}
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
          <Button variant="outline" onClick={() => navigate("/profile")} className="mt-4 rounded-full">
            Manage & delete my data
          </Button>
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
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Daily reminder</p>
          <p className="mt-2 text-sm text-muted-foreground">A gentle nudge once a day. It's scheduled on this phone, never sent from anywhere.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant={reminder.enabled ? "default" : "outline"} onClick={() => void setReminderOn(!reminder.enabled)} className="rounded-full" aria-pressed={reminder.enabled}>
              {reminder.enabled ? "On" : "Off"}
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>at</span>
              <input
                type="time"
                value={`${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`}
                onChange={(event) => {
                  const [h, m] = event.target.value.split(":").map(Number);
                  if (!Number.isInteger(h) || !Number.isInteger(m)) return;
                  // Only reschedule if reminders are already on. If they're
                  // off, just remember the time for when they're turned on -
                  // touching the picker shouldn't silently enable notifications.
                  if (reminder.enabled) void setReminderOn(true, h, m);
                  else { setReminderTime(h, m); setReminder(getReminderPrefs()); }
                }}
                className="min-h-11 rounded-full border border-border bg-background px-3 text-foreground"
                aria-label="Reminder time"
              />
            </label>
          </div>
          {reminder.enabled && <p className="mt-2 text-sm text-muted-foreground">Every day at {formatReminderTime(reminder.hour, reminder.minute)}.</p>}
          {reminderNote && <p role="status" className="mt-2 text-sm text-muted-foreground">{reminderNote}</p>}
          {!remindersSupported() && !reminderNote && <p className="mt-2 text-xs text-muted-foreground">Reminders appear in the iPhone app, not this preview.</p>}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mentication Plus</p>
          <p className="mt-2 text-sm text-muted-foreground">{plus.founderPreview ? "Founder testing preview — all experiences open. No paid subscription." : plus.active ? "Plus is active on this Apple ID." : "Dear 2100, The Good Map and new journeys. The everyday tools stay free."}</p>
          <Button variant="outline" onClick={() => navigate("/plus")} className="mt-4 rounded-full">
            {plus.founderPreview ? "Preview access" : plus.active ? "Manage Plus" : "See Plus"}
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <CloudUpload className="h-4 w-4" /> Backup
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Everything lives only on this phone. Save a backup to iCloud Drive or Files, so you can bring it back on a new phone.</p>
          {pendingRestore ? (
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
              <p className="text-sm font-medium text-foreground">
                Restore the backup from {new Date(pendingRestore.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                It holds {backupSessionCount(pendingRestore)} {backupSessionCount(pendingRestore) === 1 ? "practice" : "practices"}. Practices already on this phone are kept; your journeys and settings take the backup's version.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={confirmRestore} className="rounded-full">Restore</Button>
                <Button variant="outline" onClick={() => setPendingRestore(null)} className="rounded-full">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" onClick={onSaveBackup} className="rounded-full">Save a backup</Button>
              <Button variant="outline" onClick={() => restoreInput.current?.click()} className="rounded-full">Restore from a backup</Button>
            </div>
          )}
          <input ref={restoreInput} type="file" accept="application/json,.json" onChange={onPickBackup} className="hidden" aria-hidden="true" tabIndex={-1} />
          {backupNote && <p role="status" className="mt-3 text-sm text-muted-foreground">{backupNote}</p>}
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
