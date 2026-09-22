// @ts-check
import React from "react";
import { motion } from "framer-motion";
import CategoryIcon from "@/components/home/CategoryIcons";

// Each mood direction gets its own identity colour so the six options read as
// distinct choices at a glance, not six copies of the same neutral tile.
const ACCENTS = {
  calm: "#4A8B86",
  lift: "#D98F4E",
  ground: "#6B8E4E",
  sleep: "#5B5A8C",
  focus: "#B5623D",
  guide: "#9B7A94",
};

export default function CategoryCard({ card, index = 0, onClick }) {
  const accent = ACCENTS[card.tint] || "var(--home-accent)";
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      data-sfx="select"
      style={/** @type {any} */ ({ "--card-accent": accent })}
      className={
        "relative no-tap flex min-h-[11.25rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[1.6rem] px-4 py-5 text-center " +
        "home-category-card bg-[var(--home-card)] " +
        "transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98]"
      }
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-[0.16] blur-xl"
        style={{ background: "var(--card-accent)" }}
      />
      <span className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full text-[var(--card-accent)] ring-[1.5px] ring-[var(--card-accent)]">
        <CategoryIcon id={card.tint} className="h-11 w-11" />
      </span>
      <span className="relative mt-1 font-heading text-[1.2rem] font-semibold leading-tight text-[var(--home-ink)]">{card.label}</span>
      <span className="relative text-[0.9rem] leading-snug text-[var(--home-muted)]">{card.sub}</span>
    </motion.button>
  );
}
