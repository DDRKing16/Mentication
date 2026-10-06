# Three care practices — approved direction completed

Branch: `codex/care-practice-design-gate`. The parent approved the practice-core direction at `26864a7`; this follow-up completes preparation/finish and corrects the long-text evidence. No shared routing, catalogue, needs, host takeaways, alternatives, finished standalone builds, dependencies, or deployments changed. Existing `selfCompassion`, `unhook`, and `makeRoom` IDs, wrapper exports, props, completion metadata, and version-1 draft/saved-card infrastructure remain compatible.

## Implemented interaction

- **Self-Compassion:** name the exact critical line, then enter the typography-led practice directly. Choose or write believable caring words; the critical line stays readable. “Try a tone” explicitly labels the manual Steady/Gentle choices. “That does not feel believable” offers responsibility-preserving alternatives. The prominent self-report “I tried saying these words” shares one button with the chosen care action. “Choose care without the words” goes directly to action without recording practice as tried.
- **Unhook:** name the exact thought, then enter the core directly. First click adds the noticing frame; second chooses See/Hear/Feel and brings an ordinary outside anchor beside the unchanged thought. Naming is optional. The prominent self-report shares one button with the chosen next action. Returning to the room is immediate. No truth testing or disputed/disappearing thought.
- **Make Room:** name a manageable feeling, then enter the core directly. Choose an outside anchor before widening space. One segmented control changes the surrounding field while the feeling's name and size stay unchanged. Long names wrap in a fixed, readable field; the surrounding space still expands independently. The prominent self-report shares one button with the chosen action. “Room only” records surroundings-only continuation, not acceptance as tried. “Too much? Return to the room” is immediate. No timer, forced breathing, intense recall, or feeling-shrinking interaction.

The old abstract preparation art and duplicate response-confirmation screens are removed from these flows. The compact header holds alternatives once; practice has no duplicate footer. Other stages retain a direct draft-deletion action. Back from practice returns to naming rather than an obsolete preparation step.

Finish uses the user's words, an explicit tried/not-marked-as-tried status, an honestly labelled chosen/planned/done action, and the actual score comparison. Saved-card review closes without adding a completion. The same clinical questions and 0–10 scales are used before and after; skipping clears a selected number to null. No change is shown as no change. Private words are absent from session completion metadata.

## Corrected screenshot evidence

The earlier gate's long-text images were invalid: replacing storage while a mounted finished practice existed was overwritten by its pagehide draft flush. The follow-up uses a new browser context for each long fixture. It asserts `[data-care-stage="practice"] .pf-core`, the exact injected text, and persisted stage/notice/action **before capturing**. The old inaccurate images and storyboard panels are replaced.

In `care-practice-design-gate/`:

- `*-review-storyboard.png`: actual previous design, current initial core, first choice, second choice at rest, honest 6→6 finish, and corrected 320px long core.
- `*-long-320.png`: full scrollable new core, normal text.
- `*-long-enlarged-320.png`: full scrollable new core with persisted large-text/high-contrast preferences.
- `*-long[-enlarged]-action-320.png`: viewport showing the keyboard-reachable action and safety controls.
- `full-flows/*-after-{arrival,practice,takeaway}-{320,390,430}.png`: integrated searchable Library → actual practice → finish captures.
- `checks.json`, `full-flows/all-nine-browser-checks.txt`, and `validation/`: executable checks and actual passing results.

Long fixtures contain 300-character critical lines/thoughts and a 300-character caring response, a 108-character feeling name, a 151-character action, and a long outside-anchor description. All six normal/enlarged long cores have no horizontal overflow; keyboard focus reaches both action and safety controls, and Enter activates the self-report. No long words are hidden or clamped. Ordinary cores still fit 390×844 including safety controls: bottoms 790.55px, 742.81px, and 796.59px respectively. Two choice clicks do not record practice as tried.

## Validation

- `npm test -- --run`: **60 files / 473 tests passed**.
- `npm run lint`, `npm run typecheck`, `npm run build`: **passed**. Build retains the repository's existing large-chunk advisory.
- `node scripts/verify-v3-algorithm.mjs`: **passed**.
- `CARE_PREVIEW_URL=http://localhost:5175 CARE_EVIDENCE_DIR=... node scripts/verify-care-practices.cjs`: **all nine integrated flows passed** at 320, 390, and 430px.
- `CARE_GATE_ORIGIN=http://localhost:5175 node docs/handoffs/care-practice-design-gate/check.cjs`: **three ordinary cores and six genuine long/enlarged cores passed**.

Integrated checks cover personal input, matched/blank ratings and skip clearing, reload/resume, alternatives/Escape, save/Return-points/reopen/delete, repeat, stopped/done/planned truthfulness, actual keyboard Enter/Space, reduced motion, large text/high contrast, no overflow or runtime errors, and failed draft/save/delete/Finish operations with successful retry. Three 390px cases additionally prove closing a saved card does not duplicate session completion. The Make Room surroundings-only case explicitly preserves `practiceTaken:false` and a planned action.

Playwright and Chromium are environment tooling, not app dependencies. Native iOS and spoken screen-reader output were not tested in this Linux environment. Primary clinical-source rationale and original commercial-safe wording are documented in `care-practices.md`; these new screens make no clinical-validation or outcome claim. The failed private Library connection was not retried.
