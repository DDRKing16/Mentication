# Mentication flagship architecture — 17

Catalogue version: `2026-09-06-v1-core25`

The active intervention catalogue contains 25 unique interventions. Seventeen are flagships: Calm 5, Lift 6, Ground 2, Focus 2 and Sleep 2. The remaining eight are supporting interventions. The complete locked composition and migration table live in `FINAL_50_LOCK.md`.

## New flagships

- `vectorShift` — Ground/Calm. A four-stage precision-grounding protocol: visual alignment, serpent navigation, a grounding code and solar scan, followed by a no-score stabilisation signal.
- `signalLock` — Focus/Lift. Observable-target validation, editable scaffolding, 3/8/15/custom sprint selection, selective perimeter clearing, background-safe timestamp countdown, pause/resume, private distraction count and outcome calibration.
- `nightChannel` — Sleep/Calm. Channel and engagement selection, honest source availability, flexible visual fade preference, near-black playback hand-off and optional delayed daytime feedback.

`Gravity Map` and `The Quiet Return` are not catalogue IDs or aliases. Their approved replacements are Reroute and Night Channel.

## Privacy and capability boundaries

Sensitive task, activity and audio-title text is held only in local active-state storage and is not included in analytics events. Preference events store coarse selections and counts. No external audio, deep-link or operating-system Focus integration is claimed unless a connector is added later. Night Channel currently hands playback to the user's chosen audio application; original narrative content is visibly unavailable until licensed or original audio assets are installed.

## Handoffs

The handoff registry adds Grounding → Vector Shift, Countermove → Vector Shift, Next Easiest Step → Signal Lock, Signal Lock → Next Easiest Step and Tomorrow Parking Lot → Night Channel. Existing dismissal memory, consent and circular-routing protections apply.
