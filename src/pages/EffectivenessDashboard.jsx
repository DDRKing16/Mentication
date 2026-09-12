import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Zap, MapPin, Loader } from "lucide-react";
import { sessionStore } from "@/lib/localData";
import { computeEffectivenessInsights } from "@/lib/insights";
import FlowHomeButton from "@/components/FlowHomeButton";

export default function EffectivenessDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const sessions = await sessionStore.list("-created_date", 100);
        const computed = computeEffectivenessInsights(sessions);
        setInsights(computed);
      } catch (e) {
        console.error("Failed to load insights:", e);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, []);

  if (loading || !insights) {
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <div className="mx-auto max-w-xl px-5 pt-6 pb-28">
        <div className="flex justify-start mb-6">
          <FlowHomeButton />
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl font-medium text-primary mb-2">
            Your Patterns
          </h1>
          <p className="text-sm text-muted-foreground">
            Based on what you chose and rated in {insights.totalSessions} sessions • {insights.thisWeek} this week
          </p>
        </motion.div>

        {insights.topInterventions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="font-heading text-lg font-medium text-primary">Most often useful</h2>
            </div>
            <div className="space-y-2">
              {insights.topInterventions.map((iv) => (
                <div
                  key={iv.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{iv.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Relative fit {(iv.score * 100).toFixed(0)} — from your ratings, not a clinical score
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
                      <p className="text-xs text-muted-foreground">avg rated shift</p>
                    </div>
                  </div>
                  {dir.bestIntervention && (
                    <p className="text-xs text-muted-foreground">
                      You used most here: <span className="text-foreground font-medium">{dir.bestIntervention.name}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

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

        {insights.totalSessions === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              Complete a few sessions to see your personal patterns emerge.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
