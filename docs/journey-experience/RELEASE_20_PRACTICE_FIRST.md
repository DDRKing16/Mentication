# Practice-first integration checkpoint

Local branch `codex/integrated-release-20` preserves the 20-journey baseline `db5303e85cb7f240f71404eb4729b7d8c88ee0ad`.

Integrated source deltas:
- Tara: `864ae77`, `4da45b8`, `680b174177c9759ba873eef6641ac14a61495464`, beyond previously integrated `0ca1bd4`.
- Tapping: `24c31e1`, `9be51d9`, `9a519f69918e8db2154cb339eb56a6795f163c6e`, beyond previously integrated `0793acca`; parent approved the all-nine contact sheet and 320px rhythm view.
- Care: `26864a7`, `479c9d92add0708e61843388cd0a6dae81f3c51c`, beyond previously integrated `6aa8266`.

Shared routing, registration, saved recaps, export and deletion remain integrated. Tara's factual `predictionResult` is strictly allowlisted independently of its historical `predictionComparison`. Private wording remains excluded from host session outcomes. Global deletion clears mounted draft state and private back-history snapshots. The shared alternative opens from the compact footer, avoiding nested modal focus traps.

Validation on the combined checkout:
- 64 test files / 531 tests passed, including five new factual-result privacy/independence cases and preserved historical difficulty cases.
- Typecheck, lint, production build, V3 algorithm verification and diff whitespace check passed.
- Tara component regression: 20 scenarios passed, including legacy records, all factual results, quota/delete errors, reduced motion, 320px enlarged text, keyboard dialogs, back/refresh and deletion without resurrection.
- Actual production app routes: five factual-result flows passed at 320/390px; need entry, custom wording, alternative return, interrupted refresh, explicit event status, optional recap save/revisit/delete, private-text exclusion, no duplicate completion and mounted cross-tab deletion passed.
- Care actual production routes: all nine flows passed at 320/390/430px, including save/return/delete, ratings, keyboard, resume, alternatives and failure/retry cases.
- Care design gate on production: three ordinary and six genuine long/enlarged practice cores passed, with full wording retained and keyboard-reachable action/safety controls.
- Shared production mobile journey regression passed.

Evidence logs are `/tmp/release20-final-*`; genuine care gate captures and results are `/tmp/release20-final-care-gate`. Failed obsolete long-input script targets superseded labels; the worker's corrected genuine-core gate above is the current executable verification. A dev-server run was interrupted by HMR during integration; all nine production care flows subsequently passed.

Final combined checks passed after tapping integration: 531 tests, typecheck, lint, build and V3 verification; all 18 mobile point/phase/contact cases plus delayed/error image cases; cue cancellation, independent optional sound/touch, spacious/background pacing, mobile outcome journeys and storage resilience; three full production integrated tapping journeys at 320/390/430px with all nine automatic points, pause/resume, repeat, alternatives and browser restart paused. Actual production Tara and shared mobile journey regressions passed again. Logs and captures are `/tmp/release20-combined-*`.

The parent approved publication of the complete five-experience batch to Chat-GPT/main. Render remains parent-owned. Direct-route hosting rewrite remains a separate dashboard issue; no router/config workaround added. Native iOS hardware and spoken screen-reader output are not verified in this environment.
