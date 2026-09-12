import React from "react";
import { motion } from "framer-motion";
import CategoryIcon from "@/components/home/CategoryIcons";

// Six subtle, coordinated cream surfaces for the 2×3 grid. Each icon is a thin
// dark-teal line-art illustration centered in a gold ring, matching the V3
// reference exactly. Alternating cream / peach backgrounds with a thin muted
// border and a soft top-left highlight + bottom-right taupe drop shadow for
// the gentle pressed/lifted depth effect.
const TINTS = {
  calm: "bg-white",
  lift: "bg-[#F7F0E5]",
  ground: "bg-[#F7F0E5]",
  sleep: "bg-white",
  focus: "bg-white",
  guide: "bg-[#F7F0E5]",
};
const DEPTH =
  "border border-[#D9D0C7] shadow-[inset_1px_1px_0_rgba(255,255,255,0.65),4px_5px_14px_-4px_rgba(209,198,189,0.75)]";

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
        "no-tap flex flex-col items-center gap-2 rounded-[1.4rem] px-4 py-4 text-center " +
        DEPTH +
        " transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98] " +
        TINTS[card.tint]
      }
    >
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full ring-1 ring-[#C99646]">
        <CategoryIcon id={card.tint} className="h-11 w-11" />
      </span>
      <span className="mt-1 font-heading text-[1.15rem] font-bold leading-tight text-[#0E4536]">{card.label}</span>
      <span className="text-[0.9rem] leading-snug text-[#0E4536]/75">{card.sub}</span>
    </motion.button>
  );
}
