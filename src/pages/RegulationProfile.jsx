import {startReminderDeletion} from '@/lib/reminders';
import { useAllDeviceSessions } from '@/hooks/useDeviceSessions';
import { repeatLaunchEntry } from '@/lib/practiceLaunch';
// @ts-check
import React, { useMemo, useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Castle, ChevronLeft, Sparkles, TrendingDown, Repeat, Layers, History } from "lucide-react";
import { deleteAllLocalAppData } from "@/lib/localData";
import { buildProfile, pickLastWorked } from "@/lib/interventions";
import { derivePeacePalace } from "@/lib/peacePalace";
import { usePremium } from "@/hooks/usePremium";
import SafetyFooter from "@/components/SafetyFooter";
import PullToRefresh from "@/components/PullToRefresh";

// The reset history chart pulls in a full charting library (and its own
// sizeable dependencies) that nothing else in the app needs, so it loads
// on demand rather than riding along with the rest of this page.
const ResetHistory = lazy(() => import("@/components/history/ResetHistory"));

function ResetHistoryFallback() {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <History className="h-4 w-4" />
        <span className="text-sm font-medium uppercase tracking-[0.15em]">Reset history</span>
      </div>
      <div className="mt-3 h-24 w-full animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}

export default function RegulationProfile() {
  const navigate = useNavigate();
  const {sessions,ready,error,reload:loadSessions}=useAllDeviceSessions();
  // Pattern suggestions intentionally describe the latest 100 resets. Palace
  // growth, date-based counts and retained-history totals use every session.
  const recentSessions=useMemo(()=>sessions.slice(0,100),[sessions]);
  const profile=useMemo(()=>buildProfile(recentSessions),[recentSessions]);
  const lastWorked=useMemo(()=>pickLastWorked(recentSessions),[recentSessions]);
  const [confirming,setConfirming]=useState(false),[deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState('');
  const [deleted, setDeleted] = useState(false);
  const [reminderCleanup, setReminderCleanup] = useState('');
  const deletionRunning = useRef(false);
  const deletionComplete = useRef(false);
  const deletionAttempt = useRef(0);
  const weekCount=sessions.filter(s=>new Date(s.created_date).getTime()>=Date.now()-7*86400000).length;
  const { isPremium } = usePremium();
  const palace = useMemo(() => derivePeacePalace(sessions), [sessions]);

  const trackReminderCleanup = () => {
    const attempt = ++deletionAttempt.current;
    setReminderCleanup('pending');
    const cleanup = startReminderDeletion();
    void cleanup.then(result => {
      if (deletionAttempt.current === attempt) setReminderCleanup(result.ok ? 'confirmed' : 'uncertain');
    });
  };

  const deleteAll = () => {
    // Native cleanup is independent of the user's already-confirmed local
    // erasure. A rejected or hanging bridge must never gate deleting notes.
    if (deletionRunning.current || deletionComplete.current) return;
    deletionRunning.current = true;
    setDeleting(true); setDeleteError('');
    trackReminderCleanup();
    try {
      deleteAllLocalAppData();
      deletionComplete.current = true;
      setDeleted(true); setConfirming(false);
    } catch {
      setDeleteError('Some app data could not be verified as deleted. Try again. Reminder cleanup is separate.');
    } finally {
      setDeleting(false); deletionRunning.current = false;
    }
  };


  const doLastWorked = () => {
    const s = lastWorked;
    if (!s) return;
    navigate("/reset", {
      state: repeatLaunchEntry(s),
    });
  };

  const dataControls=(
        <div className="mt-10 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <p className="font-heading text-lg font-medium tracking-tight text-foreground">Your data, your control</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Delete saved practices, notes, plans and preferences from this app on this device. Files saved outside the app and App Store purchases are not deleted.
          </p>
          {deleteError && <p role="alert" className="mt-3">{deleteError}</p>}
          {reminderCleanup && reminderCleanup !== 'confirmed' && <p role="status" className="mt-3 text-sm leading-relaxed">
            Daily reminder cleanup {reminderCleanup === 'pending' ? 'is still being checked' : 'could not be confirmed'}. Pending notifications may still arrive. Turn off notifications for Mentication in your phone’s Settings to prevent alerts. Minimal cleanup status may remain until it is safe to remove.
          </p>}
          {reminderCleanup === 'uncertain' && <Button variant="outline" onClick={trackReminderCleanup} className="mt-3 rounded-full">Retry reminder cleanup</Button>}
          {deleted ? (
            <div className="mt-4">
              <p role="status">App data deleted from this device.</p>
              <Button onClick={() => navigate("/")} className="mt-3 rounded-full">Back to start</Button>
            </div>
          ) : confirming ? (
            <div className="mt-4">
              <p className="mb-3 text-sm">This cannot be undone. Reminder cancellation is separate and will not stop local erasure; unresolved cleanup status may be kept.</p>
              <div className="flex flex-wrap gap-2">
              <Button variant="destructive" onClick={deleteAll} disabled={deleting} className="rounded-full">
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting} className="rounded-full">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)} className="mt-4 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
              Delete all my data
            </Button>
          )}
        </div>
  );

  if (!ready) {
    return (
      <div role="status" aria-label="Loading local history" className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-secondary border-t-primary animate-spin" />
      </div>
    );
  }

  if ((!profile || profile.count === 0) && !confirming && !deleted) {
    return (
      <div className="calmbg min-h-full">
        <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
          {error && <div role="alert" className="rounded-2xl border border-border p-4"><p>{error}</p><button className="min-h-11 underline" onClick={loadSessions}>Try history again</button></div>}
          <button onClick={() => navigate("/")} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="mt-20 text-center">
            <h1 className="font-heading text-3xl font-medium tracking-tight text-primary text-balance">
              {sessions.length > 0 ? `${sessions.length} reset${sessions.length === 1 ? "" : "s"} so far` : "No resets yet"}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-lg text-muted-foreground text-balance">
              {sessions.length > 0
                ? "Next time, rate how you feel before and after. That's what shows what helps you, and your profile will appear here."
                : "Complete a reset or two and your regulation profile will appear here."}
            </p>
            <Button onClick={() => navigate("/")} className="mt-8 rounded-full">Back to start</Button>
          </div>
          {dataControls}
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadSessions}>
      {error && <div role="alert" className="mx-5 mt-5 rounded-2xl border border-border p-4"><p>{error}</p><button className="min-h-11 underline" onClick={loadSessions}>Try history again</button></div>}
      <div className="calmbg min-h-full">
        <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
          <button onClick={() => navigate("/")} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Your regulation profile</p>
          <h1 className="mt-3 font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
            What tends to help you
          </h1>
          {weekCount > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {weekCount} reset{weekCount === 1 ? "" : "s"} this week · {profile.count} rated in the latest {recentSessions.length} resets
            </p>
          )}
        </motion.div>

        {/* typical change */}
        {profile.count > 0 && <div className="mt-8 rounded-2xl border border-border bg-card p-6 soft-depth">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-[0.15em]">Typical change</span>
          </div>
          <p className="mt-4 text-center font-heading text-3xl text-primary">
            {profile.change > 0 ? `${profile.change} points better` : profile.change < 0 ? `${Math.abs(profile.change)} points worse` : "No change"}
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Average change across {profile.count} rated reset{profile.count === 1 ? "" : "s"} in the latest {recentSessions.length}, using each goal’s rating direction.
          </p>
        </div>}

        {/* do what worked last time */}
        {lastWorked && (
          <button
            onClick={doLastWorked}
            data-sfx="select"
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-left transition-all hover:bg-primary/10 active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Repeat className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="flex-1">
              <span className="block font-heading text-base font-medium tracking-tight text-primary">Do what worked last time</span>
              <span className="block text-sm text-muted-foreground">Re-run your best recent pathway</span>
            </span>
          </button>
        )}

        <button
          onClick={() => navigate("/palace")}
          data-sfx="select"
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-left transition-all hover:border-primary/30 active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Castle className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className="flex-1">
            <span className="block font-heading text-base font-medium tracking-tight text-primary">Your Peace Palace</span>
            <span className="block text-sm text-muted-foreground">
              A place that grows with every practice{palace.completedCount > 0 ? ` · now at ${palace.stage.name.toLowerCase()}` : " · nothing built yet"}
            </span>
          </span>
        </button>

        <Suspense fallback={<ResetHistoryFallback />}>
          <p className="mt-8 text-sm text-muted-foreground">Showing your latest {recentSessions.length} resets below. Older saved practices still count toward your palace and streak.</p>
          <ResetHistory sessions={recentSessions} />
        </Suspense>

        {isPremium && profile.topTools.length > 0 && (
          <Section title="What tends to help you most" icon={<Sparkles className="h-4 w-4" />}>
            {profile.topTools.map((t) => (
              <ToolRow key={t.id} name={t.name} right={`+${t.drop}`} sub={`${t.uses}×`} />
            ))}
          </Section>
        )}

        {isPremium && profile.mostUsed.length > 0 && (
          <Section title="Most-used tools" icon={<Layers className="h-4 w-4" />}>
            {profile.mostUsed.map((t) => (
              <ToolRow key={t.id} name={t.name} right={`${t.uses}×`} sub={t.avgDrop > 0 ? `${t.avgDrop} better` : t.avgDrop < 0 ? `${Math.abs(t.avgDrop)} worse` : "No change"} />
            ))}
          </Section>
        )}

        {isPremium && profile.bestCombo && (
          <Section title="Strongest combination" icon={<TrendingDown className="h-4 w-4" />}>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex flex-wrap gap-1.5">
                {profile.bestCombo.names.map((n, i) => (
                  <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{n}</span>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Improved {profile.bestCombo.drop} on average across {profile.bestCombo.n} run{profile.bestCombo.n === 1 ? "" : "s"}.
              </p>
            </div>
          </Section>
        )}

        {dataControls}

          <SafetyFooter />
        </div>
      </div>
    </PullToRefresh>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium uppercase tracking-[0.15em]">{title}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ToolRow({ name, right, sub }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-sm text-muted-foreground">
        <span className="font-medium text-primary">{right}</span> {sub ? `· ${sub}` : ""}
      </span>
    </div>
  );
}
