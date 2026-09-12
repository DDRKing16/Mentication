# Urge Surfing rebuild — Steps 11–20 route, data, and safety contract

## Step 11 — route and event contract

`urge.safety` is always the initial route. Only an explicit **No** to the suitability question opens `urge.name`; **Yes** and **Unsure** route to `urge.safetySupport`.

Core routes are `urge.name`, `urge.body`, `urge.anchor`, `urge.timer`, `urge.postRating`, and `urge.complete`.

Routes and critical events are reducer-owned. `NAVIGATE` cannot bypass the safety gate, `TIMER_STARTED` requires a No response, and `TIMER_ELAPSED` remains idempotent.

## Step 12 — local-only session schema

The in-memory session is schema version 2. It contains only route/status, safety answer, coarse category key, selected body/environment key, sensation keys, anchor text, selected window, timer timestamps, optional outcome, and explicit save permission.

It has no remote ID, account ID, audio blob, transcript, or provider field.

## Steps 13–14 — privacy and opt-in boundary

Raw urge wording, voice material, and detailed body notes are never part of a coarse learning record. `buildUrgeSurfLearningRecord` accepts only approved category/action/outcome keys and a normalised window/intensity value.

`savePreference` defaults to `false`. A later completion step may write a coarse local record only after a deliberate `SAVE_PREFERENCE_SET` event. The active draft remains local process state; it is not persisted by this step.

## Steps 15–17 — test contract

Focused tests cover valid intensity/category selection, single body region, sensations, bounded duration, timestamp timer restoration, idempotent timer completion, null post-rating, one extension, safe route transitions, and metadata exclusion.

## Steps 18–20 — safety gate contract

The direct question is: **“Could acting on this urge put you or someone else in immediate danger?”**

- **No** proceeds to Name the wave.
- **Yes or I’m not sure** stops the solo flow before any body, intensity, category, anchor, or timer capture. The immediate support view offers the app’s Australia-first crisis/support route and an exit.
- The gate is semantic, keyboard reachable, and contains no required free-text capture. The support route is a safety exit, not a failed completion.

## Verification evidence

- Focused reducer and privacy tests: 14 passing assertions in
  `urgeSurfSession.test.js` and `urgeSurfState.test.js`.
- Live route at 390 × 844: Library → Urge Surfing → Begin shows the direct
  safety question before the core flow.
- Live **No** route opens Name the wave. Live **Yes** route opens the safety
  exit; its immediate-support control routes to `/support`, where Australian
  emergency and crisis contacts are presented.
- `npm run lint`, `npm run build`, and `git diff --check` passed on 2026-09-09.

**Steps 11–20 status:** Complete.
