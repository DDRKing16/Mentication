# Validation — 2026-10-07

Environment: isolated `/workspace/mentication-web-push` worktree, Node 24.19.0.
Reused the existing workspace node_modules for checks; no package installed.

| Check | Result |
| --- | --- |
| `npm test -- --run` | PASS — 99 test files, 839 tests |
| New web tests | 15 tests across four files, included above |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS (no known-error exemption needed) |
| `npm run build` | PASS — existing large-chunk warning remains |
| `git diff --check` | PASS |
| Original `/workspace/Mentication` worktree | Clean, unchanged |
| Remote main verification | `fe6d76f9925bdacf5e16ae73986b10252d4ebebd` |

New tests cover durable restart progress, no duplicate retry, cancellation,
completion, replacement, bounded/stale sends, expired subscription handling,
strict payload allowlisting, endpoint restrictions, capability ownership and CORS,
offline cancellation retention, consent/install/configuration gates, cold and
open-window notification clicks, stale push suppression and generic notification
content. Client transport test proves local draft ID and extra plan fields do not
appear in requests. Server tests use an injected sender, never a real provider.

No live API, Web Push encryption dependency, browser push subscription, Home Screen
installation, native notification route, or real-device background delivery was
created/tested. The new setup component was server-rendered in tests; it is not
mounted in the live app. Those release gates are listed in README.md.
