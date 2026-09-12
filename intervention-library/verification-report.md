# Mentication Elite Intervention Verification Report

Date: 6 September 2026

## Release result

The 17 flagship interventions have one canonical record each, one approved sequence each, one final board each and one curated signature asset each. All 17 resolve to a production intervention and an implemented experience system.

## Pathway coverage

- 13 interactive flagships route through a dedicated stateful experience: Thought or Fact, Then What?, Ignition Point, Change the Scene, Test the Prediction, Open Channel, Countermove, Pulse Shift, Reroute, Next Easiest Step, Signal Lock, Tomorrow Parking Lot and Night Channel.
- 4 guided flagships route through the established guided player: Box Breathing, Progressive Muscle Relaxation, 5-4-3-2-1 Grounding and Urge Surfing.
- Canonical sequences for all 17 contain valid ordered steps and have been approved in `sequence-approval-register.md`.
- Every handoff source and destination resolves to a flagship; self-handoffs are prohibited; unsafe Then What? contexts produce no handoff.
- Ignition Point retains Pleasure, Mastery, Connection and Dream, with Dream verified in the running app.
- Night Channel’s Familiar Replay route explicitly supports a known song, show, video, podcast or audiobook, never voice cloning.

## Privacy and memory verification

- Sensitive free-text keys are reduced to non-content markers in preference memory.
- Unsaved active free text expires after 24 hours.
- Pattern language changes at one, three and five observations.
- Local intervention memory can be deleted directly in Settings; automated tests verify that both event and active-state stores clear.
- Night Channel does not claim to control an external audio service and does not ask for a night-time effectiveness rating.

## Live browser verification

- Desktop: Home, Library, Box Breathing, Ignition Point, the adaptation route and Accessibility panel rendered and operated successfully.
- Phone emulation: exact 390 × 844 checks passed for Home, Library and an active flagship shell. Each reported `clientWidth = scrollWidth = 390`, so no horizontal overflow was present.
- No runtime exceptions occurred in the final phone-emulation pass.
- The shared adaptive escape control remains visible at the bottom of the active flagship viewport.
- Box Breathing exposed Pause, Audio, Captions, Timer and Ambient controls plus “This isn’t helping”.
- Night Channel completed its channel, capture, source, finite stop-point and near-black playback pathway with an honest external-app boundary.

## Automated verification

- Vitest: 3 files, 38 tests.
- TypeScript/JS config typecheck: passed.
- ESLint: passed.
- Production Vite build: passed.
- Recommendation V3 algorithm verification: passed.
- PDF: 28 A4 landscape pages; all 17 intervention names present in extractable text; final visual page inspection passed.

## Defects found and corrected during verification

1. Accessibility defaults had been exported under a new name while runtime references still used the old name, causing a blank app. Corrected and live-browser verified.
2. Four newer flagships—Then What?, Countermove, Open Channel and Pulse Shift—had no explicit recommendation metadata. Added intensity bands, goals, roles, context, mechanism family and unsuitable-state rules.
3. Ignition Point’s library copy still omitted Dream. Corrected in the canonical active catalogue.
4. Night Channel could briefly show 16 minutes after a 15-minute selection because its countdown used stale render time. Corrected to use one start timestamp.
5. The shared “This is not helping” control could sit below the initial phone viewport. It is now persistently fixed with safe content padding.
6. The Night Channel evidence grade could clip on the board. The board generator now wraps evidence grades and limits safely.

## Active catalogue decision resolved

V1 is now explicitly locked to **25 interventions: 17 flagships and 8 supporting interventions**. The active catalogue, recommendation verification, library grouping, situational pathways and legacy migration aliases all enforce that decision. The seven deferred interventions remain archived for saved-session compatibility and resolve to named V1 successors.

## Non-blocking build notes

- The Browserslist database reports as seven months old.
- One pre-existing Tailwind arbitrary easing class is ambiguous.
- Three production chunks exceed Vite’s 500 kB advisory threshold.
- Native archive signing remains pending until Xcode and an Apple Developer signing team are available on the machine.
