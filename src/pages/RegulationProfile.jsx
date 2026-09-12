import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, TrendingDown, Repeat, Layers, Download } from "lucide-react";
import CrisisSupportCard from "@/components/CrisisSupportCard";
import { deleteAllLocalAppData, downloadLocalAppData, sessionStore } from "@/lib/localData";
import { buildProfile, pickLastWorked } from "@/lib/interventions";
import { weekCountCutoff } from "@/lib/insights";
import { usePremium } from "@/hooks/usePremium";
import SafetyFooter from "@/components/SafetyFooter";
import PullToRefresh from "@/components/PullToRefresh";
import ResetHistory from "@/components/history/ResetHistory";

export default function RegulationProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [lastWorked, setLastWorked] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [weekCount, setWeekCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const { isPremium } = usePremium();
  const lastSessionDate = useMemo(() => sessions[0]?.created_date ? new Date(sessions[0].created_date).toLocaleDateString() : null, [sessions]);

  useEffect(() => {
    if (!confirming) {
      setCountdown(0);
      return;
    }
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [confirming]);

  const deleteAll = async () => {
    if (countdown > 0) return;
    setDeleting(true);
    try {
      deleteAllLocalAppData();
    } catch {
      setError("We couldn’t erase your local data. Try again.");
      setDeleting(false);
      return;
    }
    setDeleting(false);
    navigate("/");
  };

  const loadSessions = async () => {
    try {
      setError("");
      const sessions = await sessionStore.list("-created_date", 100);
      setProfile(buildProfile(sessions));
      setLastWorked(pickLastWorked(sessions));
      const since = weekCountCutoff();
      setSessions(sessions);
      setWeekCount(sessions.filter((s) => new Date(s.created_date).getTime() >= since).length);
    } catch {
      setError("We couldn’t load your local profile from this device.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadSessions(); }, []);

  const doLastWorked = () => {
    const s = lastWorked;
    if (!s) return;
    navigate("/reset", {
      state: {
        prebuilt: true,
        pathway: s.pathway,
        direction: s.direction || s.state,
        directionLabel: s.direction_label || s.state_label,
        intensity: s.intensity_start,
        whereFelt: s.where_felt,
        timeMin: s.time_min,
        audio: s.audio,
        movement: s.movement,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background px-5 pt-10">
        <div className="mx-auto max-w-xl animate-pulse space-y-4">
          <div className="h-6 w-24 rounded-full bg-secondary/70" />
          <div className="h-10 w-56 rounded-2xl bg-secondary/70" />
          <div className="h-40 rounded-3xl bg-card" />
          <div className="h-24 rounded-3xl bg-card" />
        </div>
      </div>
    );
  }

  if (!profile || profile.count === 0) {
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
          <button onClick={() => navigate("/")} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="mt-20 text-center">
            <h1 className="font-heading text-3xl font-medium tracking-tight text-primary text-balance">No resets yet</h1>
            <p className="mx-auto mt-3 max-w-sm text-lg text-muted-foreground text-balance">
              Complete a reset or two and your regulation profile will appear here.
            </p>
            <Button onClick={() => navigate("/")} className="mt-8 rounded-full">Back to start</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadSessions}>
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
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
              {weekCount} reset{weekCount === 1 ? "" : "s"} this week · {profile.count} overall
            </p>
          )}
        </motion.div>

        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            <p className="font-heading text-lg font-medium tracking-tight text-foreground">We couldn’t open your profile</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadSessions} className="mt-4 rounded-full">Try again</Button>
          </div>
        )}

        <div className="mt-6">
          <CrisisSupportCard compact body="If you need more than a reset right now, support is always available." />
        </div>

        {/* typical change */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 soft-depth">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-[0.15em]">Typical change</span>
          </div>
          <div className="mt-4 flex items-end justify-center gap-3">
            <span className="font-heading text-5xl font-medium tabular-nums text-primary">{profile.avgStart}</span>
            <span className="mb-2 text-2xl text-muted-foreground">→</span>
            <span className="font-heading text-5xl font-medium tabular-nums text-accent">{profile.avgEnd}</span>
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Across {profile.count} reset{profile.count === 1 ? "" : "s"}, you{" "}
            {profile.change > 0 ? `improved ${profile.change} on average` : "held steady on average"}.
          </p>
        </div>

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

        <ResetHistory sessions={sessions} />

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
              <ToolRow key={t.id} name={t.name} right={`${t.uses}×`} sub={t.avgDrop > 0 ? `avg +${t.avgDrop}` : "—"} />
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

        <div className="mt-10 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <p className="font-heading text-lg font-medium tracking-tight text-foreground">Your data, your control</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Your session history stays on this device. Delete it and your intervention memory at any time.
          </p>
          <div className="mt-4 rounded-2xl border border-destructive/15 bg-white/60 p-4">
            <p className="text-sm font-medium text-foreground">{sessions.length} saved session{sessions.length === 1 ? "" : "s"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lastSessionDate ? `Last saved ${lastSessionDate}.` : "No saved sessions yet."} Export a copy before erasing everything.
            </p>
            <Button variant="outline" onClick={() => downloadLocalAppData("mentation-backup")} className="mt-3 rounded-full">
              <Download className="mr-2 h-4 w-4" /> Export before erasing
            </Button>
          </div>
          {confirming ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="destructive" onClick={deleteAll} disabled={deleting || countdown > 0} className="rounded-full">
                {deleting ? "Deleting…" : countdown > 0 ? `Erase in ${countdown}…` : "Erase my sessions and start fresh"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} className="rounded-full">Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)} className="mt-4 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
              Review before erasing everything
            </Button>
          )}
        </div>

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
