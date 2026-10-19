# Compulsory threat education verification

Baseline: current origin/main `f122c01db677ed5903e61efcfc14b66033a614ca` (PRs 27–31 preserved). No application changes were needed. This branch adds reproducible browser checks and evidence only; nothing is merged or deployed.

## Findings

- Dear 2100 is the active threat-education journey. `src/pages/Dear2100.jsx` embeds the authored `public/dear2100-updated/` application, built from `design/dear2100/app.js`. Older `src/components/dear2100/` modules are not the active route.
- Stage 3 automatically shows the existing eight-node visual framework on its own screen, followed by the original illustrated, interactive four-phase threat teaching. The optional framework button on the phase screen is a revisit, not the only access to the visual. No visual was replaced.
- Four single-question multiple-choice screens test the actual phase content: noticing is not proof, body alarm is not proof, checking observable context, and choosing a response when safe enough. Explicit submission and at least 3/4 are required. Feedback explains each takeaway and offers a fresh retry.
- The gate applies to fear, practical and combined barriers and guards downstream stage and plan navigation. It preserves saved answers. Exits, grounding pause and the settings support link remain usable before passing.
- A failed or passed knowledge check does not itself create a committed plan, chapter, or observed outcome. Retrying updates the same four checkpoint IDs rather than inflating the count.

## Checks and evidence

- `npm test -- --run`: **110 files, 958 tests passed**, including score boundaries 0–4, invalid/incomplete data, explicit submission, required visual and navigation guards.
- `npm run typecheck`, `npm run lint`, `npm run build`, `node scripts/verify-v3-algorithm.mjs`: passed. Build retains its existing large-chunk warning.
- Existing `scripts/verify-single-step-release.cjs`: passed at 320×568 and 390×844, including the complete Dear 2100 practical route through plan drafting and Foundations regression.
- New `scripts/verify-threat-education.cjs`: passed at both sizes. Real UI entry, visual reload, grounding start/pause, support access, image decoding, double clicks, unanswered guard, browser Back, partial-quiz reload, 2/4 failure, fresh retry, 3/4 pass, save/exit/reopen, checkpoint deduplication and no false commitment/outcome.
- Existing `scripts/verify-two-action-checkpoints.cjs`: passed at both sizes; skipped/unconfirmed actions stay excluded and confirmed pairs survive Back, Forward, reload and repeated clicks.
- New `scripts/verify-threat-entry-routes.cjs`: Library and Restructure click-throughs, 12 synthetic saved-book guard combinations, and direct standalone document entry. Saved fixtures explicitly model interrupted/older progress; they are not claims of a completed journey.
- `focused/`, `routes/`, `baseline/` and `checkpoint-regression/` contain screenshots and machine-readable results. Screenshots are actual Chromium renders, not mockups. At 320px the authored visual and long feedback require vertical scrolling; no horizontal overflow was observed.

Reproduce with the existing app dependencies, Chromium at `/usr/bin/chromium`, and Playwright supplied outside the application dependencies:

```sh
npm run dev -- --host 0.0.0.0 --port 5181
NODE_PATH=/tmp/threat-browser/node_modules node scripts/verify-threat-education.cjs
NODE_PATH=/tmp/threat-browser/node_modules node scripts/verify-threat-entry-routes.cjs
NODE_PATH=/tmp/threat-browser/node_modules node scripts/verify-single-step-release.cjs
BASE_URL=http://localhost:5181 PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright node scripts/verify-two-action-checkpoints.cjs
```

All browser launches use `--mute-audio`; synthetic text only. No narration was generated. `ELEVENLABS_API_KEY` and `ELEVEN_API_KEY` were both absent from the process environment (values never read into output).

## Coverage limits

- Chromium mobile-sized viewports, not physical iPhones, native Capacitor or Safari/WebKit. No claim of App Store submission readiness or native audio/StoreKit validation.
- Home and post-Lift handoffs converge on `/dear-2100` by source inspection; conditional post-Lift eligibility/navigation is covered by existing unit tests, not a new full Happy Bump → Lift → Dear browser run. Library, Restructure and direct URLs were exercised in the browser.
- No external support site was opened; the link remains available with its existing URL. No production user data or hosting was touched.
- Local checks are not remote CI. GitHub CLI reported invalid authentication; remote PR/CI availability is reported separately in the handoff.
