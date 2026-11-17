# Reset completion weekly count

## Scope and semantics

ResetFlow's shared completion screen counts all saved session records dated since
its rolling seven-day cutoff. It does not count unique days, Palace stones, only
fully completed practices, or just a particular practice. This preserves the
existing product meaning, including partial/skipped sessions that were saved.

The recommendation/effectiveness input remains the newest 50 records. Only the
weekly summary opts in to all retained history. No history is migrated or removed.

At baseline `5b9bc907c5a307e5d66240226d4623b712f99790`, the weekly number was computed
once on mount from that bounded recommendation read. A synthetic first save left
the displayed value at zero (hidden); 75 recent records yielded 50. The fix reads
retained history through the existing change-aware hook and explicitly refreshes
after the verified save before the shared completion screen opens. It never adds
one optimistically.

## Failure handling

A rejected or unverified save retains the existing save-recovery screen. Retrying
uses the same transaction ID and the store's upsert, so an uncertain write cannot
create an extra record. Once saved, a count-read failure is separate from save
failure: it hides the number, explains that the reset was saved but the count is
unavailable, and offers a read-only retry. Auto-return pauses while the count is
unavailable. A newer failed read cannot leave an old success number visible.

## Regression checks

- `src/lib/resetWeekCount.test.js`: first/second saves, 75 recent records while
  recommendation reads stay at 50, seven-day boundary, multiple sessions per day,
  partial/skipped/completed semantics, failed and uncertain writes, stable retry,
  repeated completion and unreadable storage.
- `scripts/reset-week-smoke.browser.mjs`: actual shared ResetFlow controls from a
  legacy prebuilt Box Breathing/sleep entry via real baseline and sleep-timer
  controls; first/second save, same-mount Do it again,
  actual browser Back and Forward, duplicate completion, more than 50 recent
  records, failed/unverified saves, count-read failures and read-only recovery.
  Integrated into release CI's Chromium/WebKit native and legacy-dialog modes.
  Current ordinary single-practice finishes use direct completion or standalone
  routes and bypass this shared badge. The fixture covers an accepted legacy
  sleep-timer completion path, not current recommendation eligibility. The first
  CI run caught an incorrect Good Map fixture because it correctly redirected to
  its standalone journey; no product routing was changed to accommodate a test.
- Full package tests, lint, typecheck, build, V3 verification and engineering-release
  verification are required on the candidate. The release CI also builds an
  unsigned iOS simulator candidate.

An earlier Vector Shift Forward report is not evidence of a current issue. This
regression uses actual navigation against the current shared flow. Synthetic
browser checks are not physical-device or screen-reader validation. The owner’s
Mac and app-store privacy worksheet are outside this change.
