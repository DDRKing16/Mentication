# Improvement agent log

One line per work block: date, what changed, commit.

- 2026-09-24 — Hid the grey scroll lines under the Library filter buttons (65df40c8).
- 2026-09-24 — Made haptics actually work on iPhone via @capacitor/haptics (eef7dc12).
- 2026-09-24 — Brand thread phase 1: shared Doorway "Threshold" opening for all 12 interventions, coral thread progress + MENTICATION · GOAL label in the shared shell (see docs/BRAND_THREAD.md).
- 2026-09-24 — Threshold now uses the real logo and wordmark artwork (replaced my redraw); added a navy-ink version of the same artwork for the light Grounding world; rule added: never redraw the logo.
- 2026-09-24 — Logo now shown in 12 different brand-kit colourways (one per intervention) using the real artwork split into doorway/wordmark/swash; reveal rebuilt with opacity/transform only after the clip-path version stopped showing for the owner; thread + hairline take each colourway's swash colour.
- 2026-09-24 — Brand thread phase 2: added the Closing, a brief brand moment that plays as a session ends (the coral thread draws in, then the logo resolves out of it, in the last intervention's own colours) before handing off to the shared finish screen or home; covers Box Breathing, PMR, Grounding, Vector Shift, Signal Lock, Thought or Fact, Urge Surfing, Change the Scene, Tomorrow Parking Lot and The Happy Bump (b3c7c86, 826d106, 60e1dff). Watched it play in a real headless-browser run through Thought or Fact end to end; no flash of the old screen, clean handoff to Home.
- 2026-09-24 — Restored the finished Vector Shift (games) and Night Channel (Tune In dashboard) builds; Signal Lock/Vector Shift/Night Channel now have Back+Home; added Back to Box Breathing, PMR, Grounding, Urge Surfing, Tomorrow Parking Lot and Back+Home to Next Easiest Step; added AI-agent guardrails (.github/copilot-instructions.md, AGENTS.md).
- 2026-09-24 — Removed the spot-the-difference Scan game from Vector Shift (Code now leads straight to Reframe; step list renumbered).
