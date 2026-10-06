# Cumulative whole-app quality review

Starting commit: `b906a74b3e34ba4ec8704f3de36ffc950bceab51` on `codex/overnight-ten-passes`. These are a separate ten-pass review requested after the earlier targeted hardening. No quality multiplier or clinical benefit is asserted. No push, merge or deployment.

Each pass scans Home/need entry, Library, all 20 currently active entry points (18 catalogue practices, Dear 2100, Foundations), completion/return surfaces, and rotates deeper practice coverage. An entry scan is not evidence that every complete practice was played in every pass. Deep coverage and remaining limits are recorded explicitly.

## Pass 1 — keep the chosen practice clear and open it directly

Reviewed eight host surfaces and all 20 entry points, then exercised the original PMR and Box practices, shared completion/return points, and iframe alternatives. Chosen single practices requiring a starting check-in now show their existing brand, real name and authored time guidance. After the existing explicit baseline they open the original practice directly, removing the artificial building wait and redundant overview. Guided recommendations retain their pathway review; Thought or Fact retains its required thought-entry step. The authored questions, numbers and required baseline gates are unchanged.

Rendered Home inspection also found that authored display styles overrode the host's hidden attributes: Journal/Premium appeared even when neither qualified. The source now honors hidden attributes, including hiding the whole section when no card qualifies. Approved illustrations, card geometry and equal widths are preserved.

Validation: 569 tests in 72 files, typecheck, lint and production build passed. Production browser scan passed eight host surfaces and all 20 entries without overflow/page errors. Deep PMR suite passed practice, paused alternative/return, optional note/error, refresh, completion, saved-content read/delete and Home return. Box at 320px verified explicit rating, direct original-practice start and refresh retaining its baseline. Mounted Home verified actual card culling and cross-tab removal after a recorded practice today. Standalone suite requires waiting for Good Map's actual start control rather than treating an early nonempty iframe body as ready; no practice code is altered for this harness timing fix.

Evidence: `/workspace/whole-app-review/pass-01-final/`, `/workspace/whole-app-review/box-chosen-baseline-320.png`, `/workspace/whole-app-review/home-earned-cards-390.png`; logs `/tmp/whole-pass01-{tests,types,lint,build,breadth,deep,standalone}.log`.

Pass 1 commit: `203b24a`.

## Pass 2 — practice before preparation, truthful Urge Surfing completion

Reviewed the cumulative eight host surfaces/all 20 entries again, with deeper inspection of original Urge setup, practice and completion. Preserved its original artwork, wave and six stages. An explicit external-cue start now opens the timed practice without mandatory preparation forms; guided rating/body-anchor preparation remains available. Quick completion places next-step controls before optional check-ins, notes and feedback, preserves unanswered scores, and reuses the existing optional takeaway store. End-early confirmation uses a native modal dialog. Library timing and short-start filter reflect the actual 30–60 second practice window without changing recommendation durations.

Early stops now carry actual completion fractions through shared history; repeat windows use cumulative planned/active time. Coarse position in the existing browser entry restores paused after refresh/Back without keeping anchor words, body locations or sensations. Confirmed check-ins retain their own question/scale; shared distress cannot answer urge intensity, and a missing starting urge rating cannot produce a delta. Optional saving remains separate, device-local, and deletable through the existing Return points system. The original guided route and unchanged/worse feedback remain available.

Validation: 576 tests in 72 files, typecheck, lint, production build and V3 verification passed. Production breadth scan passed eight host surfaces/all 20 entries. Deep production suite passed direct entry, exact paused refresh/Back/forward, alternative return, modal focus/Escape, independent rating, worse feedback, failed-save recovery, true partial history, saved note return/delete, a real 30-second elapsed wave with no new ratings or notes, and the full guided route with unchanged feedback/private-text exclusion/repeat reset. Rendered 150% text inspection found a clipped primary label; wrapping was corrected, rebuilt and verified on actual 320px start, native stop dialog and completion controls.

Evidence: `/tmp/whole-pass02-*.log`, `/workspace/whole-app-review/pass-02-before/`, `/workspace/whole-app-review/pass-02-final/`, and `qa/urge-practice-browser.py`. Entry scans do not imply every entire journey was independently replayed in this pass. PMR/Box/iframe depth is from pass 1; Urge Surfing depth is from pass 2.

## Pass 3 — a verified completion handoff with recovery

Reviewed the cumulative eight host surfaces and all 20 entry points, plus original Change the Scene practice/review, Gentle Tapping pause/alternative/stop/result, and Self-Compassion practice/care-without-words/native card. Production reproduction showed a genuine shared problem: a quota failure still closed the journey and returned Home with no notice and no saved history record.

The shared flow now waits for the verified existing session store before its original brand closing/next destination. A failed or unverified write retains the finished record and shows a practice-specific recovery surface: Retry saving history or Return Home without retrying. It never requires replaying the exercise. Retries consolidate concurrent taps and preserve the same ID, timestamps, real answers and measured partial attempt; retry delay does not become extra duration. A confirmed final goal answer, explicit skip and original finish timestamp survive refresh in the existing coarse navigation snapshot. Browser Back leaves the recovery state normally; forward/refresh retains the confirmed answer. Independently saved notes/cards remain in their own existing stores. Unreadable history is never replaced with an empty overwrite. No outcome, scale, question, matching or reward algorithm was changed.

Validation: 581 tests in 73 files passed; 45 affected transaction/navigation/completion tests were rerun after the final Back/Forward cleanup. Typecheck, lint, production build and V3 verification passed. Production breadth scan passed eight host surfaces/all 20 entries. Deep production suite passed thrown and silent write failure, repeat retry with identical ID/time/answers, exactly one saved record, explicit final rating and skip, error-state Back/Forward/refresh, corrupt-history preservation, 320px/150% text recovery and deliberate Home return. Original tapping retained its paused round, independent unchanged 0–10 answer and truthful stopped exit. Native Self-Compassion saved its actual selected line/action; the saved card survived a separate history failure and remained deletable. Notes likewise survived and remained readable/deletable.

Evidence: `qa/completion-save-browser.py`, `/tmp/whole-pass03-*.log`, `/workspace/whole-app-review/pass-03-before/` and `/workspace/whole-app-review/pass-03-final/`. The original screenshots and reproduction retain evidence of the silent failure; recovery screenshots show the actual implemented state. Deeper original-journey coverage rotates rather than asserting that every full journey was played this pass.

## Remaining work

Passes 1–3 are complete. Passes 4–10 have not started. No blocker. Native iOS and spoken VoiceOver verification are unavailable here; the separate hosting deep-link rewrite remains outside this patch. No push, merge or deployment.
