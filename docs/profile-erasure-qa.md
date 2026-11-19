# Profile erasure reliability

## Reproduced on baseline da2aadbe

Synthetic storage only. The actual RegulationProfile confirmation handler was
invoked using a local component hook harness. With
`mentation.reminders.uncertain.v1=1`, `disableDailyReminder()` rejected before
any erasure: the synthetic session and Journal note remained. The harness
observed the generic deletion error and no navigation.

Separate failing-before/fixed-after storage tests reproduced omitted app-owned
metadata and the first failed removal preventing later keys from being erased.

## Correction

- Explicitly confirmed in-app erasure runs immediately, independently of native
  daily-reminder cleanup. Pending/failing cleanup cannot hold private notes hostage.
- Cleanup cancels only daily reminder IDs. It never restores an old schedule,
  requests permission or opts in. Queued/in-flight older changes cannot recreate
  deleted preferences. A persistent one-bit pending marker and the existing
  uncertainty marker survive erasure; an old uncertainty latch is not cleared by
  a single successful cancellation snapshot. Both markers are excluded from backups.
- Success stays visible with any separate reminder warning. Retrying cleanup
  never repeats erasure. Settings also offers cleanup retry after reload.
- Local removal attempts every identifiable owned key in both stores, verifies
  removals and reports partial/uncertain failure. Unrelated storage and opaque
  web-check-in cancellation ownership remain intact.
- Exact app metadata keys are included without widening to all `mentication.*`.
  Vector Shift's session-only draft prefix is included. Clearing the local Plus
  cache does not cancel StoreKit purchases or delete externally saved files.
- Existing Tara cancellation observers still receive verified data-change events.

## Checks

- Component handler: cancelled confirmation, actual durable-uncertainty path,
  hanging cleanup, partial removal and retry, independent cleanup retry and
  repeated/stale completion clicks.
- Reminder native API mocks: success, pending bridge, rejection, unchanged old
  uncertainty, reload, blocked storage, owned IDs and queued/in-flight races.
- Storage: exact metadata, session drafts, unrelated keys, cancellation markers,
  silent removal and read failures, retry, and before-restore archive deletion.
- Release browser suite includes Profile at a 390px mobile viewport in Chromium
  and WebKit, both with and without native dialog APIs. It uses isolated synthetic
  browser storage, never a live user profile. Covers Cancel, deletion despite
  durable uncertainty, metadata, retry, reload/Settings, partial removal and Back.
- Full established validation remains required on the exact PR candidate, including
  blocking high-severity audit, all other browser regressions and unsigned iOS
  simulator build. Consult the PR checks for the final run rather than assuming
  success from this checklist.

## Limits

Browser tests are not physical-device verification. Actual iPhone notification
queues, OS notification settings and screen-reader announcements require device
QA. If the native bridge never settles, cleanup remains unconfirmed and the
warning directs the person to disable Mentication notifications in phone Settings.
Storage that refuses writes may prevent durable warning persistence; erasure is
still attempted and the current screen retains the warning. Previously saved
files outside the app and purchases are intentionally unaffected.
