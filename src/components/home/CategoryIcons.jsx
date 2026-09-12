import React from "react";

// Simple hand-drawn sketch icons in thin dark-teal line-art, matching the
// uploaded V3 reference. Shared 64×64 viewBox, 1.6px stroke, rounded caps.
const S = { stroke: "#0e3131", strokeWidth: 2.4, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

const ICONS = {
  // Stacked cairn — three rounded stones, slightly irregular for a hand-drawn feel.
  calm: (
    <svg viewBox="0 0 64 64" {...S} aria-hidden="true">
      <path d="M17 48 C17 45 21 43 25 43 C33 43 31 47 47 46 C51 46 49 50 45 50 C35 50 22 51 17 48 Z" />
      <path d="M21 36 C21 33 25 31 29 31 C36 31 34 35 44 34 C48 34 46 38 42 38 C34 38 24 39 21 36 Z" />
      <path d="M25 23 C25 21 28 19 31 19 C37 19 35 23 40 22 C43 22 41 26 37 26 C31 26 26 26 25 23 Z" />
    </svg>
  ),
  // Rising sun over horizon — arc with radiating rays and a ground line.
  lift: (
    <svg viewBox="0 0 64 64" {...S} aria-hidden="true">
      <path d="M11 42 A21 21 0 0 1 53 42" />
      <line x1="32" y1="10" x2="32" y2="18" />
      <line x1="19" y1="16" x2="22" y2="22" />
      <line x1="45" y1="16" x2="42" y2="22" />
      <line x1="9" y1="28" x2="15" y2="30" />
      <line x1="55" y1="28" x2="49" y2="30" />
      <line x1="7" y1="48" x2="57" y2="48" />
    </svg>
  ),
  // Sprout — central stem with two leaves.
  ground: (
    <svg viewBox="0 0 64 64" {...S} aria-hidden="true">
      <path d="M32 52 C32 42 32 34 32 26" />
      <path d="M32 40 C22 38 15 30 16 21 C26 21 32 29 32 40" />
      <path d="M32 32 C42 30 49 22 48 13 C38 13 32 21 32 32" />
    </svg>
  ),
  // Crescent moon + two small stars.
  sleep: (
    <svg viewBox="0 0 64 64" {...S} aria-hidden="true">
      <path d="M44 12 A22 22 0 1 0 44 52 A16 16 0 1 1 44 12 Z" />
      <path d="M22 19 l1.6 3.4 l3.4 1.6 l-3.4 1.6 l-1.6 3.4 l-1.6 -3.4 l-3.4 -1.6 l3.4 -1.6 Z" />
      <path d="M16 33 l1.2 2.6 l2.6 1.2 l-2.6 1.2 l-1.2 2.6 l-1.2 -2.6 l-2.6 -1.2 l2.6 -1.2 Z" />
    </svg>
  ),
  // Reticle — square frame with corner brackets and center mark.
  focus: (
    <svg viewBox="0 0 64 64" {...S} aria-hidden="true">
      <path d="M14 22 L14 14 L22 14" />
      <path d="M50 22 L50 14 L42 14" />
      <path d="M14 42 L14 50 L22 50" />
      <path d="M50 42 L50 50 L42 50" />
      <line x1="32" y1="24" x2="32" y2="40" />
      <line x1="24" y1="32" x2="40" y2="32" />
      <circle cx="32" cy="32" r="1.8" fill="#0e3131" stroke="none" />
    </svg>
  ),
  // Compass — circle with diamond needle and cardinal tick.
  guide: (
    <svg viewBox="0 0 64 64" {...S} aria-hidden="true">
      <circle cx="32" cy="32" r="20" />
      <path d="M32 16 L36 32 L32 48 L28 32 Z" />
      <line x1="32" y1="12" x2="32" y2="16" />
      <line x1="32" y1="48" x2="32" y2="52" />
      <circle cx="32" cy="32" r="1.6" fill="#0e3131" stroke="none" />
    </svg>
  ),
};

export default function CategoryIcon({ id, className = "h-9 w-9" }) {
  return <span className={className}>{ICONS[id] || null}</span>;
}