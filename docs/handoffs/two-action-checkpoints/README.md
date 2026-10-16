# Two-action checkpoints — independent review handoff

Base: latest `main` at start, PR30 / `0ca40ca1589136538f8c5b15935140c4c69f2f2b`.

Original audit runtime SHA: **`40b239b8fc7899fea16384b4528c6d083ad76c67`**. Full package/algorithm checks and the final timed, Good Map and care runs use this SHA. The broad inventory, nine other walkthroughs, action/body, Dear/Foundations, Tara, tapping and focused Happy Bump regression runs use **`6bd361d337109ed81a0011eb37bbb16350ac3d21`**. Subsequent runtime changes are limited to Box Breathing layout and Good Map optional context; those have dedicated final-SHA reruns. The Good Map runner uses `7289bb8025791a2b5c7ff011306b8577abb988c2` (a keyboard-activation test correction; runtime is identical to `40b239b`). The evidence commit adds this report and captures without changing runtime or test code. Final PR head is stated in the PR description. No merge or deployment was performed.

[Per-intervention matrix](coverage.md) · [40 rendered route openings](inventory/routes.json) · [validation output](validation/tests-lint-typecheck-algorithm.txt) · [production build](validation/build.txt)

## Independent-review corrections

[Review fixes and new evidence](review-fixes.md) supersede the original Box Options, Good Map follow-up and Tara prediction-edit claims below. Runtime is now `e19f331dd2ea70585b26817b94ad0c0d14c37915`; full validation passes **110 files / 958 tests**. The original captures below retain their original SHAs.

## Changes

- Saved checkpoint order now travels with the existing draft as event IDs for care, Happy Bump, Thought or Fact, Next Easiest Step, Change the Scene and Tara. Later optional answers stay in their original pair across reload. Undo removes evidence; editing/repeated confirmation does not increment a counter. No separate answer store was added.
- Happy Bump mission, area and next-step drafts require their confirmation. Skipping a rating clears its confirmation. A suggested action does not also count an inferred area choice. Existing accepted/attempted mission drafts retain their task evidence conservatively.
- Good Map now continues paired feedback through confirmed satisfaction ratings and planning/outcome answers. Selecting a rating without confirming it no longer earns a checkpoint. The ledger is saved with the current map and restored by its existing history/undo flow. Optional context also earns a pair; revisiting and skipping both answers removes both. Text-only pairs use the full card width.
- Tara's confirmed prediction is independent of the current screen. Practical-support actions follow the user's words instead of sticking over them on a short phone.
- Box Breathing uses a brief two-round reminder in its existing comfort-guidance area. Finish remains directly available in the control dock; reduced motion is under Options. The pacer's clock, crystal, audio and phase sequence are unchanged; its repeated numerical heading gives way to the live phase/count on short phones. The test checks that **both the phase cue and feedback are visible without scrolling** at 320×568 and 390×844.

## Validation and evidence

- `npm test -- --run`: **109 files / 956 tests passed**.
- `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/verify-v3-algorithm.mjs`: passed. Build retains Vite's bundle-size advisory.
- Chromium uses `--mute-audio`, fresh synthetic local profiles and reduced-motion preferences. Viewports are **320×568 and 390×844**; extra enlarged-text care checks use their explicitly recorded dimensions.
- [Focused regressions](regressions/results.json): draft task/area exclusions, skipped actions, double completion, Back/Forward/reload, and adding an earlier optional pairing *after* a reward has already been confirmed.
- [Timed checks](timers-verified/interaction-traces.json): real elapsed two/four breathing rounds and urge guidance; pause does not advance evidence; reload resumes paused; subsequent guidance continues without a reward dialog. No accelerated clock is used.
- [Other walkthroughs](walkthroughs/interaction-traces.json): nine reachable journeys, paired feedback, repeated grounding clicks, skipped senses/actions, standalone reveals and reload.
- [Good Map](good-map/results.json): 16 sorts, 16 confirmed importance ratings, 16 confirmed satisfaction ratings, plan and honest unattempted outcome; assertions after each rating and after history/reload.
- [Action/body](action-body/results.json): six full scenario runs covering Next Easiest Step, PMR and Happy Bump.
- [Care](care/browser-results.json): complete core journeys, optional/long wording, enlargement, saved progress and legacy drafts.
- [Dear 2100 / Foundations](focused/results.json): four full journey runs, explicit choices, long input, history and saved outcomes.
- [Tapping](tapping/results.json): real partial interval, pause/reload/resume/stop, unavailable voice and unrated finish.
- [Tara](tara/results.json): three full scenarios plus short-phone long support and unprepared support/deletion. The result records its source SHA; its dirty flag also includes untracked evidence files.

Screenshots were inspected across the 20 interventions at both widths, with full-size checks for the changed Good Map recap, the breathing phase/checkpoint and Tara's long support. Example comparisons: [Tara before](before/tara-overlap-320.png) / [after](tara/long-pause-after.png); [Good Map satisfaction pair](good-map/satisfaction-pair-320.png); [breathing pair](timers-verified/boxV2-two-rounds-320.png).

## Reproduction

Use Node 22+, install the repository dependencies, then `npm run build` and `npm run preview -- --host 0.0.0.0 --port 5183`. Playwright/Chromium are environment tooling, not new application dependencies. Set `NODE_PATH=/opt/codex/cua_node/lib/node_modules` for the CJS runners that use `require('playwright')`.

Run `scripts/verify-two-action-checkpoints.cjs`, `scripts/verify-good-map-release.cjs`, `scripts/verify-release-action-body.cjs`, `scripts/verify-single-step-release.cjs`, `scripts/verify-tapping-release.cjs` and `scripts/audit-reachable-interventions.cjs` with `BASE_URL=http://localhost:5183` and a fresh `EVIDENCE_DIR`.

For `verify-release-walkthroughs.cjs`, use `JOURNEYS=boxV2,urgeSurf FULL_TIMERS=1` for real-clock interruption checks, and `JOURNEYS=factCheck,changeScene,happyBump,tomorrowParking,grounding54321V2,signalLock,nightChannel,goodMap,vectorShift` for the other walkthroughs. Care uses `CARE_PREVIEW_URL` / `CARE_EVIDENCE_DIR`; Tara uses `TARA_APP_ORIGIN` / `TARA_EVIDENCE_DIR`.

## Review limits

This verifies all reachable intervention entries and the specific journeys/branches described in the matrix; it does not claim an exhaustive replay of every possible answer combination. In particular, all Vector Shift visual variants and all full-length PMR/tapping sequences were not replayed manually. Automated protocol/state tests supplement the browser runs. These are browser simulations, not physical exercise, native device, auditory or screen-reader listening tests. No relief or clinical effectiveness is inferred. Missing narration is still missing. Independent review and physical-device/audio checks remain separate from this draft PR.
