import React from "react";
import { motion } from "framer-motion";
import { SOUNDSCAPE_LAYERS, MIX_PRESETS } from "@/lib/sleep";

export default function SoundscapeMixer({ mixer, onClose }) {
  const { volumes, setLayer, applyPreset } = mixer;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-28 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-cream/10 bg-[hsl(178_36%_13%)]/95 p-4 backdrop-blur-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-cream/55">Soundscapes</span>
        <button onClick={onClose} className="no-tap text-cream/50 transition-colors hover:text-cream text-xs">Done</button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {MIX_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className="no-tap rounded-full border border-cream/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-cream/80 transition-colors hover:bg-white/10"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {SOUNDSCAPE_LAYERS.map((l) => {
          const v = volumes[l.id] || 0;
          const on = v > 0;
          return (
            <div key={l.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
              <button
                onClick={() => setLayer(l.id, on ? 0 : 0.5)}
                aria-label={on ? "Mute layer" : "Enable layer"}
                className={"h-2.5 w-2.5 shrink-0 rounded-full transition-colors " + (on ? "bg-teal" : "bg-cream/25")}
              />
              <span className={"w-28 shrink-0 text-sm " + (on ? "text-cream" : "text-cream/50")}>{l.label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={v}
                onChange={(e) => setLayer(l.id, Number(e.target.value))}
                className="reset-slider h-2 w-full cursor-pointer rounded-full bg-cream/15 outline-none"
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}