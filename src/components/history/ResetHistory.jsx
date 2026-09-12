import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { History, TrendingDown } from "lucide-react";

// A clean, simple history view: a line chart of activation level (0–10)
// before and after each reset, followed by a chronological list of past
// resets. Pure presentational — receives the already-loaded sessions.
const START_COLOR = "#0D4D44"; // teal — before
const END_COLOR = "#C5A064";   // gold — after

function fmtDuration(sec) {
  if (sec == null) return "";
  if (sec >= 60) return `${Math.round(sec / 60)} min`;
  return `${sec}s`;
}

export default function ResetHistory({ sessions }) {
  // Sessions arrive newest-first; chart + list read oldest-first.
  const chrono = useMemo(() => [...(sessions || [])].reverse(), [sessions]);

  const chartData = useMemo(
    () =>
      chrono
        .filter((s) => s.intensity_start != null)
        .map((s) => ({
          date: format(new Date(s.created_date), "d MMM"),
          start: s.intensity_start,
          end: s.intensity_end ?? null,
        })),
    [chrono]
  );

  const items = useMemo(
    () =>
      chrono.map((s) => ({
        id: s.id,
        date: format(new Date(s.created_date), "EEE d MMM · h:mm a"),
        label: s.direction_label || s.state_label || "Reset",
        start: s.intensity_start,
        end: s.intensity_end,
        duration: fmtDuration(s.duration_sec),
      })),
    [chrono]
  );

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <History className="h-4 w-4" />
        <span className="text-sm font-medium uppercase tracking-[0.15em]">Reset history</span>
      </div>

      {chartData.length > 1 && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-4 soft-depth">
          <p className="text-xs text-muted-foreground">Activation level (0–10) — before → after each reset</p>
          <div className="mt-3 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="start" name="Before" stroke={START_COLOR} strokeWidth={2} dot={{ r: 3, fill: START_COLOR }} />
                <Line type="monotone" dataKey="end" name="After" stroke={END_COLOR} strokeWidth={2} dot={{ r: 3, fill: END_COLOR }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: START_COLOR }} />Before</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: END_COLOR }} />After</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {items.map((it) => {
          const drop = it.start != null && it.end != null ? it.start - it.end : null;
          return (
            <div key={it.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{it.label}</p>
                <p className="text-xs text-muted-foreground">{it.date}{it.duration ? ` · ${it.duration}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="tabular-nums text-primary">{it.start ?? "—"}</span>
                <span className="text-muted-foreground">→</span>
                <span className="tabular-nums text-accent">{it.end ?? "—"}</span>
                {drop != null && drop > 0 && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <TrendingDown className="h-3 w-3" />{drop}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}