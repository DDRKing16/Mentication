import React from "react";

// Pure presentational emerald-glass breathing object — no state, no timer.
// Every layer's intensity is derived from `size` (scale) and `fullness`
// (0..1), so the caller's single source of truth drives the whole visual and
// nothing can drift. Used by the animated pacer (frame-driven size/fullness)
// and by the opening / rest screens (a calm, fixed resting state).

const C = {
  deep: "20, 56, 45",     // #14382D — deepest shadow / lower-right depth
  mid: "42, 86, 72",      // #2A5648 — mid glass
  light: "74, 140, 120",  // #4A8C78 — seafoam / refraction
  rim: "127, 212, 183",   // #7FD4B7 — mint edge
  cream: "245, 240, 226", // #F5F0E2 — cream highlight / pearl
  ink: "8, 22, 17",       // near-black green for interior shadow
};

export default function BoxBreathingV2Glass({ size = 1, fullness = 0.5, discreet = false }) {
  const bodyOpacity = discreet ? 0.62 : 1;
  // Halo kept tight and controlled — never a wide bloom.
  const haloOpacity = (0.08 + fullness * 0.16) * (discreet ? 0.5 : 1);
  // Edge light brightens with the inhale; stays present at rest.
  const edgeOpacity = 0.4 + fullness * 0.4;
  const rimOpacity = 0.5 + fullness * 0.35;
  const depthOpacity = 0.85; // interior shading strength (dimensional, not brighter)

  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      {/* Controlled ambient halo — small, soft, sits just behind the object */}
      <div
        className="absolute h-56 w-56 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(${C.rim}, ${0.14 + fullness * 0.10}) 0%, rgba(${C.mid}, ${0.06 + fullness * 0.05}) 48%, transparent 72%)`,
          filter: "blur(12px)",
          opacity: haloOpacity,
          transform: `scale(${0.82 + fullness * 0.14})`,
        }}
      />

      {/* Glass body + every internal layer scale together as ONE object */}
      <div
        className="relative flex h-44 w-44 items-center justify-center"
        style={{ transform: `scale(${size})`, willChange: "transform" }}
      >
        {/* Bevel frame — gives slight physical thickness around the perimeter,
            brighter (cream) on the upper-left, darker (deep) on the lower-right */}
        <div
          className="absolute -inset-[2px] rounded-[27%]"
          style={{
            background: `linear-gradient(135deg, rgba(${C.cream}, 0.22) 0%, rgba(${C.mid}, 0.5) 42%, rgba(${C.deep}, 0.85) 100%)`,
            opacity: bodyOpacity * (0.55 + fullness * 0.35),
          }}
        />

        {/* Base translucent emerald glass — directional depth (lit UL, shadow DR) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[26%]"
          style={{
            background: `linear-gradient(135deg, rgba(${C.mid}, 0.82) 0%, rgba(${C.deep}, ${depthOpacity}) 100%)`,
            boxShadow: `inset 2px 3px 11px rgba(${C.cream}, 0.14), inset -3px -5px 18px rgba(${C.ink}, 0.5), inset 0 0 0 1px rgba(${C.cream}, ${edgeOpacity * 0.22})`,
            opacity: bodyOpacity,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        >
          {/* Faint internal refraction — soft tonal lift toward the upper inside */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 38% 34%, rgba(${C.light}, 0.18) 0%, transparent 52%)`,
            }}
          />
          {/* Lower-right interior depth — darker emerald pooling inside */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 72% 74%, rgba(${C.ink}, 0.32) 0%, transparent 48%)`,
            }}
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
            edges only, so the rim is brighter upper-left and falls off elsewhere */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[26%]"
          style={{
            boxShadow: `inset 0 2px 1.5px rgba(${C.cream}, ${edgeOpacity * 0.55}), inset 2px 0 1.5px rgba(${C.cream}, ${edgeOpacity * 0.38}), inset 0 -1px 1px rgba(${C.rim}, ${rimOpacity * 0.28})`,
            opacity: bodyOpacity,
          }}
        />

        {/* Central pearl — focus point, floats at the glass center */}
        <div
          className="relative z-10 h-3 w-3 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 30%, #ffffff 0%, rgb(245, 240, 226) 60%, rgb(214, 204, 178) 100%)",
            boxShadow: `0 1px 3px rgba(0,0,0,0.5), 0 0 9px rgba(${C.cream}, ${0.32 + fullness * 0.3})`,
            opacity: bodyOpacity,
          }}
        />
      </div>
    </div>
  );
}