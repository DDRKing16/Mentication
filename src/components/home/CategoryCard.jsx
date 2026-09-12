// @ts-check
import React from "react";
import { motion } from "framer-motion";
import CategoryIcon from "@/components/home/CategoryIcons";

const TINTS = {
  calm: "bg-[var(--home-card)]",
  lift: "bg-[var(--home-card-alt)]",
  ground: "bg-[var(--home-card-alt)]",
  sleep: "bg-[var(--home-card)]",
  focus: "bg-[var(--home-card)]",
  guide: "bg-[var(--home-card-alt)]",
};

export default function CategoryCard({ card, index = 0, onClick }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      data-sfx="select"
      className={
        "no-tap flex min-h-[11.25rem] flex-col items-center justify-center gap-2.5 rounded-[1.6rem] px-4 py-5 text-center " +
        "home-category-card " +
        " transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98] " +
        TINTS[card.tint]
      }
    >
      <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full text-[var(--home-icon)] ring-1 ring-[var(--home-accent)]">
        <CategoryIcon id={card.tint} className="h-11 w-11" />
      </span>
      <span className="mt-1 font-heading text-[1.2rem] font-semibold leading-tight text-[var(--home-ink)]">{card.label}</span>
      <span className="text-[0.9rem] leading-snug text-[var(--home-muted)]">{card.sub}</span>
    </motion.button>
  );
}
