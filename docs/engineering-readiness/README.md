# Engineering readiness, 9 November 2026

This release preserves approved Home candidate 33fdfe6080f5d6e9298e15cdc5402c96d6c47158 and adds security, persistence, loading and usability improvements. This source report does not itself certify deployment or a signed native archive.

## Implemented

- Capacitor core, iOS and CLI 8.5.1, including regenerated SwiftPM pin, patch GHSA-rvm3-566m-v7fv. An installed native app requires a rebuilt binary; web deployment alone does not patch it.
- Compatible Vite/Vitest and transitive security updates without new application libraries or services.
- Removed silent 500-session and 50-Restore-outcome caps. Verified storage writes/deletes and backup quota rollback preserve existing history. Previously trimmed records need an earlier backup to recover.
- Serialized daily reminder operations, verified queue/preferences, bounded confirmation polling and persistent uncertainty warnings after unresolved native additions. Further scheduling is blocked while uncertain; Off attempts cleanup without false confirmation or re-enabling. Device-specific uncertainty is excluded from both backup directions.
- Home 12-second loading recovery, retry with a fresh secure bridge ID, and direct practices/settings/urgent support routes. Existing opaque sandbox/source/token validation remains.
- Routes load on demand; direct Library/Profile entries do not mount hidden Home media. Visited tabs retain state.
- Older WebKit-compatible secure IDs/property/last-item APIs; shared Home/accessibility/wellbeing dialog fallback. The iOS support floor is unchanged.
- Removed the blanket library-source ESLint exclusion. Typechecking remains partial, not a complete TypeScript migration.
- Generated Home HTML is recreated from its editable source before dev, test and build instead of storing a multi-megabyte duplicate in Git. The production output is unchanged.
- CI includes lint, typecheck, tests, V3 verification, production build, high/critical dependency audit, native/version/size gates, Chromium/WebKit recovery checks and an unsigned iOS simulator build.

## Fresh combined checks

129 test files and 1,161 tests passed, including 28 reminder cases and backup/storage/compatibility regressions. Lint, typecheck, production build, V3 verification, native sync and diff checks passed.

Capacitor pin 8.5.1; largest JS chunk 469,992 bytes (153.42 kB gzip), versus baseline 743.42 kB (225.56 kB gzip). Public assets 186,301,196 bytes. These are bundle sizes, not device-performance measurements. Rebuilt Home matches the preserved approved product asset byte for byte.

Dependency audit: zero production findings; complete tree has six moderate tooling findings and no high/critical findings. No forced-major overrides.

## Required release evidence and limitations

Check the new CI jobs on the exact pushed commit before release sign-off. Local Chromium launch was blocked by socket restrictions; cloud-browser local-preview access was blocked by URL policy. No local interactive browser pass is claimed. Simulator checks do not replace physical-device notification delivery, audio interruptions, accessibility, signing, archive/privacy validation or App Store review.

Five pre-existing early-iOS native-dialog flows still require refactoring and interactive testing: Next Easiest Step pause, Tomorrow Parking leave-draft, Urge Surf end-early, Journey Options and Journey Takeaway. Full iOS 15.0–15.3 behavior is not certified for these pause/history/nested-dialog flows.

Reminder uncertainty deliberately has no automatic timer/snapshot reset because the plugin cannot prove native completion after an unconfirmed schedule. The warning directs affected users to turn off Mentication notifications in phone Settings. If marker storage fails, only the in-memory warning survives reliably. Mocked notification tests are not physical-device evidence.

See docs/qa/product-readiness-2026-11-09.md for product checks and manual QA.
