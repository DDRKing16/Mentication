import React from "react";

// Decorative "thought lines": a very low-contrast copper line field that drifts
// almost imperceptibly. Purely presentational (aria-hidden). Pass still to stop
// movement when the scene is sealed or the app is backgrounded.
export default function ThoughtLines({ still = false, intensity = 1, style }) {
  return (
    <div aria-hidden="true" className="tpl-lines" style={style}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ opacity: 0.55 * intensity }}>
        <defs>
          <linearGradient id="tpl-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--tpl-shutter-edge)" stopOpacity="0" />
            <stop offset="45%" stopColor="var(--tpl-shutter-edge)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--tpl-shutter-edge)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="tpl-line-soft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--tpl-primary)" stopOpacity="0.05" />
            <stop offset="60%" stopColor="var(--tpl-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--tpl-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className={still ? "" : "tpl-drift-a"} style={{ transformOrigin: "50% 40%" }}>
          <path d="M-20 88 C 60 40, 140 132, 220 82 S 360 30, 420 74" fill="none" stroke="url(#tpl-line)" strokeWidth="0.7" />
          <path d="M-20 104 C 70 58, 150 150, 230 96 S 366 48, 420 92" fill="none" stroke="url(#tpl-line-soft)" strokeWidth="0.5" />
        </g>
        <g className={still ? "" : "tpl-drift-b"} style={{ transformOrigin: "50% 70%" }}>
          <path d="M-20 214 C 66 168, 132 258, 214 208 S 352 162, 420 202" fill="none" stroke="url(#tpl-line)" strokeWidth="0.6" />
          <path d="M-20 236 C 78 196, 146 276, 236 226 S 356 190, 420 228" fill="none" stroke="url(#tpl-line-soft)" strokeWidth="0.45" />
        </g>
      </svg>
    </div>
  );
}
