# Backup restore conflict protection

## Reproduced baseline

At `23e57825713d8c03532853356728d02dd5686f12`, an older backup record with the
same session ID replaces the current record, including later follow-up fields.
The ID survives, but those current fields do not. Other backed-up storage groups
(notes, plans, cards and preferences) also take the incoming value wholesale.
Synthetic data reproduced both outcomes. This is not evidence of a real person's
data loss.

## Restore policy

The default keeps current versions of matching session IDs and existing data
groups. It adds new session IDs and missing groups without a retention cap.
Dates do not decide precedence: old files and follow-up data do not have a
reliable common modification clock. Identical duplicate session records are
accepted; differing duplicates within either history are rejected rather than
silently discarded. Legacy string IDs, including empty IDs, remain readable.

The user may explicitly choose backup versions for conflicts after reviewing
counts. Session conflicts replace whole records, and other conflicts replace
whole stored groups, which may contain many notes or plans. These are not
field-level merges. A review pins the relevant current values; an observed change
requires a fresh review. The code checks each value again before writing.

Before replacement, the app verifies a local recovery copy of affected prior
values. Existing recovery copies are never silently evicted. If that copy cannot
be preserved, replacement is blocked. A copy is a separately exportable v1 backup,
not an atomic Undo: reimporting it still merges sessions and does not erase newly
added items. Copies can be removed only through an explicit user action; export
handoff cannot prove an external file was kept. Copies are excluded from ordinary
backups and imports, avoiding recursive archives. Full in-app data deletion removes
the on-device archive, not already exported files.

## Failure and privacy boundaries

Writes and removals are verified. A later failure attempts to roll back prior
writes, but does not overwrite a different concurrent edit. If not every change
can be verified or rolled back, the message says so and asks the user to retain
both the input file and recovery copies and reload/review. localStorage cannot
provide an atomic transaction across tabs; this is observed-change protection,
not a promise of cross-tab serializability.

Plus status, reminder state (including uncertain scheduling), and browser-check-in
ownership remain excluded in both directions. Recovery copies cannot import or
export those values. No real records, owner Mac or denied privacy worksheet were
used. No new service, analytics, dependency or sharing audience was introduced.

A successful restore reloads the existing Settings URL so mounted app pages do
not retain stale state. A best-effort one-time status receipt is separate from
restore verification. Share and download messages describe a handoff/request,
not a verified saved file; cancellation is explicit.

## Validation

Unit coverage exercises same-ID conflicts, legacy and malformed histories,
large history, non-session groups, defaults and explicit replacement, retained
recovery files, stale reviews, quota/read/verification failures, partial rollback,
concurrent edits, retries, excluded ownership and export handoff. Full-data-deletion
and privacy disclosure regressions cover the new local archive.

`scripts/backup-restore-smoke.browser.mjs` drives the real Settings file input,
review controls, confirmation/cancellation and reload with synthetic backups. It
is included in release CI's Chromium/WebKit native and missing-dialog-API modes.
All standard tests, lint, typecheck, production build and release checks must pass
on the exact candidate before publication. The CI includes unsigned iOS simulator
compilation, not physical iPhone or screen-reader acceptance. OS share-sheet/file
persistence on a real device is not established by synthetic browser checks.
