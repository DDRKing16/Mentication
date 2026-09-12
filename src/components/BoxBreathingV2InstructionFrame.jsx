// =====================================================================
// PRODUCTION-LOCKED · Box Breathing V2 (approved benchmark)
// Do NOT change visuals, timing, narration, audio, layout or
// functionality without an explicit request. Benchmark standard for
// future Mentication interventions. Spec: docs/box-breathing-v2-spec.md
// =====================================================================
import React from "react";
import { BOX_V2_SQUARE_STYLE } from "@/lib/boxV2Layout";
import { spokenFor } from "@/lib/spoken";
import { useBoxV2WordReveal } from "@/hooks/useBoxV2WordReveal";

const REVEAL_FADE_MS = 160;

// The Box Breathing V2 instruction screen — a native CSS "atmospheric square"
// (faint rounded outline, diffused emerald glow, illuminated bottom-left
// point) with "BREATHE" + the title visible from the start and the instruction
// copy revealed word-by-word in sync with the cached ElevenLabs narration.
//
// The crystal is NOT shown here (it only appears on the active paced screen,
// which is unchanged). Everything is rendered natively (CSS/SVG, no image
// asset) and reuses the active screen's square size so the two states feel
// continuous. The instruction copy occupies its final space from the very
// first frame (all words rendered, hidden via opacity) so revealing words
// never shifts the heading, buttons or surrounding layout.
//
// `showBody` (the existing captions control) gates whether the instruction
// copy renders at all. Word reveal, narration, controls and audio behaviour
// are owned by useBoxV2WordReveal; this component only renders the result.

export default function BoxBreathingV2InstructionFrame({ step, showBody = true, isOpening = false, isClosing = false, narrate, running, rate = 0.82, leadMs = 0, onNarrationEnd }) {
  const spoken = spokenFor(step);
  const { tokens, visibleCount } = useBoxV2WordReveal({
    body: step?.body || "",
    spoken,
    rate,
    leadMs,
    narrate,
    running,
    onEnd: onNarrationEnd,
  });

  return (
    <div className="relative flex items-center justify-center bg-transparent" style={BOX_V2_SQUARE_STYLE}>
      <div
        className="pointer-events-none absolute inset-[-8%]"
        style={{
          borderRadius: "18%",
          background:
            "radial-gradient(120% 92% at 50% 42%, rgba(20,72,64,0.28) 0%, rgba(10,34,31,0.12) 38%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
      <div className={`relative flex flex-col items-center px-8 pb-2 text-center ${isOpening || isClosing ? "w-full" : ""}`}>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-cream/45">
          Breathe
        </p>
        <h2 className="mt-2.5 font-heading text-[1.7rem] font-medium leading-[1.1] tracking-[-0.02em] text-cream text-balance sm:text-[2.1rem]">
          {step.title}
        </h2>
        {showBody && (
          <p className="mt-5 max-w-sm text-[1.05rem] leading-[1.7] text-cream/75 text-balance">
            {tokens.map((tok, i) => {
              if (tok.space) return <span key={i}>{tok.text}</span>;
              const visible = tok.wordIndex < visibleCount;
              return (
                <span
                  key={i}
                  style={{ opacity: visible ? 1 : 0, transition: `opacity ${REVEAL_FADE_MS}ms ease` }}
                >
                  {tok.text}
                </span>
              );
            })}
          </p>
        )}
      </div>
    </div>
  );
}