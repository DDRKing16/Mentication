# Unhook and Make Room: experiential redesign

Implemented locally on `codex/unhook-make-room-redesign`, based on published main `a3d2cadfd95b565e13d7e23912c35013e08a4a9f`. Neither this redesign nor its evidence has been pushed or deployed. Self-Compassion, shared host routing/catalogue/recommendations, CareFrame, the sound handoff, Dear gate and secondary Another way placement are unchanged.

The two practices now teach an action a person can repeat outside the app. Their own words, outside anchor and next step drive the screen. The requested improvement multipliers are ambitions; this work does not claim a measured quality multiplier or clinical benefit.

## Inspect the actual comparison

Before captures came from the full integrated Library journeys on the exact published baseline, using its production build. After captures came from the same Library entry through the final redesigned code, using the redesign's production build, with stage and loaded-font assertions. Screenshots are browser captures, not design mockups. The comparison images simply place those screenshots beside each other.

- [Unhook: before → framing → return](unhook-comparison.png)
- [Make Room: before → allowing → useful step](makeRoom-comparison.png)
- [Actual before screens](before-a3d2cad/)
- [Actual after screens, including 320 px and enlarged long inputs](after/)
- [Machine-readable journey results](after/browser-results.json)
- [Self-Compassion regression results](self-compassion-regression/browser-checks.txt)

The standard comparison uses a 390 × 844 viewport and the same thought/feeling and custom action:

| Practice | Exact personal words | Exact chosen action |
| --- | --- | --- |
| Unhook | I'll freeze when I speak. | Read the opening line of my notes. |
| Make Room | Worry about the conversation | Get a glass of water before the conversation. |

Both before and after journeys report **6 → 6**. The redesign does not manufacture score improvement. The new after journey additionally names a personal outside anchor; this is shown explicitly, not represented as an identical baseline input.

## What changed and why it should help

| Dimension | Observed weakness | Implemented change and practical reason | Concrete after evidence and limits |
| --- | --- | --- | --- |
| Visual craft | Unhook placed a prefix in a generic core. Make Room squeezed an ordinary 28-character feeling into a narrow blob, splitting “conversation” across fragments. | Use the existing ink/lavender and sage palette, serif typography and quiet surfaces. The thought is the main reading object; the chosen action becomes prominent when attention returns. The feeling receives the full available width and keeps its size. | Unhook `phrase`, `attention`, `pulled`; Make Room `allow`, `action` captures. Exact feeling and unchanged font size asserted across allowing/action. This is an inspected design improvement, not a user preference study. |
| Psychological practice | Unhook offered a noticing prefix and outside object without a concrete guided return to the chosen task. Make Room's amount controls changed the ring more clearly than the action to practise. | Unhook: choose predicting/judging/replaying/just a thought, actually try the frame, choose a useful step, attend to a real detail, repeat after getting pulled back. Make Room: orient outside first, choose to try a gentle untimed moment, let the named feeling be here, choose an ordinary action with it present. | Actual integrated journeys exercise the framing and rehook/return loop; the feeling remains verbatim in the next-step view. No truth debate, forced positive replacement, breathing requirement, intensity escalation or trauma recall. These UI sequences have not been clinically evaluated. |
| Personalization | The old next step was folded away; generic anchors could dominate the experience. | Exact notice stays separate from its framing so a schema cap cannot cut the original text. The next step drives the next screen; a named anchor is restored and shown. Literal “Read…”/“Listen…” actions receive appropriate attention cues, other wording receives a general cue. | Exact notice/action/anchor assertions through reload, Back and saved return; 300-character genuine core captures. Cue routing only interprets literal action verbs; it does not diagnose or analyze the thought. |
| Engagement | Changes in decorative state could be mistaken for having practised. | Useful two-interaction beats: pattern choice → reported attempt reveals direction; chosen step → outside anchor produces a concrete return cue; pulled back → brought back rehearses a reusable loop. For Make Room, anchor choice → gentle-moment choice reveals allowing guidance; reported attempt → chosen step shows feeling and action together. Quiet in-place feedback requires no dismiss tap. | `direction`, `returned`, `pulled`, `allow`, `action` screenshots. Opening a phase or choosing an option does not mark practice as tried. There are no rewards, timers or simulated mood shifts. Optional editing introduces its own clicks; this is not a claim that every possible click path follows a fixed two-click sequence. |
| Reading burden | Practice explanations and useful action competed with controls or sat in folded sections. | One task per phase; all instructions needed for the active practice are visible. Choose a suggested step or enter one. Do the allowing/attention moment hands-free, then report it. Secondary choices and stop controls use compact rows. | Full 320/390 journeys, no horizontal overflow, no extra confirmation/dismiss screens. Typical screens are compact; very long input and enlarged text intentionally scroll instead of truncating content. |
| Mobile/accessibility | Small geometric containers made personal words harder to read. | Native buttons with visible keyboard focus, one phase heading receiving focus, ≥44 px practice button targets, full-word accessible anchor labels, large-text/high-contrast support, reduced-motion handling. Easy stop/decline stays available. | Native Space/Enter activation, focus on resume and phase changes, target-size and no-overflow assertions, 320 px normal/enlarged 300-character captures with animations disabled. Chromium coverage does not substitute for VoiceOver or native iOS testing. |
| Reliability and honest feedback | A selected option, an opened allowing view and a completed everyday action must remain distinct. | Reuse the existing version-1 local draft codec, hook, ratings and saved-card infrastructure. Only explicit “I tried…” reports credit practice. Only explicit “I have done this step” marks the action done. Planned remains planned; skipped ratings remain null. | Before/after matched questions; 6 → 6 unchanged and blank ratings; repeated stopped/declined/done journeys; reload at every core phase; save/delete/draft failures and retry; saved return without duplicate completion; personal text excluded from session history. Synthetic storage failures are tested; real device storage exhaustion has not been reproduced. |

## Framework and wording

WHO's [Doing What Matters in Times of Stress overview](https://tdr.who.int/home/our-work/global-engagement/9789240003927) describes the broader evidence-informed, field-tested guide and its grounding, unhooking and making-room skills. WHO's [2025 explanation](https://www.who.int/thailand/news/feature-stories/detail/doing-what-matters-in-times-of-stress) describes noticing thoughts, grounding, acting on values and making room for feelings. These primary sources support the skill rationale; their evidence cannot be transferred to this app's new implementation.

All new interface prose, progression and CSS are original. No WHO exercise text, illustrations or audio were copied. Unhook remains distinct from Thought or Fact: it does not adjudicate the thought's truth. Make Room remains distinct from Urge Surfing: it has no urge-wave visualization or timed exposure progression. Self-Compassion is deliberately unchanged in this follow-up.

## Validation and integration

- Aggregate: **80 test files / 647 tests passed**; lint, type checking, production build and V3 recommendation verification passed. The production build retains its existing large-chunk advisory.
- Integrated browser: Unhook and Make Room at **320 and 390 px**, plus four genuine 320 px long-input normal/enlarged cases; zero uncaught page errors. The existing aggregate care verifier now runs Self-Compassion's original journey and delegates these two updated journeys to their own verifier.
- Self-Compassion: **320, 390 and 430 px** journeys passed with the new stylesheet also present; ratings, resume, alternatives, save/return/delete, stopping/repeat, keyboard, reduced motion, large text, high contrast and storage retries.
- Run with a production preview running: `CARE_PREVIEW_URL=http://localhost:5178 node scripts/verify-care-practices.cjs`. Use `npm run build` then `npm run preview -- --port 5178`; production preview also avoids Vite filesystem restrictions when dependencies are symlinked across worktrees. Playwright/Chromium are verification tooling, not new application dependencies. Run just the two redesigned practices with `scripts/verify-experiential-care.cjs`.
- Stable experience IDs and default exports remain `unhook` / `UnhookExperience` and `makeRoom` / `MakeRoomExperience`, accepting the same host props and using the same completion callbacks. **No registration or migration is required.**
- Scope: two experience wrappers, isolated `experiential-care/` components/styles, `experientialCare.js` and its tests, browser verification and this evidence. No shared application infrastructure edits.

Remaining validation: owner review of the actual screenshots/journeys, native iOS/VoiceOver testing, and real user usefulness testing. No blocker remains for local review. Publication is a separate owner decision.
