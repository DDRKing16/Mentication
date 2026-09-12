import React from "react";

// Premium translucent emerald-glass material for the box-breathing square.
// Pure presentation — no state, no timer. It fills its parent (absolute
// inset-0) so the caller's existing scale/opacity animation drives size and
// fade; the material itself is a calm, fixed dimensional glass (no independent
// illumination animation), so the breathing motion is exactly the caller's.
//
// Visual goals: genuine depth, subtle layered gradients, realistic
// edge-light variation (brighter upper-left, darker lower-right), a soft
// cream highlight concentrated near the upper-left edge, darker emerald depth
// toward the lower-right interior, faint internal refraction, a tight
// controlled halo, slight perimeter thickness. No neon, no big blur, no
// shimmer/particles, no artificial highlight blob. Not brighter — more
// dimensional.

const C = {
  deep: "20, 56, 45",     // #14382D — deepest shadow / lower-right depth
  mid: "42, 86, 72",      // #2A5648 — mid glass
  light: "74, 140, 120", // #4A8C78 — seafoam / refraction
  rim: "127, 212, 183",   // #7FD4B7 — mint edge
  cream: "245, 240, 226", // #F5F0E2 — cream highlight / pearl
  ink: "8, 22, 17",       // near-black green for interior shadow
};

export default function EmeraldGlassSquare({ discreet = false }) {
  const bodyOpacity = discreet ? 0.6 : 1;
  // Fixed calm illumination — the caller animates scale + opacity, not this.
  const fullness = 0.6;
  const edgeOpacity = 0.4 + fullness * 0.4;
  const haloOpacity = (0.08 + fullness * 0.14) * (discreet ? 0.5 : 1);

  return (
    <div className="absolute inset-0">
      {/* Tight, controlled ambient halo — sits just behind the square */}
      <div
        className="absolute -inset-3 rounded-[2.6rem]"
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(${C.rim}, ${0.13 + fullness * 0.08}) 0%, rgba(${C.mid}, ${0.06 + fullness * 0.04}) 50%, transparent 72%)`,
          filter: "blur(10px)",
          opacity: haloOpacity,
        }}
      />

      {/* Bevel frame — slight physical thickness around the perimeter,
          cream-tinted upper-left, deep lower-right */}
      <div
        className="absolute -inset-[2px] rounded-[2.4rem]"
        style={{
          background: `linear-gradient(135deg, rgba(${C.cream}, 0.22) 0%, rgba(${C.mid}, 0.5) 42%, rgba(${C.deep}, 0.85) 100%)`,
          opacity: bodyOpacity * (0.55 + fullness * 0.3),
        }}
      />

      {/* Base translucent emerald glass — directional depth (lit UL, shadow DR) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[2.2rem]"
        style={{
          background: `linear-gradient(135deg, rgba(${C.mid}, 0.80) 0%, rgba(${C.deep}, 0.86) 100%)`,
          boxShadow: `inset 2px 3px 12px rgba(${C.cream}, 0.14), inset -3px -5px 18px rgba(${C.ink}, 0.5), inset 0 0 0 1px rgba(${C.cream}, ${edgeOpacity * 0.22})`,
          opacity: bodyOpacity,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      >
        {/* Faint internal refraction — soft tonal lift toward the upper inside */}
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 38% 34%, rgba(${C.light}, 0.18) 0%, transparent 52%)` }}
        />
        {/* Lower-right interior depth — darker emerald pooling inside */}
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 72% 74%, rgba(${C.ink}, 0.32) 0%, transparent 48%)` }}
        />
        {/* Subtle marbled tonal variation */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 26% 70%, rgba(${C.cream}, 0.035) 0%, transparent 26%), radial-gradient(circle at 74% 30%, rgba(${C.deep}, 0.14) 0%, transparent 34%)`,
            opacity: 0.7,
          }}
        />
      </div>

      {/* Realistic edge-light variation — cream catch along the top + left
          edges only; rim falls off elsewhere (no uniform border) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[2.2rem]"
        style={{
          boxShadow: `inset 0 2px 1.5px rgba(${C.cream}, ${edgeOpacity * 0.55}), inset 2px 0 1.5px rgba(${C.cream}, ${edgeOpacity * 0.38}), inset 0 -1px 1px rgba(${C.rim}, 0.16)`,
          opacity: bodyOpacity,
        }}
      />

      {/* Central pearl — focus point, floats at the glass center */}
      <div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #ffffff 0%, rgb(245, 240, 226) 60%, rgb(214, 204, 178) 100%)",
          boxShadow: `0 1px 3px rgba(0,0,0,0.5), 0 0 9px rgba(${C.cream}, 0.3)`,
          opacity: bodyOpacity,
        }}
      />
    </div>
  );
}