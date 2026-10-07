# One question per screen: the three care practices

Local branch: `codex/care-single-question-flow`. Exact published baseline: `b4f406c9f3f638bba11d04bebb10df7c60274609`. This batch has not been pushed, merged or deployed.

The baseline was inspected through the actual complete Library journeys before replacing the flows. The implementation separates decisions rather than removing the practices: **one prominent question and one answer group or writing field** on a decision screen; **one clear instruction and one prominent forward action** on a practice screen. Answer buttons advance immediately. Writing requires one explicit Use button. Back returns to the screen actually visited, including optional writing and repeated returns. Stopping Make Room clears allowing consent; Back returns to the outside anchor so another gentle moment remains an explicit choice.

## Revised step maps

| Practice | Main sequence, after Begin |
| --- | --- |
| Self-Compassion | Starting rating → critical line → caring words → tone → say the response → supportive action → planned/done → same rating → save choice → personal card |
| Unhook | Starting rating → thought → mental pattern → try the frame → useful action → outside anchor → return attention → continue/return again → planned/done → same rating → save choice → personal card |
| Make Room | Starting rating → manageable feeling → outside anchor → notice surroundings → gentle allowing → everyday action → planned/done → same rating → save choice → personal card |

“Use my own words/step” opens a dedicated writing screen with the same question, one visible field, and one Use button. Naming an outside anchor also gets a dedicated screen. No required field is hidden behind a folded section. The planned/done screen asks one question with two answers. Save is a separate privacy decision; the card has one main Finish/Close action. Restart and deletion move to a separate Practice options question. Resume has one main Resume action and one secondary Draft options link.

## Baseline → change → rationale

| Practice | Baseline problem | Change | What remains substantive |
| --- | --- | --- | --- |
| Self-Compassion | A response, its editor, tone choices, believability controls and folded next-step choices could share the core screen. | Separate caring words, tone, speaking and action. Put the actual caring-words question above the choices; show the response in a quiet practice card with one explicit “I tried” action. | Notice the exact critical line; offer oneself the care one could offer a cared-for person; use believable words rather than forced positivity; say them in a chosen tone; choose a real supportive action. Words can be changed, or the person can choose care without them. |
| Unhook | Framing and pattern choice shared a screen; outside-anchor choice/naming and the return practice also shared a screen. | Name the process on its own question screen, try the framing on its own practice screen, choose action and anchor separately, then practise attention. Continue versus another return is a separate question. | Preserve the original thought, avoid debating its truth, actually try hearing it as words, return to a selected real-world action/detail, and repeat after getting pulled back. Pattern/anchor selection alone grants no practice credit. |
| Make Room | Anchor choice/naming, allowing consent and step selection competed with the feeling practice. | Select an outside anchor, notice it, then explicitly choose the gentle allowing moment. Keep allowing separate from action selection and action status. | Stay connected to surroundings before turning toward a manageable feeling. Allow gently and without a timer or required mid-practice taps, then choose an everyday step with the feeling allowed to remain. There is no forced breathing, intensity escalation, trauma recall or claim that the feeling vanished. |

The actual pre/post question is now the large heading rather than a smaller legend under another generic question. Scale wording and 0–10 values are unchanged. Questions use the existing serif type and the established warm/lavender/sage care palettes; personal text supports the question instead of replacing it. Active practices remain quiet, with the main self-report button visually stronger than editing, stopping or “Another way”.

**Tradeoffs:** there are more screens because independent decisions are separated. Answer selection advances directly and removes repeated select-then-Continue steps. Custom editing has a clear extra branch and explicit commit. Stop/exit, editing and “Another way” remain secondary controls; they are not additional mandatory prompts. Long text and enlarged text scroll rather than being cut off. Naming an anchor remains optional. The extra save decision keeps the final card free of competing Save/Finish/Delete/Again actions.

## Evidence and validation

- [Self-Compassion comparison](selfCompassion-comparison.png)
- [Unhook comparison](unhook-comparison.png)
- [Make Room comparison](makeRoom-comparison.png)
- [Representative actual baseline captures](before/) and [actual final captures](after/)
- [Machine-readable browser results](after/browser-results.json) and [validation logs](validation/)

All captures are actual production-preview journeys with **EB Garamond and Hanken Grotesk loaded**, not mockups. The tests enter through the searchable Library and real ResetFlow host. The standard after journey uses a personal critical line/thought/feeling, custom response/action and named anchor where applicable. Comparison fixtures are described by their screenshots; no matched-input clinical improvement is asserted.

Verification covers:

- Complete **320/390 × 844** journeys for all three practices; one H1, at most one answer group/editor, at most one prominent forward button, and no answer groups/editors on an active practice screen.
- Exact words, typing without premature advance, Space/Enter activation, field/heading focus, Back and reload/resume at the meaningful writing/choice/practice/status screens; dismissing secondary Another way without changing practice state.
- Matched actual rating questions, explicit zero, unchanged **6 → 6**, selected-then-skipped blank ratings, repeated decline/stop, planned versus done, and no invented attempt credit.
- Save failure staying on the save question, retry, finish/delete failures, draft failure, saved Return points reopening/closing without duplicate completion, and deletion retry. Personal words/actions remain excluded from session history.
- Genuine **300-character** focused practice content at **320 × 640**, normal and enlarged/high-contrast/reduced-motion modes, with keyboard completion; no horizontal overflow or truncation.
- Normal **320/390 × 640** practice screens with the tested main action initially visible.
- Published **version-1** drafts/cards without the new navigation fields, including unfinished custom notice/action editors. Original words, ratings and attempt/status data remain intact; reading a saved card does not create a completion.
- **83 test files / 690 tests passed**, plus 30 browser cases with zero uncaught page errors; lint, type checking, production build and V3 recommendation verification. The existing production large-chunk advisory remains.

Run `npm run build` then `npm run preview -- --port 5181`; run `CARE_PREVIEW_URL=http://localhost:5181 node scripts/verify-care-practices.cjs`. Playwright/Chromium are verification tooling, not added app dependencies. The two-practice verifier remains an entry point for Unhook/Make Room. Native iOS and VoiceOver have not been tested here; real-user usefulness is not established by these checks.

## Exact ownership and integration contract

Application source changed:

- `src/components/SelfCompassionExperience.jsx`
- `src/components/UnhookExperience.jsx`
- `src/components/MakeRoomExperience.jsx`
- `src/components/care-practices/SingleQuestionCare.jsx` (new focused screens)
- `src/components/care-practices/useSingleQuestionCare.js` (new screen navigation/focus)
- `src/components/care-practices/single-question-care.css` (new scoped styles)
- `src/components/care-practices/CarePracticeFrame.jsx` (optional focused layout, precise resume label, optional progress override; existing defaults preserved)
- `src/components/care-practices/useCarePractice.js` (save returns success/failure so a failed save cannot advance)
- `src/lib/carePractices.js` (validated optional `careScreen`/bounded `careTrail` in the existing version-1 state codec)
- `src/lib/careQuestionFlow.js` (new navigation/legacy mapping)

Tests/tooling changed:

- `src/lib/careQuestionFlow.test.js`
- `scripts/verify-single-question-care.cjs`
- `scripts/verify-care-practices.cjs`
- `scripts/verify-experiential-care.cjs`
- This handoff directory.

Stable IDs/default exports, host props, outcome shape, shared local storage, expiry and completion callbacks are preserved. No registration/migration is required. Router, catalogue, recommendations, JourneyOptions/Another way, saved-work presentation contract, sound handoff, Dear, other interventions, packages and native files are unchanged. The previous care internals remain available in source; the three wrappers now use the focused flow.

This local batch is prepared as one complete commit on the exact baseline, including its source/tests/evidence. Publication remains with the integration owner after the combined review.
