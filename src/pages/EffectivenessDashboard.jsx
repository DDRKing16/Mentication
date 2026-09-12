import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Zap, MapPin, Loader, Sparkles } from "lucide-react";
import { sessionStore } from "@/lib/localData";
import { buildMomentumSummary, computeEffectivenessInsights } from "@/lib/insights";
import CrisisSupportCard from "@/components/CrisisSupportCard";
import PremiumPageHeader from "@/components/PremiumPageHeader";
import PullToRefresh from "@/components/PullToRefresh";

export default function EffectivenessDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = useCallback(async () => {
    try {
      setError("");
      const sessions = await sessionStore.list("-created_date", 100);
      const computed = computeEffectivenessInsights(sessions);
      setInsights({ ...computed, momentum: buildMomentumSummary(sessions) });
    } catch {
      setError("We couldn’t load your local insights just now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background px-5 pt-6 pb-28">
        <div className="mx-auto max-w-xl animate-pulse space-y-4">
          <div className="h-11 w-24 rounded-full bg-card" />
          <div className="h-10 w-56 rounded-2xl bg-card" />
          <div className="h-32 rounded-3xl bg-card" />
          <div className="h-24 rounded-3xl bg-card" />
          <div className="h-24 rounded-3xl bg-card" />
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto max-w-xl px-5 pt-6 pb-28">
          <PremiumPageHeader
            eyebrow="Local patterns"
            title="Your Patterns"
            body="A private coaching view built from your saved resets on this device."
            trustItems={["Private on this device", "Updates locally", "No cloud profile"]}
          />
          <div className="mt-10 rounded-3xl border border-destructive/20 bg-card p-6 text-center">
            <Loader className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 font-heading text-3xl font-medium text-primary">Insights are unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error || "Try again in a moment."}</p>
            <button onClick={loadInsights} className="no-tap mt-5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground active:scale-95">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topDirection = insights.directionStats[0];
  const topIntervention = insights.topInterventions[0];

  return (
    <PullToRefresh onRefresh={loadInsights}>
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto max-w-xl px-5 pt-6 pb-28">
          <PremiumPageHeader
            eyebrow="Local patterns"
            title="Your Patterns"
            body={`A private coaching view built from ${insights.totalSessions} saved reset${insights.totalSessions === 1 ? "" : "s"} on this device.`}
            trustItems={["Private on this device", "Updates locally", "No cloud profile"]}
          />

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8 mt-8">
            <p className="text-sm text-muted-foreground">
              {insights.thisWeek} this week
            </p>
          </motion.div>

        {insights.totalSessions > 0 ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-primary/10 bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Coaching view
            </p>
            <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight text-primary">
              {topDirection ? `${topDirection.direction[0].toUpperCase()}${topDirection.direction.slice(1)} is helping most lately.` : "Your patterns are taking shape."}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {topIntervention
                ? `${topIntervention.name} is your strongest current practice.`
                : "Keep completing resets and the app will learn what helps you most."}{" "}
              {insights.momentum?.sessionsToGoal > 0
                ? `${insights.momentum.sessionsToGoal} more session${insights.momentum.sessionsToGoal === 1 ? "" : "s"} will complete this week’s rhythm.`
                : "You’ve already hit your weekly rhythm."}
            </p>
          </motion.div>
        ) : (
          <div className="mb-8 rounded-3xl border border-border bg-card p-6 text-center">
            <h2 className="font-heading text-2xl font-medium text-primary">Your insights start after your first few resets</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Complete a couple of sessions and Mentication will begin to highlight what helps you settle, focus, lift, or sleep.
            </p>
          </div>
        )}

        <div className="mb-8">
          <CrisisSupportCard compact body="If your patterns suggest you need more than a reset today, support is always available." />
        </div>

        {/* Top Interventions */}
        {insights.topInterventions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="font-heading text-lg font-medium text-primary">Most Effective</h2>
            </div>
            <div className="space-y-2">
              {insights.topInterventions.map((iv, idx) => (
                <div
                  key={iv.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{iv.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(iv.score * 100).toFixed(0)}% effectiveness
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo to-violet"
                        style={{ width: `${iv.score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Direction Insights */}
        {insights.directionStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="font-heading text-lg font-medium text-primary">By Direction</h2>
            </div>
            <div className="space-y-3">
              {insights.directionStats.map((dir) => (
                <div
                  key={dir.direction}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground capitalize">{dir.direction}</p>
                      <p className="text-xs text-muted-foreground">{dir.count} sessions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">↓ {dir.avgImprovement}</p>
                      <p className="text-xs text-muted-foreground">avg improvement</p>
                    </div>
                  </div>
                  {dir.bestIntervention && (
                    <p className="text-xs text-muted-foreground">
                      Works best: <span className="text-foreground font-medium">{dir.bestIntervention.name}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Location Insights */}
        {insights.locationStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h2 className="font-heading text-lg font-medium text-primary">By Location</h2>
            </div>
            <div className="space-y-2">
              {insights.locationStats.map((loc) => (
                <div
                  key={loc.location}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <p className="font-medium text-foreground capitalize">{loc.location}</p>
                    <p className="text-xs text-muted-foreground">{loc.count} sessions • ↓ {loc.avgImprovement}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Context Patterns */}
        {insights.contextPatterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="font-heading text-lg font-medium text-primary mb-4">Situation Patterns</h2>
            <div className="space-y-2 text-sm">
              {insights.contextPatterns.map((pattern, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-3">
                  <p className="font-medium text-foreground mb-1">
                    When {pattern.direction} at {pattern.location}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Intensity {pattern.intensity} • {pattern.where}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground font-medium">{pattern.intervention}</p>
                    <div className="text-xs font-semibold text-indigo-600">
                      {(pattern.score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        </div>
      </div>
    </PullToRefresh>
  );
}
