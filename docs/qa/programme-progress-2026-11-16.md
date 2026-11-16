# Programme progress reliability, 16 November 2026

## Confirmed reproduction

At base `f8f542173854c85fedf16ce95f602926fa3cf999`, synthetic Box Breathing records with a selected `pathway` but an explicit empty `completed_pathway` and skipped/early-exit attempts incorrectly completed programme day 1 and opened day 2. Eight added evidence regressions failed against the original implementation. This is a synthetic reproduction, not evidence that a particular person's history was lost or changed.

## Evidence semantics

The earliest repository writer reviewed (`41e968cb7c225643498f9928bb2279148c3cb4c9`, September 12), plus sampled September 13/22 writers and the current ResetFlow, separates selected pathways from completion-filtered pathways and attempt records. No reviewed writer establishes pathway selection alone as completed practice.

Modern attempt records are authoritative: only `completed` terminals with meaningful progress count. An absent attempts field can use the explicit legacy `completed_pathway`; empty/malformed attempts do not fall back to a stale completion list. Goal ratings are not required. Meaningful partial Change Scene completions remain valid; skipped/zero-progress and early-exit attempts do not count.

## Changes

- Derive programme completion from that evidence, not selected pathways. Ignore invalid/future session dates and retain next-calendar-day unlocking, one session per programme day, and required practice order.
- Programme pages and Home use retained history, not the latest 200 sessions. Deliberately recent recommendation windows remain unchanged.
- Read programme metadata without replacing malformed data. Verify start/finish/leave writes, report failed or uncertain saves, and refresh on relevant lifecycle/storage events.
- Repeated Start preserves the existing start and metadata; an explicit Leave then Start still restarts. Retry reloads metadata even after an idempotent return, including a write that persisted but whose verification failed. Unresolved action errors disable day launch.
- Home does not present guessed completion when history cannot be checked. It derives corrected progress even when an old finished marker exists, without rewriting the saved session history.

## Validation scope

Local tests include skipped/exited/switched attempts, real completion, legacy/malformed/multi-practice evidence, meaningful partial completion, same-day gating, all-day completion, future/invalid dates, more than 200 newer records, unavailable/corrupt storage, quota/silent writes, uncertain verification, idempotent actions and event cleanup.

The browser release suite now covers programme detail/list/Home against synthetic device history; refresh and launch of the actual next practice; old finished metadata; corrupt-history recovery; failed and uncertain Start/Leave; next-day gating; completion-write failure and retry; and mobile overflow. It runs in Chromium and WebKit, with native dialog APIs and with those APIs unavailable. CI results for the exact candidate must be checked before merge.

No recommendation algorithm, clinical practice content, subscription audience, stored session migration, privacy worksheet, or owner Mac change is included. Browser emulation and an unsigned iOS simulator build do not establish physical-device or assistive-technology verification.
