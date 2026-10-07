# Let’s get through this — one question per screen

The current-main Tara opening led with a tactical sidekick, a large character image and competing prepare/live actions. Within the flow, a generic heading often competed with another question, a coaching panel, edit links and optional disclosures. The pocket plan included usability and several notes; reflection/next-use/save actions shared a long screen. The user specifically rejected that hierarchy and asked for the difficult situation to lead.

This correction is local on `codex/get-through-one-question`, based on main `b4f406c9f3f638bba11d04bebb10df7c60274609`. The public ID, route, storage key and host callback contract are preserved. Shared catalogue/return labels are deliberately left to the integration owner; see rename-contract.json.

## Revised flow

The opening is **Let’s get through this**, a short description and **Get started**. It contains no Tara name/image/hero. A separate timing question offers before-the-situation or immediate support.

Preparation proceeds through one situation question, one difficulty question, one optional prediction field, then one first-move choice. Naming the real moment is an optional one-field dialog. The selected move has one prominent practise action and a subordinate skip link.

Practice remains substantive: an imagined starting cue, one response choice, then a concrete try-once screen. Only **I tried this** confirms trying. Recovery repeats that sequence with a contextual backup. Tara appears in small supporting cues, after the main action. Usability has its own optional question. The pocket plan retains the first move/backup and a clear **Use my plan** action; save/leave remains a text link.

Live support asks only what the user needs now. One chosen response opens contextual support or a separate pace decision. Returning to reflect does not infer participation. Reflection separates actual action, prediction result, optional observation and optional next-use decision. Saving a separate reflection is one explicit final preference; **Finish** is the sole primary action. The screen explains that the current draft already stays on the device.

Selecting a radio answer keeps the current question visible. The primary next button advances. Native radio keyboard behavior, selected state and a clear disabled-next state identify what to do. Required answers are visible; optional fields can be left blank. Long exact wording remains available through its full-wording disclosure, without a second required input.

## Before/after pixels

| View | Before | After |
| --- | --- | --- |
| Opening | [Character-led entry](before/01-entry-390-full.png) | [Situation-led product entry](after/01-entry-390-full.png) |
| First move | [Coach, selected move and competing actions](before/05-chosen-move-390-full.png) | [One choice question](after/06-tactic-390-full.png), then [one practice action](after/07-chosen-move-390-full.png) |
| Rehearsal | [Scene plus a second question and skip button](before/06-practice-way-in-390-full.png) | [One response question](after/08-practice-choice-390-full.png), then [one try confirmation](after/09-try-390-full.png) |
| Pocket plan | [Plan, usability and notes together](before/09-pocket-plan-390-full.png) | [Separate usability](after/12-usability-390-full.png) and [focused plan](after/13-pocket-plan-390-full.png) |
| Reflection | [Carry choice, Finish, save and editors](before/14-next-use-choice-390-full.png) | [One next-use question](after/19-next-step-390-full.png), then [one save preference](after/20-save-reflection-390-full.png) |

There are 60 actual before PNGs from b4f406c, 80 final full/viewport PNGs across 20 states at 390px and 320px/24px root text, and 10 actual compiled-host PNGs. Hashes/dimensions and synthetic fixture provenance accompany them. Representative before/final phone and compiled-host pixels were inspected locally. Final capture assertions check one h1, at most one answer group/textarea, one primary action, viewport reachability of that action and no horizontal overflow. Enlarged-text pixel review caught the inherited disabled-button opacity issue; the final rule explicitly makes the button opaque.

## Verified behavior

- 694 tests in 83 files; typecheck, lint and build pass. Existing build chunk warning remains.
- 40 browser scenarios pass: full 390px, 320px/150% text and 320×640 journeys; all five prediction results; immediate support; 24 v1/v2/v3 legacy version/phase cases; exact long words; plan-only without invented tries; keyboard/focus; quota failure/retry; unreadable records; failed/verified deletion; shared deletion signals; actual Back-to-entry/resume; failed explicit archive save blocking completion and successful retry.
- Two compiled actual host journeys pass. Save/leave creates no completed session; Finish produces one coarse session with nullable end-intensity and no private wording. Explicit save produces one separate reflection; opting out produces none. Revisit produces no duplicate. Page errors, HTTP/request failures and external requests are zero. Ordinary browser-aborted local home document/art/ambient loads are recorded separately.
- A missing prediction now displays **No prediction recorded**, with only untested/uncertain result choices. A built-in suggested worry is only an input placeholder until the user writes one; it is not silently stored as their prediction.
- The existing storage container/version remains. New bounded screen and pending-choice fields preserve the exact question after refresh. Legacy words, original difficulty comparisons and confirmed-try snapshots remain unchanged. Back changes view rather than private content; entry Resume restores an unfinished recovery beat or a deliberately kept unpractised plan.

## Limits and integration

Sequential questions introduce more screen transitions; this is an intentional tradeoff for reducing simultaneous decisions. Practice, prediction, observation, usability and next-use wording retain skip/blank routes where appropriate. At 320px/150% text, long option lists and wording require scrolling; the primary next action stays reachable. No claim is made that every answer fits one viewport, that effectiveness increased by a numeric multiplier, or that native iOS/screen-reader testing occurred.

No shared host, catalogue, ReturnPoints, recommendation, Dear 2100, sound-handoff or other intervention files were edited. The integration owner must apply the four-file shared rename contract, then verify the combined release. No correction upload, push, merge or deployment has occurred.
