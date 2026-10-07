# Tara guided redesign — local review

The redesign makes Tara a useful guide through choosing, trying and carrying a move into a difficult situation. It is based on published main `a3d2cadfd95b565e13d7e23912c35013e08a4a9f` on local branch `codex/tara-guided-redesign-20261007-main`. No redesign source/artifact upload, push, merge or deployment has occurred.

## What changed and why

| Dimension | Observed baseline | Implemented change and evidence |
| --- | --- | --- |
| Visual craft | Repeated question/answer panels and narrow split choices | Character-led ivory/aqua entry, distinct tactic/practice/pocket-plan compositions, full-width choices and dark-teal live support. Existing Tara identity/art preserved. See after/01, 04, 09 and 10. |
| Practice quality | One imagined cue and confirmation | Two authored beats: a way in, then a way back when the difficulty returns. Choosing a response reveals an action; only explicit confirmation records trying. Exact confirmed wording is retained separately from subsequent edits. See after/06–08 and browser results. |
| Personalization | Broad category and default words | Deliberate tactic choice after two actual context choices; optional named situation; editable first move, practice wording and backup. Selected context and current wording survive Back/refresh. See after/04–09. |
| Engagement | Static sentence reveal | Tara explains the selected move and provides contextual recovery options. No invented dialogue, other-person reaction, achievement reward or claimed real result. Guidance is built in, not a configured AI chat service. |
| Cognitive burden | Worksheet detail and two reflection grids together | A decision at a time, optional one-field editors, chosen words first, optional details collapsed. Plan-only, save/leave, immediate support and uncertain answers remain available. See after/12–15. |
| Mobile/accessibility | Enlarged text made narrow cards taller | Full-width choices, clear primary action, retained text enlargement and reduced motion. Entry action fits 320×844 at 24px root text. Dialog keyboard/focus and long wording checks pass; all 30 final captures have no horizontal document overflow. |
| Reliability | Verified drafts and honest outcome semantics | Preserved local storage/read-back errors, explicit deletion, original v1/v2 comparisons and completion callbacks. New v3 practice records are bounded and validated. Private wording is excluded from host outcomes/history.state. See verification/browser-results.json and verification/main/production-results.json. |

The final route is prepare → two optional practice beats → pocket plan → live support → actual action/prediction reflection → optional next-use plan. A user may keep an unpractised plan or go straight to live support. A named situation and selected words stay available when returning. Next-use wording is created only after an explicit keep/adjust/later choice; observations and learning are never fabricated.

## Actual verification

- `npm test -- --run`: 652 tests in 80 files passed on a3d2cad plus this patch. The default sandbox initially prevented an existing timezone test from spawning Node; the same full command passed with the supported execution permissions. No test was skipped or weakened.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed. Build retains the existing large-chunk warning.
- 30 isolated browser scenarios passed against the final worktree: both mobile sizes, actual try vs selection/skip, named/edited words, all five prediction-result branches, historical outcomes, save/leave/resume, repeated/long input, native Back, refresh/revisit, failure/retry, unreadable data, verified local/app-wide deletion and focus/keyboard handling.
- Two compiled actual host flows passed at 390px and 320px/150% text on port 5203, using the final worktree build. Fonts/art loaded; save/leave created no completed session; Finish created one coarse session with no private wording or invented end-intensity; revisiting created no duplicate. Page errors, HTTP/request failures and external requests were zero. Four `net::ERR_ABORTED` loads from the local home iframe (document, brand art or ambient preload) during navigation are separately recorded, not represented as service failures.
- `git diff --check` passed. No shared host/catalogue/sound/Dear 2100 files are changed. The current secondary Another way component remains below Tara content.

## Evidence and limits

`baseline/` contains 28 PNGs from 14 actual e292234 rendered states. `after/` contains 60 PNGs from 15 final states at both widths. `verification/main/` contains 10 actual compiled host PNGs. Capture manifests record sizes, hashes, viewport/text settings and synthetic fixture provenance. Baseline and final fixtures differ, so page heights are not a controlled burden comparison. All after captures were regenerated on a3d2cad plus this patch; representative final phone and compiled host pixels were inspected locally.

The extra recovery practice is an intentional optional interaction cost. At 320px with enlarged text, some steps require scrolling; there is no claim that every page or action fits one viewport. Choosing a response reveals meaningful guidance but practice needs an explicit confirmation. A confirmed try is a user report, not an observed real-world action.

This is a qualitative design assessment and automated reliability evidence. There has been no user study, independent approval of this new redesign, native iOS run or clinical effectiveness validation. The requested 25–30× ambition is not a measurable improvement claim. The selected Calm Steps reference was inspected; the earlier failed 16-file Library materialization was not bypassed. Owner review/publication and native verification remain separate next steps.
