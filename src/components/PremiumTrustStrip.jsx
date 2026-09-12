import React from "react";

export default function PremiumTrustStrip({ items = [] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[#0E4536]/10 bg-white/70 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[#5F726B] backdrop-blur-sm"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
