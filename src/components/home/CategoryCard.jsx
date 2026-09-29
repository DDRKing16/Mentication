// @ts-check
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import CategoryIcon from "@/components/home/CategoryIcons";
import { hapticPattern } from "@/lib/feedback";

// Each mood direction gets its own identity colour so the six options read as
// distinct choices at a glance, not six copies of the same neutral tile.
const ACCENTS = {
  calm: "#3E8B85",
  lift: "#D9832E",
  ground: "#5C8A3A",
  sleep: "#514F8C",
  focus: "#B24F2C",
  guide: "#8F6789",
};

// A faint, tint-coloured dot grid per card, distinct enough to tell the six
// apart up close without competing with the icon or the text.
const dotTexture = (colour) =>
  `radial-gradient(circle, ${colour} 1px, transparent 1.4px)`;

export default function CategoryCard({ card, index = 0, onClick, recent }) {
  const accent = ACCENTS[card.tint] || "var(--home-accent)";
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [flash, setFlash] = useState(false);
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
  const resetTilt = () => setTilt({ x: 0, y: 0 });

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
      onPointerDown={handleMove}
      onPointerMove={(e) => e.buttons === 1 && handleMove(e)}
      onPointerUp={resetTilt}
      onPointerLeave={resetTilt}
      data-sfx="select"
      style={/** @type {any} */ ({
        "--card-accent": accent,
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      })}
      className={
        "relative no-tap flex min-h-[11.25rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[24px] px-4 py-5 text-center " +
        "home-category-card bg-[var(--home-card)] " +
        "transition-transform duration-150 active:scale-[0.98]"
      }
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: dotTexture(accent), backgroundSize: "13px 13px" }} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-[0.18] blur-xl"
        style={{ background: "var(--card-accent)" }}
      />
      {/* A quick colour flash on tap, so the choice feels confirmed the
          instant before the page changes, not just an abrupt cut. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[24px] transition-opacity duration-300" style={{ background: "var(--card-accent)", opacity: flash ? 0.16 : 0 }} />

      {recent && (
        <span aria-hidden="true" className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ background: accent }} />
      )}

      <span
        className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-full text-[var(--card-accent)] ${card.unsure ? "ring-[1.5px] ring-dashed" : "ring-2"} ring-[var(--card-accent)]`}
        style={{ background: "radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--card-accent) 20%, white), color-mix(in srgb, var(--card-accent) 6%, white) 70%)" }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -inset-2 rounded-full opacity-25 blur-md" style={{ background: "var(--card-accent)" }} />
        <span aria-hidden="true" className="absolute inset-0 rounded-full opacity-70" style={{ background: "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.85), transparent 50%)" }} />
        <motion.span whileTap={{ scale: 0.88, rotate: -6 }} className="relative flex h-11 w-11 items-center justify-center">
          <CategoryIcon id={card.tint} className="h-11 w-11" />
        </motion.span>
      </span>
      <span className="relative mt-1 font-heading text-[1.2rem] font-semibold leading-tight text-[var(--home-ink)]">{card.label}</span>
      <span className="relative text-[0.9rem] leading-snug" style={{ color: "color-mix(in srgb, var(--home-muted) 78%, var(--home-ink) 22%)" }}>{card.sub}</span>
    </motion.button>
  );
}
