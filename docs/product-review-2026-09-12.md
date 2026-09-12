# Mentication product review — 12 September 2026

Review of `main` at `dab9ad99`. Goal — world-class help plus a path to millions in revenue.

## What is already strong

- A real product, not a mood-tracker wrapper. 25 mechanism-led interventions with specialist players for Box Breathing, Grounding and PMR.
- Elite Intervention Standard is better than most commercial wellness design systems.
- Local-first privacy is a genuine differentiator against Wysa / Headspace / chatbot apps.
- Recommendation v3, situational pathways, captions, reduced motion, crisis page and on-device deletion already exist.
- Capacitor iOS project and App Store notes are present.

This is closer to a serious clinical-adjacent player than to a content library.

## What is blocking help

1. **Crisis copy launched a reset.** On `main`, Onboarding "I need help right now" used destructive styling but routed to `/reset`. A person in danger must get numbers first. Fixed in this branch — the button now opens `/support`, with a separate calming-reset action.
2. **Welcome is disconnected.** `src/pages/Welcome.jsx` still writes `haven_onboarded` and is not in `src/App.jsx` routes. First-run quality is therefore accidental.
3. **Time-to-mechanism is uneven.** Flagships that still open with extra framing lose the ten-second contract in `docs/elite-intervention-standard.md`.
4. **Insights can overclaim.** Effectiveness copy that implies "% effectiveness" from sparse on-device ratings will erode trust. Keep wording at "based on what you chose and rated".

## What is blocking revenue

Shipping, not features.

- `package.json` is still `0.0.0`.
- App Store Connect materials (support URL, public privacy URL, screenshots, categories, review notes) are still outside the repo.
- There is no IAP because V1 is correctly free. That is right. Millions require a later StoreKit subscription around programs, not a lock on the 25 tools.
- Open PR #2 (`copilot/make-mentication-premium`) is a 800+ file sweep including `dist/` deletions. Treat it as a quarry, not as the release branch. Cherry-pick onboarding/crisis/export work after status is green.

## Do not do next

- Add intervention 26.
- Add an AI therapist.
- Add streaks or shame.
- Put Stripe inside the iOS binary.
- Merge PR #2 wholesale because it says "premium".

## Ship order

1. Land this safety routing fix.
2. Finish a first-run path that is Mentication-branded and reaches a completed reset.
3. Cut an App Store build of the free V1.
4. Design one paid 14-day program (rumination or sleep-struggle) as IAP after the free app is live.

See `docs/revenue-path.md`.
