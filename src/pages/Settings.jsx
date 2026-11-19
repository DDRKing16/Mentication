import { AMBIENT_OPTIONS } from "@/hooks/useAmbientSound";
import {useAppBack} from '@/hooks/useAppBack';
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CloudUpload, LifeBuoy, Trash2, ShieldCheck } from "lucide-react";
import { useAccessibility } from "@/lib/accessibility";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { Button } from "@/components/ui/button";
import { deleteFlagshipMemory } from "@/lib/flagshipMemory";
import { usePlus } from "@/lib/subscription";
import { parseBackup, previewBackup, readRestoreCopies, removeRestoreCopy, RESTORE_COPIES_KEY, restoreBackup, saveBackup } from "@/lib/backup";
import { disableDailyReminder, enableDailyReminder, formatReminderTime, getReminderPrefs, getReminderWarning, remindersSupported, setReminderTime } from "@/lib/reminders";

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

const RESTORE_RECEIPT_KEY = "mentation.backup-restore.receipt.v1";

function backupDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "an unknown date";
}

function RestoreCopies({ copies, error, busy, onExport, onRetry, onRemove }) {
  if (!copies.length && !error) return null;
  return <section aria-label="Before-restore copies" className="mt-5 rounded-xl border border-border p-4">
    <h2 className="font-heading text-lg text-foreground">Before-restore copies</h2>
    <p className="mt-2 text-sm text-muted-foreground">These copies keep the earlier values that a restore replaced. They are not an automatic Undo and do not remove newly added items. Save a copy, then use Restore from a backup to review it.</p>
    <p className="mt-2 text-sm text-muted-foreground">They stay on this device and are not included in a normal backup. Export them separately. Deleting app data removes them.</p>
    {error && <><p role="status" className="mt-2 text-sm">{error}</p><Button variant="outline" disabled={busy} onClick={onRetry} className="mt-2 min-h-11 rounded-full">Try reading copies again</Button></>}
    <ol className="mt-3 flex flex-col gap-3">
      {copies.map((copy, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>Copy {index + 1} · {backupDate(copy.createdAt)}</span>
        <Button variant="outline" disabled={busy} onClick={() => onExport(index, copy)} className="min-h-11 rounded-full">Save copy {index + 1}</Button>
        <Button variant="outline" disabled={busy} onClick={() => onRemove(index, copy)} className="min-h-11 rounded-full">Remove copy {index + 1}</Button>
      </li>)}
    </ol>
  </section>;
}

export default function Settings() {
  const navigate = useNavigate();
  const goBack=useAppBack();
  const plus = usePlus();
  const [reminder, setReminder] = useState(getReminderPrefs);
  const [memoryError, setMemoryError] = useState("");
  const [reminderNote, setReminderNote] = useState(getReminderWarning);
  const [reminderBusy, setReminderBusy] = useState(false);
  const reminderInFlight = useRef(false);
  const [backupNote, setBackupNote] = useState("");
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoreReloadRequired, setRestoreReloadRequired] = useState(false);
  const [restorePolicy, setRestorePolicy] = useState("keep-current");
  const [backupAction, setBackupAction] = useState("");
  const [restoreResult, setRestoreResult] = useState(null);
  const [restoreCopies, setRestoreCopies] = useState([]);
  const [copiesError, setCopiesError] = useState("");
  const restoreInput = useRef(null);
  const restoreHeading = useRef(null);
  const backupOperation = useRef(0);
  const backupBusy = useRef(false);
  const backupMounted = useRef(true);
  const refreshCopies = () => {
    try { setRestoreCopies(readRestoreCopies()); setCopiesError(""); }
    catch { setRestoreCopies([]); setCopiesError("Before-restore copies could not be read. Nothing has been removed. Try again when device storage is available."); }
  };
  useEffect(() => {
    backupMounted.current = true;
    refreshCopies();
    const changed = event => { if (event.key === RESTORE_COPIES_KEY || event.key === null) refreshCopies(); };
    window.addEventListener("storage", changed);
    // A receipt describes only a verified local result, never backup content.
    // Read/remove in an effect, not a StrictMode-rendered state initializer.
    try {
      const receipt = JSON.parse(window.sessionStorage.getItem(RESTORE_RECEIPT_KEY) || "null");
      if (Number.isInteger(receipt?.changed) && receipt.changed >= 0) {
        setBackupNote(receipt.changed === 0 ? "Nothing needed changing. Your selected versions are already in place." : "Restore saved on this device. The app has reloaded with the selected versions.");
      }
      window.sessionStorage.removeItem(RESTORE_RECEIPT_KEY);
    } catch { /* Receipt delivery is optional; storage verification decided restore success. */ }
    return () => { backupMounted.current = false; backupOperation.current += 1; window.removeEventListener("storage", changed); };
  }, []);
  useEffect(() => { if (pendingRestore || restoreResult !== null) restoreHeading.current?.focus(); }, [pendingRestore, restoreResult]);

  const onSaveBackup = async (backup, name) => {
    if (backupBusy.current) return;
    backupBusy.current = true;
    const operation = ++backupOperation.current;
    setBackupAction("exporting");
    setBackupNote("");
    const result = await saveBackup(backup, name).catch(() => "failed");
    if (!backupMounted.current || operation !== backupOperation.current) return;
    if (result === "shared") setBackupNote("Backup handed to the share destination. Check that you kept the file somewhere safe.");
    else if (result === "downloaded") setBackupNote("Backup download requested. Check your downloads or Files before relying on it.");
    else if (result === "cancelled") setBackupNote("Sharing was cancelled. No backup save was confirmed.");
    else setBackupNote("The backup could not be handed off. Please try again.");
    backupBusy.current = false;
    setBackupAction("");
  };
  const onExportCopy = async (index, copy) => {
    if (backupBusy.current) return;
    try {
      const latest = readRestoreCopies();
      if (JSON.stringify(latest[index]) !== JSON.stringify(copy)) {
        setRestoreCopies(latest);
        setBackupNote("Before-restore copies changed. Review the refreshed list before choosing a copy to save.");
        return;
      }
    } catch {
      setRestoreCopies([]);
      setCopiesError("Before-restore copies could not be read. Nothing has been removed. Try again when device storage is available.");
      return;
    }
    await onSaveBackup(copy, `Mentication before-restore copy ${index + 1}.json`);
  };
  const onRemoveCopy = (index, copy) => {
    if (backupBusy.current) return;
    if (!window.confirm(`Permanently remove before-restore copy ${index + 1} from this device? Keep an exported copy first if you may need it. A share or download handoff does not confirm that the file was saved. Exported files are not deleted.`)) return;
    backupBusy.current = true;
    setBackupAction("removing");
    try {
      removeRestoreCopy(index, copy);
      setBackupNote("Before-restore copy removed from this device. Exported files are unchanged.");
    } catch (error) {
      setBackupNote(error.code === "RESTORE_COPY_CHANGED" ? "Before-restore copies changed. Review the refreshed list before choosing a copy to remove." : error.message);
    } finally {
      refreshCopies();
      backupBusy.current = false;
      setBackupAction("");
    }
  };
  const onPickBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || backupBusy.current || restoreReloadRequired) return;
    backupBusy.current = true;
    const operation = ++backupOperation.current;
    setBackupAction("reading");
    setPendingRestore(null);
    setBackupNote("");
    setRestorePolicy("keep-current");
    try {
      const backup = parseBackup(await file.text());
      if (!backupMounted.current || operation !== backupOperation.current) return;
      setPendingRestore({ backup, preview: previewBackup(backup) });
    } catch (error) {
      if (backupMounted.current && operation === backupOperation.current) setBackupNote(error.message);
    } finally {
      if (backupMounted.current && operation === backupOperation.current) {
        backupBusy.current = false;
        setBackupAction("");
      }
    }
  };
  const cancelRestore = () => {
    if (restoreReloadRequired) return;
    backupOperation.current += 1;
    backupBusy.current = false;
    setBackupAction("");
    setPendingRestore(null);
    setRestorePolicy("keep-current");
    setBackupNote("Restore review closed. No further changes were made.");
  };
  const reviewAgain = () => {
    if (!pendingRestore || backupBusy.current || restoreReloadRequired) return;
    setRestorePolicy("keep-current");
    try {
      setPendingRestore({ backup: pendingRestore.backup, preview: previewBackup(pendingRestore.backup) });
      setBackupNote("Review the updated preview before restoring.");
    } catch (error) {
      setPendingRestore({ backup: pendingRestore.backup, preview: null });
      setBackupNote(error.message);
    }
  };
  const confirmRestore = () => {
    if (!pendingRestore?.preview || backupBusy.current || restoreReloadRequired) return;
    backupBusy.current = true;
    setBackupAction("restoring");
    setBackupNote("");
    try {
      const changed = restoreBackup(pendingRestore.backup, undefined, { policy: restorePolicy, preview: pendingRestore.preview });
      setPendingRestore(null);
      setRestoreResult(changed);
      refreshCopies();
      try { window.sessionStorage.setItem(RESTORE_RECEIPT_KEY, JSON.stringify({ changed })); }
      catch { /* Do not turn a confirmed restore into a failure if its receipt is unavailable. */ }
      try { window.location.reload(); }
      catch { setBackupNote("The restore was saved, but the app could not reload automatically. Use Reload app before continuing."); }
    } catch (error) {
      if (error.code === "RESTORE_REVIEW_CHANGED") {
        setRestorePolicy("keep-current");
        try { setPendingRestore({ backup: pendingRestore.backup, preview: previewBackup(pendingRestore.backup) }); }
        catch { setPendingRestore({ backup: pendingRestore.backup, preview: null }); }
        setBackupNote("Data changed since this preview. Nothing was restored. Review the updated preview and choose again.");
      } else {
        if (error.code === "RESTORE_UNCERTAIN") {
          setRestoreReloadRequired(true);
          setPendingRestore({ backup: pendingRestore.backup, preview: null });
          setRestorePolicy("keep-current");
        }
        setBackupNote(error.message);
      }
      refreshCopies();
    } finally {
      backupBusy.current = false;
      setBackupAction("");
    }
  };
  const changeReminder = async (operation) => {
    if (reminderInFlight.current) return;
    reminderInFlight.current = true;
    setReminderBusy(true);
    setReminderNote(getReminderWarning());
    try {
      const result = await operation();
      if (!result.ok && result.reason === "denied") setReminderNote("Notifications are turned off for Mentication. You can allow them in your iPhone's Settings → Notifications.");
      else if (result.reason === "preview") setReminderNote("Saved. Reminders appear in the iPhone app.");
      else setReminderNote("");
    } catch (error) {
      setReminderNote(error instanceof Error ? error.message : "The reminder could not be changed. Please try again.");
    } finally {
      setReminder(getReminderPrefs());
      const warning = getReminderWarning();
      if (warning) setReminderNote(warning);
      reminderInFlight.current = false;
      setReminderBusy(false);
    }
  };
  const setReminderOn = (on) => changeReminder(() => on
    ? enableDailyReminder(reminder.hour, reminder.minute)
    : disableDailyReminder());
  const a11y = useAccessibility() || {};
  const { update } = a11y;
  const amb = useAccessibilityPrefs();
  const [memoryCleared, setMemoryCleared] = useState(false);

  if (restoreResult !== null) return <main className="settings-page calmbg min-h-full px-5 py-10">
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-5">
      <h1 ref={restoreHeading} tabIndex={-1} className="font-heading text-3xl text-primary outline-none">{restoreResult === 0 ? "Nothing needed changing." : "Restore saved on this device."}</h1>
      <p className="mt-3 text-muted-foreground">{restoreResult === 0 ? "Your selected versions are already in place." : "The selected changes were verified in device storage."} Reload the app to use the current settings and journeys.</p>
      <Button onClick={() => window.location.reload()} disabled={!!backupAction} className="mt-5 min-h-12 rounded-full">Reload app</Button>
      <RestoreCopies copies={restoreCopies} error={copiesError} busy={!!backupAction} onExport={onExportCopy} onRetry={refreshCopies} onRemove={onRemoveCopy} />
      {backupNote && <p role="status" className="mt-3 text-sm">{backupNote}</p>}
    </div>
  </main>;

  return (
    <div className="settings-page calmbg min-h-full">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pt-10 pb-28">
        <button
          onClick={goBack}
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
              {AMBIENT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={amb.prefs.ambientType === o.id}
                  onClick={() => amb.setPref("ambientType", o.id)}
                  className={
                    "no-tap rounded-2xl border py-3 text-sm font-medium transition-all active:scale-95 " +
                    (amb.prefs.ambientType === o.id
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
                aria-pressed={a11y.textScale === o.v}
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
            Your saved notes and practice records stay on this device. Some practices also keep a local draft so you can resume. You can manage saved notes in Return points and delete app data from your Profile.
          </p>
          <Button variant="outline" onClick={() => navigate("/profile")} className="mt-4 rounded-full">
            Manage & delete my data
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!window.confirm("Delete local intervention memory, saved return points and handoff preferences from this device?")) return;
              try { deleteFlagshipMemory("all"); setMemoryCleared(true); setMemoryError(""); }
              catch { setMemoryCleared(false); setMemoryError("Some local memory could not be deleted. Please try again."); }
            }}
            className="mt-2 rounded-full text-muted-foreground"
          >
            Delete local intervention memory
          </Button>
          {memoryError && <p role="alert" className="mt-2 text-sm">{memoryError}</p>}
          {memoryCleared && <p role="status" className="mt-2 text-sm text-muted-foreground">Local intervention memory deleted.</p>}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Daily reminder</p>
          <p className="mt-2 text-sm text-muted-foreground">A gentle nudge once a day. It's scheduled on this phone, never sent from anywhere.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant={reminder.enabled ? "default" : "outline"} onClick={() => void setReminderOn(!reminder.enabled)} className="rounded-full" disabled={reminderBusy} aria-busy={reminderBusy} aria-pressed={reminder.enabled}>
              {reminder.enabled ? "On" : "Off"}
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>at</span>
              <input
                type="time"
                disabled={reminderBusy}
                value={`${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`}
                onChange={(event) => {
                  const [h, m] = event.target.value.split(":").map(Number);
                  if (!Number.isInteger(h) || !Number.isInteger(m)) return;
                  void changeReminder(() => setReminderTime(h, m));
                }}
                className="min-h-11 rounded-full border border-border bg-background px-3 text-foreground"
                aria-label="Reminder time"
              />
            </label>
          </div>
          {reminder.enabled && <p className="mt-2 text-sm text-muted-foreground">Every day at {formatReminderTime(reminder.hour, reminder.minute)}.</p>}
          {reminderNote && <p role="status" className="mt-2 text-sm text-muted-foreground">{reminderNote}</p>}
          {getReminderWarning() && <Button variant="outline" className="mt-3 rounded-full" disabled={reminderBusy} onClick={() => void changeReminder(disableDailyReminder)}>Retry reminder cleanup</Button>}
          {!remindersSupported() && !reminderNote && <p className="mt-2 text-xs text-muted-foreground">Reminders appear in the iPhone app, not this preview.</p>}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Journey access</p>
          <p className="mt-2 text-sm text-muted-foreground">All journeys are free. {plus.test ? "A development test purchase is recorded; this is not a paid subscription." : plus.active ? "An existing Plus subscription is recorded on this device." : "No active paid subscription is recorded on this device."}</p>
          <Button variant="outline" onClick={() => navigate("/plus")} className="mt-4 rounded-full">
            Access and subscription details
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <CloudUpload className="h-4 w-4" /> Backup
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Your saved history, notes and plans are stored on this device. A backup may contain personal text; save or share it only somewhere you trust, such as Files or iCloud Drive. Optional website background check-ins use a server for delivery details, not your plan text. Browser notification ownership is not backed up. Deleting app data does not delete exported copies.</p>
          {pendingRestore ? (
            <section aria-labelledby="restore-preview-title" className="mt-4 rounded-xl border border-border bg-background/60 p-4">
              <h2 id="restore-preview-title" ref={restoreHeading} tabIndex={-1} className="font-heading text-lg text-foreground outline-none">Review this restore</h2>
              <p className="mt-2 text-sm text-muted-foreground">Backup from {backupDate(pendingRestore.backup.createdAt)}.</p>
              {restoreReloadRequired ? <p role="alert" className="mt-3 text-sm">Keep your original backup file and any before-restore copies. Reload the app, then select the original backup again to review the current device data before trying another restore.</p> : pendingRestore.preview ? <>
                <p data-testid="restore-preview-summary" className="mt-2 text-sm text-muted-foreground">{pendingRestore.preview.addedSessions} backup-only practices and {pendingRestore.preview.addedDataGroups} missing data groups will be added. {pendingRestore.preview.sessionConflicts} matching practice records and {pendingRestore.preview.dataConflicts} existing data groups have different versions.</p>
                <fieldset disabled={!!backupAction} className="mt-4 flex flex-col gap-3">
                  <legend className="mb-2 text-sm font-medium">When versions differ</legend>
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
                    <input type="radio" name="restore-policy" value="keep-current" checked={restorePolicy === "keep-current"} onChange={() => setRestorePolicy("keep-current")} className="mt-1" />
                    <span><span className="block font-medium">Keep this device’s versions</span><span className="block text-sm text-muted-foreground">Keep matching practices and existing notes, plans, journeys and settings unchanged. Add only backup-only practices and missing data groups.</span></span>
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
                    <input type="radio" name="restore-policy" value="use-backup" checked={restorePolicy === "use-backup"} onChange={() => setRestorePolicy("use-backup")} className="mt-1" />
                    <span><span className="block font-medium">Use the backup’s versions</span><span className="block text-sm text-muted-foreground">Replace differing matching practice records and entire existing data groups. This can replace newer notes or plans; entries inside those groups are not merged. A group can contain many notes, cards or plans.</span></span>
                  </label>
                </fieldset>
                <p className="mt-3 text-sm text-muted-foreground">Neither option removes practices found only on this device. Dates alone do not decide which version wins. Keep the original backup file for versions you do not import.</p>
                {restorePolicy === "use-backup" && <p role="status" className="mt-3 text-sm text-foreground">Before replacing existing values, a before-restore copy must be saved and verified on this device. Earlier copies are retained. If there is not enough space, the restore will stop.</p>}
                <p className="mt-3 text-sm text-muted-foreground">Subscriptions, on-device reminders and browser notification ownership are not restored.</p>
              </> : <p className="mt-3 text-sm">The preview could not be refreshed. Try reviewing again before making changes.</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                {restoreReloadRequired ? <Button disabled={!!backupAction} onClick={() => window.location.reload()} className="min-h-11 rounded-full">Reload app</Button> : pendingRestore.preview ? <Button disabled={!!backupAction} onClick={confirmRestore} className="min-h-11 rounded-full">Restore selected versions</Button> : <Button disabled={!!backupAction} onClick={reviewAgain} className="min-h-11 rounded-full">Review again</Button>}
                {!restoreReloadRequired && <Button disabled={!!backupAction} variant="outline" onClick={cancelRestore} className="min-h-11 rounded-full">Cancel restore</Button>}
              </div>
            </section>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button disabled={!!backupAction} variant="outline" onClick={() => void onSaveBackup()} className="min-h-11 rounded-full">Save a backup</Button>
              <Button disabled={!!backupAction} variant="outline" onClick={() => restoreInput.current?.click()} className="min-h-11 rounded-full">Restore from a backup</Button>
            </div>
          )}
          {backupAction === "reading" && <div className="mt-3"><p role="status">Reading the backup file…</p><Button variant="outline" onClick={cancelRestore} className="mt-2 min-h-11 rounded-full">Cancel reading</Button></div>}
          {backupAction === "exporting" && <p role="status" className="mt-3 text-sm">Preparing the backup handoff…</p>}
          <input ref={restoreInput} type="file" accept="application/json,.json" onChange={onPickBackup} disabled={!!backupAction || restoreReloadRequired} className="hidden" aria-hidden="true" tabIndex={-1} />
          {backupNote && <p role="status" className="mt-3 text-sm text-muted-foreground">{backupNote}</p>}
          <RestoreCopies copies={restoreCopies} error={copiesError} busy={!!backupAction} onExport={onExportCopy} onRetry={refreshCopies} onRemove={onRemoveCopy} />
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
