# Practice-first design gate

This is a reviewable key-screen prototype based on `6aa8266`, not the completed next redesign. Own branch: `codex/care-practice-design-gate`. No shared routing, catalogue, needs, takeaway host, or alternatives files changed. No push, merge, or deployment.

## Actual interaction scripts

- **Self-Compassion:** keep the exact critical line readable; choose a response that could be offered to someone cared for; choose Steady or Gentle. The response becomes the warm typographic hero. “That does not feel believable” offers a rewrite that preserves responsibility. Editing is optional. One primary combines the explicit report “I tried saying these words” with the selected care action. “Choose care without the words” goes directly to the action stage.
- **Unhook:** first click adds “I am noticing the thought…” around the unchanged exact thought; second click chooses See, Hear, or Feel and places a real-world anchor beside it. The thought remains fully readable. Anchor naming is optional. One primary combines “I tried noticing and returning attention” with the actual next action; returning to the room is immediately available.
- **Make Room:** first choose an outside anchor; only then can the segmented space control widen the surrounding field. The feeling stays the same size and name. “Room only” continues with surroundings without counting acceptance as tried. One primary combines the explicit report with the next action. “Too much? Return to the room” is immediate. No timer, breathing instruction, intense recall, or feeling-shrinking interaction.

## Evidence and checks

The three `*-review-storyboard.png` images are actual browser renders, not mock-ups: previous design; revised initial screen; first useful choice; second choice at rest; 6→6 honest no-change finish; 320px long-text case. The last panel is scaled to show its full scrollable document. Individual full-size screenshots are alongside them.

`checks.json` records actual 390×844 results. Bottom of safety control: Self-Compassion 777.95px, Unhook 734.97px, Make Room 788.75px. No horizontal overflow, runtime errors, or active animations under reduced motion. Two choices leave `practiceTaken:false`; the combined self-report records practice and a **planned**, not completed, action. Matched 6/10 before and after show “You reported no change.” Save and delete were exercised in all three, including a simulated quota failure that produces an honest unsaved error before successful retry. Interrupted reload/resume preserves the choices, and the primary works via keyboard Enter. All three 320px long-text cases have no horizontal overflow. Longer content is allowed to scroll and is not truncated.

Reproduce with Vite on port 5175 and `node docs/handoffs/care-practice-design-gate/check.cjs`; override `CARE_GATE_ORIGIN` for another port. The environment supplies Playwright and `/usr/bin/chromium`; no app dependency was added. Fixtures represent personal words/selected actions carried into practice, not automatic user actions.

Lint, typecheck, production build, and V3 verification pass. 60 test files / 473 tests pass. Private Library saving was attempted with the current upload helper; its tools/list connection failed with a network error before preparation, so no Library files were created. Committed screenshots remain available for parent visual review.

Native iOS, spoken screen-reader testing, and expanded whole-flow acceptance checks remain for after visual review. Existing arrival/notice/preparation and shared rating/finish screens are retained for this gate; the full flow must still be refined after the parent reviews these key screens.
