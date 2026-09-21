import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, X, ArrowRight, LockKeyhole } from "lucide-react";
import { INTERVENTIONS } from "@/lib/interventions";

const CATEGORY_ORDER = ["calm", "lift", "ground", "focus", "sleep"];
const CATEGORY_LABELS = {
  calm: "Calm",
  lift: "Lift",
  ground: "Ground",
  focus: "Focus",
  sleep: "Sleep",
};
const CATEGORY_SHORT = {
  calm: "Calm",
  lift: "Lift",
  ground: "Ground",
  focus: "Focus",
  sleep: "Sleep",
};

// User-friendly filters mapped to existing intervention metadata.
const FILTERS = [
  { key: "quick", label: "Quick (≤3 min)", test: (iv) => iv.durationMin <= 3 },
  { key: "discreet", label: "Discreet", test: (iv) => iv.discreet },
  { key: "eyesOpen", label: "Eyes open", test: (iv) => iv.eyes === "open" },
  { key: "sleep", label: "Sleep-friendly", test: (iv) => iv.bedtime },
  { key: "noBreathing", label: "No breathing", test: (iv) => iv.category !== "breathing" },
];

function Badges({ iv }) {
  const tags = [];
  if (iv.discreet) tags.push("Discreet");
  if (iv.eyes === "open") tags.push("Eyes open");
  if (iv.bedtime) tags.push("Sleep");
  if (!tags.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground">
          {t}
        </span>
      ))}
    </div>
  );
}

export default function InterventionLibrary() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(null);
  const [filters, setFilters] = useState({});

  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    const activeFilters = FILTERS.filter((f) => filters[f.key]);
    let list = INTERVENTIONS.filter((iv) => {
      if (cat && iv.primaryDirection !== cat) return false;
      if (activeFilters.length && !activeFilters.every((f) => f.test(iv))) return false;
      if (!term) return true;
      return iv.name.toLowerCase().includes(term) || (iv.why || "").toLowerCase().includes(term);
    });
    const map = {};
    list.forEach((iv) => { (map[iv.primaryDirection] = map[iv.primaryDirection] || []).push(iv); });
    return CATEGORY_ORDER.filter((c) => map[c]?.length).map((c) => ({ category: c, items: map[c] }));
  }, [q, cat, filters]);

  const launch = (iv) => {
    navigate("/reset", {
      state: {
        prebuilt: true,
        pathway: [iv.id],
        direction: iv.primaryDirection || iv.directions?.[0] || "calm",
        directionLabel: iv.name,
        intensity: 5,
        whereFelt: iv.targets?.includes("body") ? "body" : "thoughts",
        timeMin: iv.durationMin,
        audio: "yes",
      },
    });
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 pt-10 pb-24 sm:px-8 safe-top-lg">
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="no-tap flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.7} />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-medium tracking-tight">Intervention Library</h1>
            <p className="text-sm text-muted-foreground">Pick any practice. {INTERVENTIONS.length} in total.</p>
          </div>
        </header>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search practices…"
            aria-label="Search practices"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear"
              className="no-tap absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* category navigation */}
        <div className="mt-4 -mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Practice categories">
          <div className="flex gap-2">
            <button
              onClick={() => setCat(null)}
              className={
                "no-tap min-h-11 shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95 " +
                (cat === null
                  ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground")
              }
            >
              All
            </button>
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => setCat(cat === c ? null : c)}
                className={
                  "no-tap min-h-11 shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95 " +
                  (cat === c
                    ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground")
                }
              >
                {CATEGORY_SHORT[c]}
              </button>
            ))}
          </div>
        </div>

        {/* filters */}
        <div className="mt-2.5 -mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Practice filters">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                aria-pressed={!!filters[f.key]}
                className={
                  "no-tap min-h-11 shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95 " +
                  (filters[f.key]
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-10">
          <section aria-labelledby="signal-lock-heading">
            <h2 id="signal-lock-heading" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Focus session
            </h2>
            <button
              type="button"
              onClick={() => navigate("/signal-lock")}
              className="no-tap group mt-3 flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-[0_12px_36px_-20px_hsl(179_69%_17%/0.22)] active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-heading text-base font-medium tracking-tight text-foreground">Signal Lock</span>
                  <span className="text-xs text-muted-foreground">· Focus</span>
                </span>
                <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                  A visual focus session with a task plan, timer, and reward.
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </section>
          {grouped.map((g) => (
            <section key={g.category}>
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {CATEGORY_LABELS[g.category] || g.category} · {g.items.length}
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {g.items.map((iv) => (
                  <button
                    key={iv.id}
                    onClick={() => launch(iv)}
                    className="no-tap group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-[0_12px_36px_-20px_hsl(179_69%_17%/0.22)] active:scale-[0.99]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-base font-medium tracking-tight text-foreground">{iv.name}</span>
                        <span className="text-xs text-muted-foreground">· {iv.durationMin} min</span>
                      </div>
                      <p className="mt-1 text-sm leading-snug text-muted-foreground line-clamp-2">{iv.why}</p>
                      <Badges iv={iv} />
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!grouped.length && (
            <p className="py-12 text-center text-sm text-muted-foreground">No practices match. Try clearing a filter.</p>
          )}
        </div>
      </div>
    </div>
  );
}
