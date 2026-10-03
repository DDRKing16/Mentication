// The Peace Palace visual: a night-scene palace that is drawn stage by
// stage as `level` grows, matching src/lib/peacePalace.js's PALACE_STAGES.
// Ambient motion is plain CSS (palace-* classes) so the app-wide
// `html.reduce-motion` rule stills it automatically.
import React from "react";
import { motion } from "framer-motion";

// Palette: muted, dark-brand night tones with the cream palace and the
// teal roofs the app's interventions already use.
const SKY_TOP = "#101B33";
const SKY_BOTTOM = "#1D2C4D";
const GROUND = "#0C1526";
const WALL = "#F4EDDE";
const WALL_SHADE = "#DDD2BC";
const ROOF = "#1C7A6E";
const GLOW = "#00F5D4";
const BLOOM = "#E9A8B8";

const STARS = [
  [38, 42], [86, 24], [150, 52], [222, 30], [262, 62], [318, 36], [352, 78],
  [58, 92], [196, 78], [336, 108], [118, 112], [280, 128],
];

function Stars() {
  return (
    <g>
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1.1} fill="#EAF2F6" opacity={0.55}
          className="palace-star" style={{ animationDelay: `${(i % 5) * 0.9}s` }} />
      ))}
    </g>
  );
}

// Squashed, wobbling blobs — muted, darker than the sky's highlights,
// never perfect circles.
function Blobs() {
  return (
    <g opacity={0.5}>
      <ellipse cx={90} cy={225} rx={64} ry={22} fill="#16304E" className="palace-blob" style={{ animationDelay: "-2s", transformOrigin: "90px 225px" }} />
      <ellipse cx={310} cy={232} rx={70} ry={20} fill="#123952" className="palace-blob" style={{ animationDelay: "-4s", transformOrigin: "310px 232px" }} />
      <ellipse cx={200} cy={242} rx={110} ry={18} fill="#1A2E52" className="palace-blob palace-blob-slow" style={{ transformOrigin: "200px 242px" }} />
    </g>
  );
}

function Tower({ x, w = 26, h = 64 }) {
  return (
    <g>
      <rect x={x} y={200 - h} width={w} height={h} fill={WALL} />
      <rect x={x} y={200 - h} width={w * 0.4} height={h} fill={WALL_SHADE} opacity={0.55} />
      <path d={`M ${x - 4} ${200 - h} L ${x + w / 2} ${200 - h - 18} L ${x + w + 4} ${200 - h} Z`} fill={ROOF} />
      <rect x={x + w / 2 - 0.4} y={200 - h - 26} width={0.8} height={8} fill={WALL_SHADE} />
    </g>
  );
}

function Parts({ level }) {
  const shown = (n) => level >= n;
  return (
    <g>
      {/* first stones */}
      {shown(1) && (
        <g>
          <rect x={168} y={196} width={26} height={9} rx={3} fill={WALL} />
          <rect x={196} y={196} width={30} height={9} rx={3} fill={WALL_SHADE} />
          <rect x={181} y={186} width={26} height={9} rx={3} fill={WALL} opacity={0.9} />
        </g>
      )}
      {/* gate & path */}
      {shown(2) && (
        <g>
          <path d="M 60 252 L 340 252 L 320 214 L 80 214 Z" fill={WALL_SHADE} opacity={0.28} />
          <path d="M 186 200 L 186 176 Q 200 164 214 176 L 214 200 Z" fill={GROUND} />
          <path d="M 186 200 L 186 176 Q 200 164 214 176 L 214 200" fill="none" stroke={WALL} strokeWidth={4} />
        </g>
      )}
      {/* walls */}
      {shown(3) && (
        <g>
          <rect x={132} y={182} width={54} height={20} fill={WALL} />
          <rect x={214} y={182} width={54} height={20} fill={WALL} />
          <rect x={132} y={182} width={54} height={5} fill={WALL_SHADE} />
          <rect x={214} y={182} width={54} height={5} fill={WALL_SHADE} />
        </g>
      )}
      {/* towers */}
      {shown(4) && (
        <g>
          <Tower x={118} />
          <Tower x={256} />
        </g>
      )}
      {/* great hall */}
      {shown(5) && (
        <g>
          <rect x={176} y={158} width={48} height={44} fill={WALL} />
          <path d="M 170 158 L 200 136 L 230 158 Z" fill={ROOF} />
          <rect x={194} y={168} width={12} height={16} fill={GROUND} />
          <circle cx={200} cy={150} r={3.4} fill={WALL_SHADE} />
        </g>
      )}
      {/* in bloom */}
      {shown(6) && (
        <g>
          <path d="M 292 182 L 292 164 L 306 170 Z" fill={GLOW} />
          <path d="M 108 182 L 108 164 L 94 170 Z" fill={GLOW} />
          {[[146, 226], [254, 230], [122, 236], [278, 220], [204, 246]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={3} fill={BLOOM} />
              <circle cx={x} cy={y} r={1.3} fill="#FBE3EA" />
            </g>
          ))}
          <rect x={194} y={168} width={12} height={16} fill={GLOW} opacity={0.35} />
        </g>
      )}
    </g>
  );
}

export default function PeacePalace({ level = 0, className = "" }) {
  return (
    <svg viewBox="0 0 400 280" className={className} role="img" aria-label={`The Peace Palace, stage ${level + 1} of 7`}>
      <defs>
        <linearGradient id="palace-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY_TOP} />
          <stop offset="1" stopColor={SKY_BOTTOM} />
        </linearGradient>
        <radialGradient id="palace-moon-halo" cx="0.78" cy="0.2" r="0.45">
          <stop offset="0" stopColor="#F2ECDC" stopOpacity={0.34} />
          <stop offset="1" stopColor="#F2ECDC" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width="400" height="280" fill="url(#palace-sky)" />
      <rect width="400" height="280" fill="url(#palace-moon-halo)" />
      <Stars />
      <circle cx={312} cy={56} r={17} fill="#F2ECDC" opacity={0.92} />
      <circle cx={319} cy={50} r={16} fill={SKY_TOP} opacity={0.28} />
      <path d="M 0 252 Q 100 226 200 240 Q 300 252 400 236 L 400 280 L 0 280 Z" fill={GROUND} />
      <Blobs />
      {/* the palace itself grows stage by stage */}
      <motion.g
        key={level}
        initial={level > 0 ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {level === 0 ? (
          <g opacity={0.6}>
            <circle cx={200} cy={200} r={2} fill={GLOW} />
            <circle cx={200} cy={200} r={5} fill={GLOW} opacity={0.25} />
          </g>
        ) : (
          <Parts level={level} />
        )}
      </motion.g>
    </svg>
  );
}
