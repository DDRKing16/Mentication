import React from "react";

// Subtle topographic contour lines laid over the emerald surfaces. Rendered
// as an absolutely-positioned, low-opacity SVG so it reads as quiet texture
// rather than decoration — never loud enough to interfere with readability.
export default function TopoLines({ className = "", stroke = "#C69C6D", opacity = 0.08, lines = 11 }) {
  const rows = Array.from({ length: lines }, (_, i) => {
    const y = 16 + i * 28;
    const amp = 8 + (i % 2) * 7;
    return `M-50 ${y} Q 90 ${y - amp} 200 ${y} T 460 ${y}`;
  });
  return (
    <svg
      className={className}
      viewBox="0 0 400 320"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {rows.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth="1.1" />
      ))}
    </svg>
  );
}