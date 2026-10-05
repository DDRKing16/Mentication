// Restructure — the category for the longer journeys that rework the patterns
// underneath: Foundations, Dear 2100 and The Good Map. Opened from the thin
// "Restructure" bar under the six buttons on Home.
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import { hapticPattern } from "@/lib/feedback";
import { usePlus } from "@/lib/subscription";
import { HOME_THEME } from "@/lib/homeTheme";
import { MORE_WAYS_IN_ITEMS } from "@/components/home/MoreWaysIn";

const byId = (id) => MORE_WAYS_IN_ITEMS.find((item) => item.id === id);

// Foundations is free; Dear 2100 and The Good Map are part of Plus, the same
// as on Home's "More ways in" row.
export const RESTRUCTURE_ITEMS = [
  {
    id: "foundations",
    route: "/foundations",
    eyebrow: "Foundations · weekly plan",
    title: "Find the one foundation to strengthen this week",
    tint: "#06142A",
    accent: "#7FE3D6",
    image: "/media/plus-preview/foundations.jpg",
    plus: false,
  },
  { ...byId("dear2100"), title: "Go after what you've avoided", plus: true },
  { ...byId("goodMap"), title: "See what makes life feel good", plus: true },
];

export default function Restructure() {
  const navigate = useNavigate();
  const plus = usePlus();
  return (
    <div className={`home-theme home-theme--${HOME_THEME} relative isolate min-h-full bg-[var(--home-bg)] text-[var(--home-ink)]`}>
      <div aria-hidden="true" className="home-page-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img src="/media/brand/sunset-sky.svg" alt="" draggable={false} className="home-page-art absolute inset-0 h-full w-full select-none object-cover object-right-top" />
        <span className="home-page-haze absolute inset-0" />
        <span className="home-felt home-page-grain absolute inset-0" />
      </div>
      <main className="mx-auto max-w-[36rem] px-5 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="no-tap flex min-h-11 items-center gap-1.5 rounded-full text-sm font-medium text-[var(--home-ink)]/80"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full ring-[1.5px] ring-[var(--home-ink)]/55">
            <Layers className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div>
            <h1 className="font-heading text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Restructure</h1>
            <p className="text-[0.9rem] text-[var(--home-muted)]">Rework the patterns underneath.</p>
          </div>
        </div>
        <ul className="mt-6 space-y-4">
          {RESTRUCTURE_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => { hapticPattern([6]); navigate(item.route); }}
                aria-label={item.title}
                className="no-tap relative flex h-[10.5rem] w-full flex-col justify-end overflow-hidden rounded-[24px] text-left shadow-[0_16px_36px_-20px_rgba(0,0,0,0.55)] transition-transform duration-150 active:scale-[0.985]"
                style={{ background: item.tint }}
              >
                {item.image && (
                  <img src={item.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top opacity-80" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-[80%]" style={{ background: `linear-gradient(180deg, transparent, ${item.tint} 82%)` }} />
                {item.plus && !plus.hasAccess && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] text-white backdrop-blur-sm">PLUS</span>
                )}
                <div className="relative z-10 p-4">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em]" style={{ color: item.accent }}>{item.eyebrow}</p>
                  <p className="mt-1 text-[1.05rem] font-semibold leading-snug text-white">{item.title}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
