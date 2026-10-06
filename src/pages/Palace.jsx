import {useAppBack} from '@/hooks/useAppBack';
// The Peace Palace page: a place that grows as you use interventions and
// grows again each time you finish one all the way through. Growth is
// derived live from session history (src/lib/peacePalace.js).
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { sessionStore } from "@/lib/localData";
import { derivePeacePalace } from "@/lib/peacePalace";
import PeacePalace from "@/components/palace/PeacePalace";

export default function Palace() {
  const navigate = useNavigate();
  const goBack=useAppBack();
  const [palace, setPalace] = useState(null);

  useEffect(() => {
    let alive = true;
    sessionStore.list("-created_date", 500).then((sessions) => {
      if (alive) setPalace(derivePeacePalace(sessions));
    }).catch(() => {
      if (alive) setPalace(derivePeacePalace([]));
    });
    return () => { alive = false; };
  }, []);

  const level = palace?.level ?? 0;
  const stage = palace?.stage;

  return (
    <div className="calmbg min-h-full">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
        <button onClick={goBack} className="no-tap flex min-h-11 items-center gap-1 self-start rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">A place that grows as you practice</p>
          <h1 className="mt-3 font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
            Your Peace Palace
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 overflow-hidden rounded-3xl border border-border soft-depth"
        >
          <PeacePalace level={level} className="block h-auto w-full" />
        </motion.div>

        {palace && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Level {level + 1} of 7</p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-xl font-medium tracking-tight text-primary">{stage.name}</h2>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {palace.growth} stone{palace.growth === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.blurb}</p>

            {palace.next && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Next: {palace.next.name}</span>
                  <span className="tabular-nums">{palace.stonesToNext} stone{palace.stonesToNext === 1 ? "" : "s"} to go</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/60">
                  <motion.div
                    className="h-full rounded-full bg-teal"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((palace.growth / palace.next.at) * 100)}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {palace && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 soft-depth">
            <h2 className="font-heading text-lg font-medium tracking-tight text-primary">How the palace grows</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Using an intervention plants a stone in the grounds.</li>
              <li>Finishing one all the way through lays the palace itself — two stones at a time.</li>
            </ul>
            {palace.builders.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Built with</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {palace.builders.map((b) => (
                    <span key={b.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {b.name}{b.count > 1 ? ` ×${b.count}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Nothing is built yet. Complete a reset and the first stones appear.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
