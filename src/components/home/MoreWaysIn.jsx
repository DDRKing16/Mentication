// "More ways in": Journal, The Good Map and Dear 2100, as one compact
// horizontal row instead of three full-width blocks stacked on top of each
// other. Good Map and Dear 2100 show a real screenshot of the journey (the
// same ones used on the Plus paywall) so the card is a genuine glimpse, not
// just another coloured slab; Journal gets its own icon treatment since
// there's nothing to preview — it's a free, everyday tool, not a locked one.
import React from "react";
import { Mic } from "lucide-react";

const ITEMS = [
  {
    id: "journal",
    route: "/journal",
    eyebrow: "Journal",
    title: "Check in with yourself",
    tint: "#38221E",
    accent: "#C29B68",
    icon: Mic,
  },
  {
    id: "goodMap",
    route: "/good-map",
    eyebrow: "The Good Map · 10 min",
    title: "See what makes life feel good",
    tint: "#2A040B",
    accent: "#3EE8AA",
    image: "/media/plus-preview/good-map.jpg",
  },
  {
    id: "dear2100",
    route: "/dear-2100",
    eyebrow: "Dear 2100 · 15 min",
    title: "Go after what you've avoided",
    tint: "#0038A0",
    accent: "#F3B65B",
    image: "/media/plus-preview/dear2100.jpg",
  },
];

export default function MoreWaysIn({ plusActive, onOpen }) {
  return (
    <section className="pt-8">
      <h2 className="px-5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink)]/55">More ways in</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-none px-5 pb-1" role="list">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const locked = item.id !== "journal" && !plusActive;
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              onClick={() => onOpen(item.route)}
              aria-label={item.title}
              className="no-tap relative flex h-[13.5rem] w-[9.5rem] shrink-0 flex-col justify-end overflow-hidden rounded-[24px] text-left shadow-[0_16px_36px_-20px_rgba(0,0,0,0.55)] transition-transform active:scale-[0.97]"
              style={{ background: item.tint }}
            >
              {item.image ? (
                <img src={item.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top opacity-80" />
              ) : (
                <span aria-hidden="true" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10">
                  <Icon className="h-4 w-4" style={{ color: item.accent }} />
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 h-[75%]" style={{ background: `linear-gradient(180deg, transparent, ${item.tint} 78%)` }} />
              {locked && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] text-white backdrop-blur-sm">PLUS</span>
              )}
              <div className="relative z-10 p-3.5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em]" style={{ color: item.accent }}>{item.eyebrow}</p>
                <p className="mt-1 text-[0.92rem] font-semibold leading-snug text-white">{item.title}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { ITEMS as MORE_WAYS_IN_ITEMS };
