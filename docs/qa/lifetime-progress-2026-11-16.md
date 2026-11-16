# Lifetime progress and bounded readers

## Reproduced on the previous source

Synthetic histories, not user incidents or evidence of lost storage:

- 501 completed sessions: capped palace reader showed 1,000 stones / 500 builder uses instead of 1,002 / 501.
- 200 consecutive days with three sessions each: newest-500 streak was 167 days instead of 200.
- 28 older completed sessions followed by 500 empty-attempt records: the capped display regressed from level 7 (56 stones) to level 1. Complete retained history remains level 7.

## Scope

`sessionStore.listAll()` uses the same rejecting, read-only verified-storage path as `list()`. It does not migrate, rewrite, repair, or delete any data. The default bounded `list()` API is unchanged.

Palace and Home now use full retained history. Home shares its complete lifecycle-refreshed history with the streak badge. Unknown/unreadable history is not shown as a zero palace. Palace keeps its request ordering, retry and unmount protections.

Profile uses complete history for the palace, saved-total and seven-day count, while its latest-100 patterns/chart remain explicitly labelled. Insights uses complete history for calendar-based stories and streaks, with its latest-100 detailed ratings summary explicitly labelled. Home recommendations still use 30 records; recommendation/scoring algorithms are not changed.

Streak calculation deduplicates local calendar days, retains the yesterday grace period, ignores invalid/future days and recovers historical longest runs. A longer legacy cached best is retained. Optional cache failures do not hide readable session results; one Intl formatter is reused per calculation.

## Other bounded readers audited, unchanged here

- My Plan 30 and ResetFlow 50: deliberately recent recommendation context.
- ResetFlow's weekly count also shares its latest-50 input and can undercount a very high-frequency week. Separate display follow-up.
- Home/Programmes 200: programme-start-relative completion can be missed after enough newer records. Separate programme-progress follow-up requiring programme-flow regression coverage.
- ChangeSceneFollowup 100: an old token-matched session can be missed; this is lookup rather than a lifetime summary. Separate token-lookup follow-up.
- ResetFlow 1,000: checks only whether the review-prompt threshold of three sessions was met; this limit does not change that threshold.

## Validation

Unit regressions cover >500 records, palace builders/stage continuity, unchanged scoring, no writes on reads, malformed/blocked storage, long/high-frequency streaks, historical longest, gaps, timezone/DST and cache failures. Browser checks seed synthetic histories only, verify Palace/Home/Profile/Insights, refresh, read failure and retry, and run in Chromium/WebKit alongside existing native-dialog and fallback-dialog suites. Physical-device and assistive-technology checks are not represented by these automated tests.
