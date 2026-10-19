// "Here's what's helping you": turns the sessions saved on the device into a
// short, plain-English story. Uses only the person's own before/after
// check-ins, and says so; it is never presented as a clinical measure.
import { getIntervention } from "@/lib/interventions";

const DAY = 86400000;

export { ratedShift, finishedPracticeIds } from "./sessionEvidence.js";
import { ratedShift, finishedPracticeIds } from "./sessionEvidence.js";

const slotFor = (date) => {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "in the morning";
  if (h >= 12 && h < 17) return "in the afternoon";
  if (h >= 17 && h < 22) return "in the evening";
  return "late at night";
};

const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const round1 = (n) => Math.round(n * 10) / 10;
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function summariseProgress(sessions = [], now = new Date()) {
  const dated = sessions
    .filter(s => finishedPracticeIds(s).length > 0 || s.attempts?.some(a => a.exit_reason !== "skipped" && a.completed_percentage > 0))
    .map((s) => ({ s, at: new Date(s?.created_date) }))
    .filter(({ at }) => !Number.isNaN(at.getTime()));

  const recent = dated.filter(({ at }) => now - at <= 30 * DAY);
  const recentShifts = recent.map(({ s }) => ratedShift(s)).filter((v) => v != null);
  const avgShift = recentShifts.length >= 3 ? round1(average(recentShifts)) : null;

  // What helps: credit each exercise finished in a rated session.
  const byExercise = new Map();
  for (const { s } of dated) {
    const ids = finishedPracticeIds(s);
    const shift = ratedShift(s);
    for (const id of new Set(ids)) {
      const entry = byExercise.get(id) || { id, uses: 0, shifts: [] };
      entry.uses += 1;
      if (shift != null) entry.shifts.push(shift);
      byExercise.set(id, entry);
    }
  }
  const helpers = [...byExercise.values()]
    .map((e) => ({ id: e.id, name: getIntervention(e.id)?.name || null, uses: e.uses, avgShift: e.shifts.length >= 2 ? round1(average(e.shifts)) : null }))
    .filter((e) => e.name)
    .sort((a, b) => (b.avgShift ?? -99) - (a.avgShift ?? -99) || b.uses - a.uses)
    .slice(0, 3);

  // Rhythm: practices per week, last 6 weeks, oldest first.
  const startOfWeek = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const thisWeek = startOfWeek(now);
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const from = new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate() - 7 * (5 - i));
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    return { label: i === 5 ? "This week" : from.toLocaleDateString(undefined, { day: "numeric", month: "short" }), count: dated.filter(({ at }) => at >= from && at < to).length };
  });

  // Best time of day, only once there's enough to say something honest.
  const bySlot = new Map();
  for (const { s, at } of dated) {
    const shift = ratedShift(s);
    if (shift == null) continue;
    const slot = slotFor(at);
    bySlot.set(slot, [...(bySlot.get(slot) || []), shift]);
  }
  const slots = [...bySlot.entries()].filter(([, v]) => v.length >= 2).map(([slot, v]) => ({ slot, avgShift: round1(average(v)) }));
  slots.sort((a, b) => b.avgShift - a.avgShift);
  const ratedTotal = [...bySlot.values()].reduce((n, v) => n + v.length, 0);
  const bestTime = ratedTotal >= 4 && slots.length >= 2 && slots[0].avgShift > slots[slots.length - 1].avgShift ? slots[0] : null;

  return {
    total: dated.length,
    last30: { count: recent.length, days: new Set(recent.map(({ at }) => dayKey(at))).size },
    avgShift,
    helpers,
    weeks,
    bestTime,
  };
}
