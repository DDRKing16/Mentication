// @ts-check
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import CategoryIcon from "@/components/home/CategoryIcons";
import { hapticPattern } from "@/lib/feedback";

// Each mood direction gets its own identity colour so the six options read as
// distinct choices at a glance, not six copies of the same neutral tile. The
// colours come from the active Home theme (--cat-* in app-surfaces.css), so a
// palette change recolours the cards along with everything else.
const ACCENTS = {
  calm: "var(--cat-calm)",
  lift: "var(--cat-lift)",
  ground: "var(--cat-ground)",
  sleep: "var(--cat-sleep)",
  focus: "var(--cat-focus)",
  guide: "var(--cat-guide)",
};

export default function CategoryCard({ card, index = 0, onClick, recent }) {
  const accent = ACCENTS[card.tint] || "var(--home-accent)";
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [flash, setFlash] = useState(false);
  const [pressed, setPressed] = useState(false);
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    const px = (point.clientX - rect.left) / rect.width - 0.5;
    const py = (point.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 6 });
  };
  const resetTilt = () => { setTilt({ x: 0, y: 0 }); setPressed(false); };

  const handleClick = () => {
    hapticPattern([6]);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 320);
    onClick();
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleClick}
      onPointerDown={(e) => { setPressed(true); handleMove(e); }}
      onPointerMove={(e) => e.buttons === 1 && handleMove(e)}
      onPointerUp={resetTilt}
      onPointerLeave={resetTilt}
      data-sfx="select"
      data-pressed={pressed}
      data-variant={index % 2 === 1 ? "alt" : "main"}
      data-tint={card.tint}
      style={/** @type {any} */ ({
        "--card-accent": accent,
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${pressed ? 6 : 0}px)`,
      })}
      className={
        "relative no-tap flex min-h-[11.25rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[1.6rem] px-4 py-5 text-center " +
        "home-category-card " +
        "transition-transform duration-150 active:scale-[0.98]"
      }
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-[0.16] blur-xl"
        style={{ background: "var(--cat-glow, var(--card-accent))" }}
      />
      {/* Glossy top-half reflection plus a thin diagonal light streak, so the
          tile reads as a shiny, physical key. */}
      <span aria-hidden="true" className="home-cat-sheen pointer-events-none absolute inset-x-1.5 top-1.5 h-[48%] rounded-t-[1.35rem] rounded-b-[50%]" style={{ opacity: "var(--cat-gloss, 1)", background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.22) 55%, rgba(255,255,255,0) 100%)" }} />
      <span aria-hidden="true" className="home-cat-sheen pointer-events-none absolute -left-[15%] -top-[10%] h-[130%] w-[28%] rotate-[22deg]" style={{ opacity: "calc(0.3 * var(--cat-gloss, 1))", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 50%, transparent)" }} />
      <span aria-hidden="true" className="home-cat-sheen pointer-events-none absolute left-4 top-3 h-3 w-8 rotate-[-12deg] rounded-full bg-white blur-[3px]" style={{ opacity: "calc(0.5 * var(--cat-gloss, 1))" }} />
      {/* A soft felt finish: fine fibre grain over the whole tile. */}
      <span aria-hidden="true" className="home-felt pointer-events-none absolute inset-0 rounded-[1.6rem]" />
      {/* A quick colour flash on tap, so the choice feels confirmed the
          instant before the page changes, not just an abrupt cut. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[1.6rem] transition-opacity duration-300" style={{ background: "var(--card-accent)", opacity: flash ? 0.16 : 0 }} />

      {recent && (
        <span aria-hidden="true" className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ background: "var(--cat-glow, var(--card-accent))" }} />
      )}

      <span
        className={`home-cat-icon relative flex h-[76px] w-[76px] items-center justify-center rounded-full text-[var(--cat-symbol,var(--card-accent))] ring-[1.5px] ${card.unsure ? "ring-dashed" : ""} ring-[var(--cat-symbol,var(--card-accent))]`}
      >
        <motion.span whileTap={{ scale: 0.88, rotate: -6 }} className="home-cat-glyph relative flex h-11 w-11 items-center justify-center">
          <CategoryIcon id={card.tint} className="home-cat-glyph h-11 w-11" />
        </motion.span>
      </span>
      <span className="home-cat-label relative mt-1 font-heading text-[1.2rem] font-semibold leading-tight text-[var(--cat-title,var(--home-ink))]">{card.label}</span>
      <span className="home-cat-sub relative text-[0.9rem] font-medium leading-snug text-[var(--cat-sub,var(--home-muted))] [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">{card.sub}</span>
    </motion.button>
  );
}
