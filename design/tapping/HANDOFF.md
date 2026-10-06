> Updated design, integrated-route evidence and cue lifecycle results: [Redesign review](redesign/REVIEW.md). The sections below describe the original delivery.

# Gentle Tapping

Local implementation on `design/eft-tapping-review`, based on verified main `e2369be`. No shared host files changed, no push, merge or deployment. The finished component is for the existing Mentication application. `design/tapping/index.html` is only a review harness, not a new app.

## Integration contract for shared-flow owner

Import `TappingExperience` from `@/components/tapping/TappingExperience` and the metadata from `tappingRegistration.js`. Add the metadata through the existing catalogue factory. Primary direction is Calm, with Ground discoverability; existing grounding category. Add `eftTapping` to the host's custom experience dispatch. Do not render an empty generic `steps` fallback. No global category changes.

Props: `onComplete(result)`, `onExit()`, `onChangeCourse(result)`, optional `initialConcern`. Component owns its exact before/after question, so avoid duplicate host intensity screens. Host owns optional saving, session persistence, and change-course routing. No persistence or network calls occur in the component. Do not display a saved confirmation merely because the component called onComplete. Promise rejection preserves the check-in and offers retry.

Payload: interventionId, mode (`eft` or `grounding`), concern, before/after (nullable numbers), ratingQuestion, ratingMin 0, ratingMax 10, roundsCompleted, completed, stopped, skippedPoints, durationSeconds. `completed` means at least one full unskipped guided round elapsed; it is not a claim that body taps were sensed or that distress improved. A stopped/partially skipped round does not become a completed round. Exit does not call completion. Initial rating remains the baseline across an optional repeat; skipped post-rating never reuses a previous answer.

## Experience

Original scalable head/upper-body art, emerald/ivory/gold palette from `mentationThemes.js`, bundled EB Garamond + Hanken Grotesk. One illuminated anatomical point, mirror guidance, short captions. Side-of-hand inset for setup. No stock, remote, generated or borrowed artwork.

Concern selection is activation one; selecting or skipping baseline is activation two. That immediately reveals the personalized round preparation with the first point. No required phone activations inside the timed body sequence. Pause, stop, or skip remain available. Browser-hidden state pauses rather than silently completing. Settings offer a static light, slower point changes, and optional synthesized beat (off by default; no speech service or remote audio). Keyboard and screen reader text remain usable without motion or sound.

## Protocol evidence and design adaptations

Read before selecting the protocol:

- [EFT International: What is EFT Tapping?](https://eftinternational.org/discover-eft-tapping/what-is-eft-tapping/) — primary practitioner organization instructions and exact placement descriptions, accessed 6 Oct 2026. Used its short sequence: side-hand setup, crown, inner eyebrow, eye outer bone, under-eye bone, under nose, chin crease, below collarbone, side torso below armpit. No invented points.
- [EFT International: How to Tap / Points Chart](https://eftinternational.org/wp-content/uploads/Free-EFT-Tapping-Points-Chart.pdf) — primary illustrated guide, version 1.3.4 Dec 2023, read directly. Corroborates setup repeated three times, reminder phrase, same 0–10 reassessment. Artwork is original, not copied from the chart.
- [Yu et al.: pilot RCT study protocol](https://apm.amegroups.org/article/view/148326/html), Table 3 — primary research protocol corroborates setup/sequence/reassessment. It describes a longer multi-session clinical intervention including gamut; it does not establish efficacy of this short app flow. No treatment, cortisol, vagus-nerve, meridian-mechanism or guaranteed-relief claim is made.

EFT-style path retains present concern, self-accepting setup, reminder and reassessment. Wording is an original gentler adaptation, not presented as verbatim standard EFT or a full clinical treatment. Grounding path deliberately omits issue focus and setup; it is explicitly labelled a grounding adaptation using EFT points. It should not be described as equivalent to researched EFT.

Pacing is a UX choice: 30-second setup (three 10-second phrase windows), then eight 12-second points (4 seconds to locate, 8 to tap). Spacious setting: 16 seconds per point, first 6 to locate. Grounding hand step is 12 seconds. No forced breath holds, eyes closing, memory recall, tap targets, or pressure to reach zero. Higher post-rating directs away from another tapping round.

## Review

Run existing Vite dev server and open `/design/tapping/index.html`. Screenshots live in `screenshots/`. Browser regression: `node design/tapping/browser-check.cjs` with Playwright available in the environment; it uses installed Chromium. This test tool adds no application dependency.

Production registration/saving must be connected by the shared-flow owner before this appears in the app catalogue. That shared change is intentionally outside this worker's owned files.

Validation completed: 54 test files / 406 tests passed; repository lint, typecheck and production build passed (existing chunk-size advisory only). Focused protocol tests pass. Chromium checked timed auto-advance, two-activation reveal, exact before/after question, pause/resume, stop, repeat, blank skipped ratings, zero, higher/unchanged/lower outcome text, grounding payload, change-course callback, no accidental completion on exit, 320/390/768 widths, reduced motion, keyboard and no browser errors. Separate edge test covers unavailable audio, rejected host completion and successful retry, and all-points-skipped remaining incomplete. Pacing check covers spacious mode and hidden-tab freezing. Tests demonstrate browser behavior, not clinical benefit or actual body tap detection. Native VoiceOver/device audio still needs device-level QA after host integration.
