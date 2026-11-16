# Change the Scene handoff reliability, 16 November 2026

## Reproduction

Base: `327dc2abc55a741a9855f4d955bba2465072e8cd`.

With `randomUUID` absent and `getRandomValues` present, evaluating the existing component's token-generation expression produced a `scene-<timestamp>` token. Passing each of its three real destination formats (Happy Bump, Dear 2100 and different mechanism) through `resetCompletionSnapshot` dropped both the token and destination. This reproduces the checkpoint/refresh incompatibility synthetically, not a physical-device incident. The uninterrupted in-memory path can retain the old destination.

Separately, a synthetic saved Change the Scene session behind 105 newer records was absent from the previous newest-100 lookup. The data itself remained retained.

## Narrow fixes

- Generate a secure UUID only when an onward practice is chosen, using the existing `createSecureId`. Its fallback uses Web Crypto random bytes with UUID version/variant bits; it throws when secure randomness is unavailable or fails. No timestamp or weak-random token fallback was added.
- Require a valid generated UUID and a known destination. Retain the token across Finish retries. Secure-generation failure is reported before clearing the practice draft, emitting completion or navigating; confirmed choices remain available for retry.
- Keep the existing final-check-in privacy allowlist unchanged. Private text, arbitrary destinations, extra query parameters and weak tokens remain rejected.
- Exact follow-up lookup now reads all retained sessions, while still requiring the matching token and a real Change the Scene pathway. Already-saved legacy tokens remain exact-match readable; this does not relax checkpoint validation. Read errors still show the existing retry UI and do not replace history.

## Validation

Unit regressions exercise all three generated destinations without `randomUUID`, native generation/reuse, absent or throwing secure-random providers, invalid IDs/targets, checkpoint privacy rejection, retained history beyond 100, exact matching and corrupt/blocked storage recovery. Existing eligibility and Dear 2100 prerequisite tests remain unchanged.

The browser suite enters Change the Scene through the actual Library and baseline controls, confirms its six actions, chooses every follow-up and checks actual token generation, both uninterrupted and refreshed final check-ins, one saved completion and onward suitability. It also checks older-than-100 lookups, corrupted-history retry, phone overflow, and missing/throwing secure-random failure plus recovery for each destination. The suite runs under Chromium/WebKit and native/missing-dialog modes. Exact-candidate CI results are required before publication.

No recommendation or clinical-content changes, data migration, privacy worksheet edits, sharing changes or owner Mac operations are included. Browser tests and unsigned simulator compilation are not physical iPhone or assistive-technology verification.
