import React from "react";
import { motion } from "framer-motion";

// Pearl-glass human silhouette — abstract, gender-neutral, compact and
// orb-like. Built from translucent orb forms: a small spherical head, a rounded
// torso, soft overlapping ovals for the arms and crossed legs. No face, hair,
// clothing, hands or feet. Subtle ivory/apricot/lavender/powder-blue internal
// refraction gives a dimensional, luminous glass feel — not a flat yoga icon.
//
// Rendered as SVG groups (no outer <svg>); placed inside GroundingScene's
// single svg so coordinates stay aligned with the sensory overlays + arc.
//
// `bloom` (0..1) fades in a warm internal light through the figure for the
// final settle; `pulse` triggers one slow subtle scale pulse at completion.
export default function HumanOrb({ bloom = 0, activeColors = [], pulse = false, breathe = true }) {
  return (
    <g>
      <defs>
        <radialGradient id="gPearl" cx="42%" cy="36%" r="62%">
          <stop offset="0%" stopColor="rgba(255,253,248,0.98)" />
          <stop offset="48%" stopColor="rgba(244,238,228,0.82)" />
          <stop offset="78%" stopColor="rgba(226,220,212,0.5)" />
          <stop offset="100%" stopColor="rgba(214,210,204,0.16)" />
        </radialGradient>
        <radialGradient id="gApricot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(242,201,160,0.55)" />
          <stop offset="100%" stopColor="rgba(242,201,160,0)" />
        </radialGradient>
        <radialGradient id="gLavender" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201,184,224,0.5)" />
          <stop offset="100%" stopColor="rgba(201,184,224,0)" />
        </radialGradient>
        <radialGradient id="gBlue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(168,200,224,0.45)" />
          <stop offset="100%" stopColor="rgba(168,200,224,0)" />
        </radialGradient>
        <radialGradient id="gBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,248,235,0.85)" />
          <stop offset="100%" stopColor="rgba(255,248,235,0)" />
        </radialGradient>
        <clipPath id="gFigClip">
          <ellipse cx={50} cy={55} rx={20} ry={28} />
        </clipPath>
        <filter id="gSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.32" />
        </filter>
      </defs>

      {/* soft contact shadow */}
      <ellipse cx={50} cy={85} rx={16} ry={3.2} fill="rgba(26,46,38,0.06)" />

      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 60%" }}
        animate={pulse ? { scale: [1, 1.05, 1] } : breathe ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={pulse ? { duration: 2.6, ease: "easeInOut" } : { duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* crossed legs */}
        <ellipse cx={43} cy={73} rx={9} ry={12} fill="url(#gPearl)" filter="url(#gSoft)" transform="rotate(-10 43 73)" />
        <ellipse cx={57} cy={73} rx={9} ry={12} fill="url(#gPearl)" filter="url(#gSoft)" transform="rotate(10 57 73)" />
        <ellipse cx={50} cy={70} rx={15} ry={8} fill="url(#gPearl)" filter="url(#gSoft)" />

        {/* arms resting on the lap + hands */}
        <ellipse cx={37} cy={57} rx={6} ry={12} fill="url(#gPearl)" filter="url(#gSoft)" transform="rotate(18 37 57)" />
        <ellipse cx={63} cy={57} rx={6} ry={12} fill="url(#gPearl)" filter="url(#gSoft)" transform="rotate(-18 63 57)" />
        <circle cx={42} cy={66} r={4} fill="url(#gPearl)" filter="url(#gSoft)" />
        <circle cx={58} cy={66} r={4} fill="url(#gPearl)" filter="url(#gSoft)" />

        {/* torso */}
        <ellipse cx={50} cy={53} rx={14} ry={16} fill="url(#gPearl)" filter="url(#gSoft)" />

        {/* neck + head */}
        <ellipse cx={50} cy={40} rx={4} ry={3.2} fill="url(#gPearl)" filter="url(#gSoft)" />
        <circle cx={50} cy={31} r={8.2} fill="url(#gPearl)" filter="url(#gSoft)" />

        {/* iridescent refraction, clipped to the figure */}
        <g clipPath="url(#gFigClip)">
          <ellipse cx={42} cy={45} rx={12} ry={14} fill="url(#gApricot)" opacity={0.5} />
          <ellipse cx={59} cy={52} rx={11} ry={13} fill="url(#gLavender)" opacity={0.45} />
          <ellipse cx={50} cy={68} rx={13} ry={8} fill="url(#gBlue)" opacity={0.4} />
          {/* upper-left glass highlight */}
          <ellipse cx={45} cy={34} rx={4} ry={5} fill="rgba(255,255,255,0.5)" />
        </g>

        {/* rim light on head + torso */}
        <circle cx={50} cy={31} r={8.2} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={0.45} />
        <ellipse cx={50} cy={53} rx={14} ry={16} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.35} />

        {/* settle bloom — warm internal light through the figure */}
        {bloom > 0 && (
          <g clipPath="url(#gFigClip)" opacity={bloom}>
            {activeColors.map((c, i) => (
              <circle key={i} cx={50} cy={52} r={5 + i * 4.5} fill={c} opacity={0.2} />
            ))}
            <circle cx={50} cy={52} r={18} fill="url(#gBloom)" />
          </g>
        )}
      </motion.g>
    </g>
  );
}