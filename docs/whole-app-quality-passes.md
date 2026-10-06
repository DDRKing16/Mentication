# Cumulative whole-app quality review

Starting commit: `b906a74b3e34ba4ec8704f3de36ffc950bceab51` on `codex/overnight-ten-passes`. These are a separate ten-pass review requested after the earlier targeted hardening. No quality multiplier or clinical benefit is asserted. No push, merge or deployment.

Each pass scans Home/need entry, Library, all 20 currently active entry points (18 catalogue practices, Dear 2100, Foundations), completion/return surfaces, and rotates deeper practice coverage. An entry scan is not evidence that every complete practice was played in every pass. Deep coverage and remaining limits are recorded explicitly.

## Pass 1 — keep the chosen practice clear and open it directly

Reviewed eight host surfaces and all 20 entry points, then exercised the original PMR and Box practices, shared completion/return points, and iframe alternatives. Chosen single practices requiring a starting check-in now show their existing brand, real name and authored time guidance. After the existing explicit baseline they open the original practice directly, removing the artificial building wait and redundant overview. Guided recommendations retain their pathway review; Thought or Fact retains its required thought-entry step. The authored questions, numbers and required baseline gates are unchanged.

Rendered Home inspection also found that authored display styles overrode the host's hidden attributes: Journal/Premium appeared even when neither qualified. The source now honors hidden attributes, including hiding the whole section when no card qualifies. Approved illustrations, card geometry and equal widths are preserved.

Validation: 569 tests in 72 files, typecheck, lint and production build passed. Production browser scan passed eight host surfaces and all 20 entries without overflow/page errors. Deep PMR suite passed practice, paused alternative/return, optional note/error, refresh, completion, saved-content read/delete and Home return. Box at 320px verified explicit rating, direct original-practice start and refresh retaining its baseline. Mounted Home verified actual card culling and cross-tab removal after a recorded practice today. Standalone suite requires waiting for Good Map's actual start control rather than treating an early nonempty iframe body as ready; no practice code is altered for this harness timing fix.

Evidence: `/workspace/whole-app-review/pass-01-final/`, `/workspace/whole-app-review/box-chosen-baseline-320.png`, `/workspace/whole-app-review/home-earned-cards-390.png`; logs `/tmp/whole-pass01-{tests,types,lint,build,breadth,deep,standalone}.log`.

## Remaining work

Passes 2–10 are pending. Native iOS and spoken VoiceOver verification are unavailable here; the separate hosting deep-link rewrite remains outside this patch.
