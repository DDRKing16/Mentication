# Tested shared patch

Base commit: `e2369be`.
Review branch: `codex/need-takeaway-alternatives`.
Environment: Linux, Node/Vite/Vitest, system Chromium through Playwright.
Browser viewport: 390 × 844, mobile emulation, reduced motion.

| Check | Result |
| --- | --- |
| `npm test -- --run` | 54 files / 410 tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; existing large-chunk warning |
| `git diff --check` | Passed |
| Shared mobile flow script | Passed |
| Standalone mobile adapter script | Passed |
| `npm run narration:audit` | Failed coverage: 68/92 ready, 24 missing local clips |

Browser evidence covers explicit baseline confirmation, PMR pause and return,
focus containment/Escape, optional save, unsaved content exclusion, write/delete
failure truthfulness, final-check-in refresh, return/read/delete, native-record
reuse, Home entry bridges and browser Back. Standalone adapters keep their iframe
mounted; Vector Shift remains paused on return; missing worker receivers produce
an error. Cross-tab deletion prevents the old iframe's pagehide autosave from
recreating the removed SignalLock key.

This is evidence for the shared patch against the original base, not a passing
combined 19/20-experience build. Foundations and SignalLock worker internals and the
four new components are not available in this machine. Their transfer, registration,
matching tests and combined validation remain dependencies. Tara's contract is also
pending. Native iOS/VoiceOver and moderated user testing have not been run.

No remote push, merge or deployment was performed.
