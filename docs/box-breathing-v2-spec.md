# Box Breathing V2 — Approved Production Specification

> **Status: PRODUCTION-LOCKED.**
> This document is the benchmark standard for Box Breathing V2 and, by
> extension, the reference pattern for future Mentication interventions.
> Do **not** alter visuals, timing, narration, audio, layout or functionality
> of the approved experience without an explicit request. The component files
> are marked `PRODUCTION-LOCKED` in their headers.
>
> This spec is descriptive (it records *what is*), not prescriptive — it was
> generated from the approved code as-is and is not to be used as license to
> redesign.

---

## 1. Files & ownership

| File | Role |
| --- | --- |
| `src/lib/boxV2Layout.js` | Shared geometry constants for the responsive square and tracing path. |
| `src/components/BoxBreathingV2Stage.jsx` | Switches the stage between the instruction frame and the active paced pacer; owns no behaviour of its own. |
| `src/components/BoxBreathingV2InstructionFrame.jsx` | Instruction screen: native CSS "atmospheric square", word-by-word text reveal. |
| `src/components/BoxBreathingV2Pacer.jsx` | Active paced screen: master clock, tracing path, phase labels and Breath Loom updates. |
| `src/components/BoxBreathingV2BreathLoom.jsx` | Native SVG glass-ribbon sculpture and imperative updater; owns no timer. |
| `src/hooks/useBoxV2WordReveal.js` | Word-by-word narration synchronisation (alignment + audio playback). |
| `src/hooks/useBoxBreathingSoundscape.js` | Dedicated background MP3 soundtrack + narration ducking. |
| `src/lib/preloadBoxV2.js` | Early preloading of instruction narration. |
| `src/lib/narrationService.js` | Offline manifest lookup for bundled narration and optional word-level alignment. |

---

## 2. Instruction-screen design

- The instruction screen is **purely native** (CSS + SVG, no image asset).
- A faint rounded-square **outline** (`border`, ~16% emerald) plus a diffused
  **emerald radial glow** concentrated behind the text, and an illuminated
  **bottom-left point** (`#00f2fe` with layered box-shadow).
- "BREATHE" (eyebrow) and the step **title** are visible from the first frame.
- The instruction copy occupies its final space immediately (all words
  rendered, hidden via `opacity`) so the reveal never shifts surrounding
  layout; each word fades in (`opacity`, 160 ms) as it is spoken.
- The **Breath Loom is not shown** on the instruction screen — only on the
  active paced screen — so the two states stay visually continuous via the shared
  `BOX_V2_SQUARE_STYLE` size.

## 3. Word-by-word narration synchronisation

- `useBoxV2WordReveal` loads the bundled narration clip **with word-level
  alignment** from the local manifest.
- A dedicated `<audio>` element plays at the session delivery rate
  (`rate`, default `0.82`) with a lead-in delay (`leadMs`).
- A `requestAnimationFrame` loop reads the audio element's `currentTime`
  against the alignment `start` times and reveals each displayed word as it is
  spoken. Tokens are split so punctuation-only decorations reveal with the
  following word.
- When narration is muted, the full instruction is shown immediately.
- If the alignment word count does not match the displayed text, the full
  instruction is revealed at once (never stuck hidden).
- Hard failure (audio/alignment unavailable) → reveal all + signal
  completion. A one-tap autoplay unlock guards strict/iframe contexts.

## 4. ElevenLabs voice & cached audio

- Voice identity and generation settings live in the approved build-time
  narration workflow. Credentials never enter the application bundle. These
  settings are **frozen** and must not be tuned.
- Approved clips and alignment are bundled in the application and indexed by
  the local narration manifest.
- The instruction clip is pre-warmed via `preloadBoxV2.warmNarration` so the
  reveal starts without a generation gap.

## 5. Breath Loom — animation, progression and material

- The centrepiece is a native responsive SVG. No runtime image or video is
  used for the paced visual.
- Three interwoven transparent glass ribbons represent progressive regulation.
  One ribbon is present initially; the second appears after one complete
  16-second circuit and the third after two circuits.
- The earliest outer ribbon begins slightly irregular. Rough and settled SVG
  paths crossfade across exhalations and completed cycles, so the sculpture
  becomes visibly clearer and more coherent over time.
- Inhale opens the ribbons, the first hold suspends them, exhale contracts and
  settles them, and the final hold becomes nearly still.
- A fine liquid-light filament connects the actual tracer point to the active
  ribbon. Its geometry is recalculated from the same tracer coordinates used by
  the leading dot.
- Each glass ribbon is built from layered translucent base, body, edge and
  caustic strokes. The centre stays open and dark rather than becoming a solid
  crystal or tile.
- The approved visual reference is
  `docs/reference/box-breathing-v2-breath-loom.png`; it is documentation only,
  not a runtime asset.

## 6. Single-clock integration

- `updateBoxBreathingV2BreathLoom()` is called from the pacer's existing
  `requestAnimationFrame` loop with phase index, phase progress, completed
  cycles and tracer coordinates.
- The Breath Loom deliberately owns no timer, interval, narration or audio
  state, preventing visual drift.
- Because the centrepiece is native SVG, Box Breathing V2 no longer preloads a
  crystal image or video. Narration preloading is unchanged.

## 7. Continuous 4–4–4–4 tracing path & endpoint

- One master `requestAnimationFrame` clock drives a 16 s cycle of
  4 × 4 s phases — **Breathe in → Hold → Breathe out → Hold**
  (`PHASE_MS = 4000`, `ROUND_MS = 16000`, default 4 rounds).
- The tracing line is a single continuous illuminated stroke around a
  rounded square, drawn progressively clockwise:
  **bottom-left → top-left → top-right → bottom-right → bottom-left**
  (path defined in `BOX_V2_PATH_D`).
- Progress is via a single `strokeDashoffset` progression (`pathLength = 1`);
  every traced portion stays lit through the cycle. The leading point sits
  at the exact end of the illuminated line.
- A soft opacity fade at the loop seam (`t < 0.06` / `t > 0.94`) resets the
  cycle without a flash.
- Stroke treatment: a thin warm-ivory centre (`rgba(238,232,214,0.8)`,
  width 0.72) over a restrained pale-emerald glow
  (`rgba(150,220,190,0.28)`, width 1.44, Gaussian blur). The leading point is
  a small layered circle (soft glow + bright core).

## 8. Full subtle guide square

- A static full rounded-square **guide track** at ~18% dark emerald
  (`rgba(90,170,140,0.18)`) is rendered behind the tracing line, visible
  throughout all four phases as a subtle guide (not a bright frame). It is a
  static full path (no dash animation).
- A static radial emerald haze (~6% max opacity) sits behind the square for
  ambient depth on the true-black canvas.

## 9. Phase labels & transitions

- Labels: `["Breathe in", "Hold", "Breathe out", "Hold"]`, colour
  `text-cream`, `font-heading`, ~1.55 rem, medium weight.
- Crossfaded with `AnimatePresence` (220 ms, `[0.22, 1, 0.36, 1]` easing),
  keyed by phase index so only the label re-renders on phase change.
- A light haptic fires on each phase change (unless discreet / reduced-motion).

## 10. Soundtrack, audio ducking & controls

- A dedicated `BreathingSphere.mp3` soundscape plays for the whole
  intervention (through the paced cycle **and** the following rest step),
  via `useBoxBreathingSoundscape`.
- Volume is controlled on the `HTMLMediaElement` directly (no Web Audio
  graph) for CORS independence. Base level `0.22`, ducks to `0.07` while the
  narrator speaks, returns after. Fades: in 1.6 s, out 1.2 s, duck 0.5 s
  (ease-in-out). The exit fade continues after unmount so it never cuts off.
- The procedural ambient (rain/wind) is muted for the whole Box Breathing
  intervention so it is not layered over the MP3.
- Player controls (in `ResetPlayer`): pause/play, audio on/off, captions,
  timer, ambient — plus "This isn't helping" (switch) and "Next" (skip).
- One-tap autoplay unlocks are wired for the soundscape, the instruction
  narration, and the shared guide voice so audio is never permanently lost
  in strict/iframe contexts.

## 11. Responsive behaviour

- Breathing square and Breath Loom: `BOX_V2_SQUARE_STYLE` = `min(90vw, 52vh, 22.5rem)` —
  viewport-width-capped for equal side margins on every mobile width,
  viewport-height-capped so it fits the stage, rem-capped for desktop.
- The SVG uses a `0 0 100 100` viewBox inside that square, matching the tracer
  coordinates at every viewport size.
- Instruction frame reuses `BOX_V2_SQUARE_STYLE` so both states share size.
- True-black canvas (`bg-black`) provides the open negative-space centre.
- Safe-area insets are respected via `safe-top-lg` / `safe-bottom` utilities.

---

## 12. Reusable pattern (internal — not yet applied elsewhere)

The approved Box Breathing V2 is the **benchmark pattern** for future
Mentication interventions. The reusable shape, to apply only on explicit
request:

1. **One master clock** (`requestAnimationFrame`) owns all phase timing and
   directly updates native visual state.
2. **Native (CSS/SVG) visuals** over image assets, sized via shared layout
   constants for cross-state continuity.
3. **Server-side frozen TTS** with `TtsCache` + word-level alignment for
   synced text reveal; one dedicated caller requests alignment.
4. **Early preloading** of heavy media and first narration lines on
   selection, not on mount.
5. **Dedicated soundscape** with narration ducking on the media element.
6. **One-tap autoplay unlocks** for every unmuted audio source.
7. **Responsive `min()` sizing** (vw / vh / rem caps) and true-black canvas
   for immersive media.

> This pattern is documented for reuse. It must **not** be automatically
> applied to other interventions — only when explicitly requested.

---

## 13. Regression check (approved build)

| Check | Result |
| --- | --- |
| Narration ↔ word-level text sync | ✅ `useBoxV2WordReveal` reveals words from audio `currentTime` vs alignment `start`. |
| Breath Loom timing | ✅ Imperative updater receives phase progress from the existing master clock. |
| Tracing path direction | ✅ `BOX_V2_PATH_D`: bottom-left → top-left → top-right → bottom-right → bottom-left (clockwise). |
| Each phase exactly 4 s | ✅ `PHASE_MS = 4000`, `ROUND_MS = 16000`, 4 phases. |
| Runtime media dependency | ✅ None for the paced centrepiece; native SVG renders immediately. |
| Audio ducking & controls | ✅ `useBoxBreathingSoundscape` ducks 0.22→0.07; full control dock in `ResetPlayer`. |
| Layout (mobile + desktop) | ✅ Loom and tracer share the same `min(90vw, 52vh, 22.5rem)` square and `0..100` coordinate system. |

All approved behaviours verified against the locked code. No changes made to
functionality — only production-lock headers, this spec, and two stale code
comments corrected to match the approved free-run crystal behaviour.
