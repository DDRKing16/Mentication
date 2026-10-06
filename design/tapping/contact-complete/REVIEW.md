# All nine contact points

Integration candidate `design/tapping-contact-complete-v3`, based on approved contact pilot `24c31e1fc79cc15e3bd8869519b5404dcf7a481b`. Asset-only checkpoint `9be51d963fba86d177107890e4917633e88d76aa` is preserved. The final change wires those assets into the approved Place → Tap flow. No additional artwork alternatives, palette redesign, shared-host changes, dependency additions, main push, merge or deployment.

`tappingArtwork.js` registers each photograph, crop, anatomical description and marker in its 1024 × 1536 source coordinates. The point order and timing remain in the existing protocol; the audio/haptic engine is unchanged. All nine rendered phone placements were inspected: side-hand outer edge, crown centre, medial brow, bone outside eye corner, orbital bone beneath pupil, nose–upper-lip space, lower-lip/chin crease, below medial collarbone, and lateral torso below armpit. Image perspective cannot establish a measured inch distance; precise source wording accompanies the illustration. Generated artwork is instructional, not a testimonial or clinical result.

The brief descriptors follow [EFT International's primary instructions](https://eftinternational.org/discover-eft-tapping/what-is-eft-tapping/) and [points chart](https://eftinternational.org/wp-content/uploads/Free-EFT-Tapping-Points-Chart.pdf). These were read before protocol selection. The original EFT-style concern/setup/reminder and optional grounding adaptation remain distinct. Setup has three reminder windows. Before and after retain the identical question and 0–10 scale; skipped ratings remain null. Completed guided rounds do not imply detected body taps or measured benefit. Research/source details remain in `../HANDOFF.md`.

Each point now uses one dominant action: “Place two fingertips here,” then “Tap gently.” Its precise location is shown during placement and pause; reminders appear during tapping. The side-eye descriptor explicitly says “the bone beside the outer corner of your eye.” Pause stays secondary, and Stop remains visible on both 320 × 640 and 390 × 844 screens. No point-advance phone clicks are required during body tapping.

The timer and optional cues wait for the contact photograph. A failed image pauses and retains the exact text, with an explicit resume/skip choice. Its broken-image icon is suppressed and the error text uses the empty artwork area, keeping Stop fully in view at 320 px. Cleanup prevents a late response from a previous image updating the next point. This handling changes asset readiness only; it does not add a separate rhythm clock.

Review artifacts:

- `Gentle-Tapping-All-Nine-Contacts.png`: all nine 390 px placement screens in source order.
- `Gentle-Tapping-Rhythm-320.png`: all nine 320 px tapping screens, including setup reminder and visible stop/pause controls.
- `screenshots/`: the 36 individual placement/rhythm captures at both widths, plus the failed-image fallback.
- `private-library-artifacts.json`: exact identities of the two private Library copies. These are browser screenshots, classified as image.
- `browser-results.json` and `validation.txt`: check results, with reproducible harnesses beside them.

Validation: repository tests (62 files / 476 tests), lint, typecheck and production build; existing chunk-size advisory remains. Browser checks cover all contact assets/crops, delayed and failed images, placement/rhythm timing, pause/resume, spacious pacing, hidden-tab freezing, sound/touch synchronization and cancellation, unsupported/silent/reduced-motion fallbacks, keyboard, exact before/after, zero/blank/higher/unchanged/lower outcomes, stop/repeat, skipped points not receiving completion credit, optional genuine takeaway persistence/failure/retry/delete, corrupt draft recovery, browser restart paused, and integrated Library → ResetFlow → completion at 320/390/430 px without browser errors or horizontal overflow.

Run `npm run dev -- --host 0.0.0.0 --port 5176`, then the `contact-check`, `cue-check`, `journey-check`, `pacing-check`, `resilience-check`, and `integrated-check` CJS harnesses. The shared edge harness runs with `TAPPING_PREVIEW_URL=http://localhost:5176/design/tapping/index.html`. `render-review.cjs` recreates the two sheets from actual screenshots.

No implementation blocker remains. Physical iOS haptic sensation, device audio and VoiceOver remain device-level QA; injected/native API and Chromium accessibility behavior are covered, not the physical hardware.
