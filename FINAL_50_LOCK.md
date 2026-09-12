# Mentication V1 — Locked Intervention Scope

Catalogue version: **2026-09-06-v1-core25**

Runtime status: **25 active interventions**

Composition: **17 flagships + 8 supporting interventions**

Source of truth: ` src/lib/final50Catalog.js`

V1 contains exactly 25 distinct interventions. Primary placement controls the
library organisation. Cross-routing can support another goal without creating
a duplicate intervention.

## Calm — 7

1. Cyclic Sighing & Extended Exhale — supporting
2. Box Breathing — flagship
3. Progressive Muscle Relaxation — flagship
4. Thought or Fact? — flagship
5. Solvable or Hypothetical Worry? — supporting
6. Urge Surfing — flagship
7. Then What? — flagship

## Lift — 7

8. Ignition Point — flagship
9. Countermove — flagship
10. Open Channel — flagship
11. Pulse Shift — flagship
12. Test the Prediction — flagship
13. Change the Scene — flagship
14. Self-Compassion Break — supporting

## Ground — 4

15. 5-4-3-2-1 Grounding — flagship
16. Reroute — flagship
17. Orienting Scan — supporting
18. Name What You’re Feeling — supporting

## Focus — 3

19. Next Easiest Step — flagship
20. Signal Lock — flagship
21. Friction Sweep — supporting

## Sleep — 4

22. Tomorrow Parking Lot — flagship
23. Night Channel — flagship
24. Awake-in-Bed Reset — supporting
25. Drop the Sleep Struggle — supporting

## Why these eight supporting interventions remain

- Cyclic Sighing & Extended Exhale provides a rapid, hold-free physiological option.
- Solvable or Hypothetical Worry? separates practical problem-solving from hypothetical worry.
- Self-Compassion Break provides a direct shame and self-criticism response.
- Orienting Scan provides low-load, eyes-open environmental grounding.
- Name What You’re Feeling provides emotion identification before regulation or action.
- Friction Sweep removes practical barriers before a focus attempt.
- Awake-in-Bed Reset covers wakefulness after sleep onset.
- Drop the Sleep Struggle reduces effort, monitoring and pressure around sleep.

## Deferred from V1

These remain in archived definitions for saved-session migration but are not
shown, recommended, explored or used by new situational pathways.

| Deferred intervention | V1 successor |
|---|---|
| Energy Ladder | Ignition Point |
| Nature Reset | Change the Scene |
| One Values Step | Ignition Point |
| One Focus Block | Signal Lock |
| WOOP | Next Easiest Step |
| Distraction Dump | Next Easiest Step |
| Warm and Heavy | Progressive Muscle Relaxation |

## Scope rules

- Variants and durations never count as separate interventions.
- The active catalogue must contain exactly 25 unique IDs.
- The 17 flagships and their approved names remain fixed for V1.
- Only these 25 may appear in recommendations, the library, search, direct
  launch, situational pathways or in-session switching.
- Retired IDs remain migration inputs only and resolve to a named V1 successor.
- Adding or replacing an intervention requires an explicit catalogue version
  change and updated automated count, uniqueness, pathway and migration tests.
- Archived definitions and audio files are retained until saved-session
  migration has been verified in production.

## Release check

Run:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
node scripts/verify-v3-algorithm.mjs
```
