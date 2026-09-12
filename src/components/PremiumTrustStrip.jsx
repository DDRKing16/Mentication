import React from "react";

export default function PremiumTrustStrip({ items = [], dark = false }) {
  const tone = dark
    ? "border-white/10 bg-white/[0.06] text-cream/70"
    : "border-[#0E4536]/10 bg-white/70 text-[#5F726B]";
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] backdrop-blur-sm ${tone}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
