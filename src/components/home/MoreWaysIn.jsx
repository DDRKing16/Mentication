// "More ways in": Journal, The Good Map and Dear 2100, as one compact
// horizontal row instead of three full-width blocks stacked on top of each
// other. Each card shows a real screenshot of the journey (Good Map and Dear
// 2100 use the same ones as the Plus paywall; Journal shows its end-of-entry
// day summary) so the card is a genuine glimpse, not a coloured slab.
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { hasJourneyAccess } from "@/lib/accessPolicy";
import { Mic } from "lucide-react";
import { hapticPattern } from "@/lib/feedback";

const ITEMS = [
  {
    id: "journal",
    route: "/journal",
    eyebrow: "Journal",
    title: "Check in with yourself",
    tint: "#2E4753",
    accent: "#E6C9A0",
    icon: Mic,
    image: "/media/plus-preview/journal.jpg",
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

// A quiet, on-device-only read of the last journal entry's date, purely for
// a "last entry 2 days ago" line — never anything about what was written.
function daysSinceLastEntry() {
  try {
    const daybook = JSON.parse(localStorage.getItem("daybook") || "[]");
    const latest = daybook?.[0]?.date;
    if (!latest) return null;
    const then = new Date(latest);
    if (Number.isNaN(then.getTime())) return null;
    const days = Math.floor((Date.now() - then.getTime()) / 864e5);
    return days;
  } catch {
    return null;
  }
}

function journalCaption() {
  const days = daysSinceLastEntry();
  if (days == null) return null;
  if (days <= 0) return "Entry saved today";
  if (days === 1) return "Last entry yesterday";
  return `Last entry ${days} days ago`;
}

export default function MoreWaysIn({ plusActive, onOpen }) {
  const [caption] = useState(journalCaption);
  const rowRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pressed, setPressed] = useState(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    let frame = null;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const cardWidth = row.firstElementChild?.getBoundingClientRect().width || 1;
        setActiveIndex(Math.round(row.scrollLeft / (cardWidth + 12)));
      });
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => { row.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return (
    <section className="home-more-section pt-8">
      <h2 className="px-5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink)]/55">More ways in</h2>
      <div className="relative mt-3">
        <div ref={rowRef} className="home-more-row flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-5 pb-1" role="list" style={{ maskImage: "linear-gradient(90deg, black 88%, transparent 100%)", WebkitMaskImage: "linear-gradient(90deg, black 88%, transparent 100%)" }}>
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const locked = item.id !== "journal" && !hasJourneyAccess({ active: plusActive });
            return (
              <button
                key={item.id}
                type="button"
                role="listitem"
                onClick={() => onOpen(item.route)}
                onPointerDown={() => { setPressed(item.id); hapticPattern([6]); }}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                aria-label={item.title}
                className="home-more-card no-tap relative flex h-[15rem] w-[9.5rem] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[24px] text-left shadow-[0_16px_36px_-20px_rgba(0,0,0,0.55)] transition-transform duration-150"
                style={{ background: item.tint, transform: pressed === item.id ? "scale(0.97) rotate(-0.4deg)" : "scale(1)" }}
              >
                {item.image ? (
                  <img src={item.image} alt="" aria-hidden="true" className="home-more-shot absolute inset-0 h-full w-full object-cover object-top opacity-80" />
                ) : (
                  <>
                    {/* A faint ruled-paper texture instead of a flat block,
                        since there's no real screenshot to show for Journal. */}
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `repeating-linear-gradient(180deg, ${item.accent} 0, ${item.accent} 1px, transparent 1px, transparent 22px)` }} />
                    <span aria-hidden="true" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10">
                      <Icon className="h-4 w-4" style={{ color: item.accent }} />
                    </span>
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 h-[75%]" style={{ background: `linear-gradient(180deg, transparent, ${item.tint} 78%)` }} />
                {locked && (
                  <span className="absolute right-2.5 top-2.5 overflow-hidden rounded-full bg-black/45 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] text-white backdrop-blur-sm">
                    <span className="relative z-10">PLUS</span>
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-4 bg-white/40"
                      style={{ filter: "blur(3px)" }}
                      animate={{ left: ["-20%", "140%"] }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
                    />
                  </span>
                )}
                <div className="home-more-text relative z-10 p-3.5">
                  <p className="home-more-eyebrow text-[0.6rem] font-semibold uppercase tracking-[0.16em]" style={{ color: item.accent }}>{item.eyebrow}</p>
                  <p className="home-more-title mt-1 text-[0.92rem] font-semibold leading-snug text-white">{item.title}</p>
                  {item.id === "journal" && caption && <p className="home-more-caption mt-1 text-[0.68rem] text-white/75">{caption}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
        {ITEMS.map((item, i) => (
          <span key={item.id} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-4 bg-[var(--home-ink)]/45" : "w-1.5 bg-[var(--home-ink)]/15"}`} />
        ))}
      </div>
    </section>
  );
}

export { ITEMS as MORE_WAYS_IN_ITEMS };
