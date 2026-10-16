# Care practice refinements

Base: `37672f6593909526bf798bb1cdb0be25747ac323`. Branch: `codex/care-practice-refinements`.

The changes run through `care-practices/SingleQuestionCare.jsx`, the component used by the application host. Obsolete experiential-care wrappers were not edited.

## Behavior

- **Unhook:** choosing or privately holding a thought opens the neutral noticing phrase directly. Pattern naming is optional. A chosen action supplies its contextual attention cue through `actionAttention`; choosing/naming an alternate anchor remains optional. A reported return opens action status directly, with retry available there. Older `return-next` drafts resolve to status. Generated cues are not counted as user choices, and returning attention does not invent a phrase attempt or a completed action.
- **Make Room:** selecting an outside anchor and reporting that a detail was noticed are separate. Only then is the person asked whether a gentle moment with a tolerable feeling is workable. Stop clears consent; browser Back/Forward and refresh cannot bypass the new consent choice. Staying with the room, ending, and considering re-entry remain available. The stopped report is retained in the draft/card and outcome.
- **Self-Compassion:** harsh and custom lines receive acknowledgement and kindness without assuming a mistake or responsibility. Repair is an optional action. Choosing caring words, attempting to say them, and planning/doing/declining a supportive action remain separate. Wordless care remains available.
- **Checkpoints:** every two distinct confirmations reveal the actual pair with a short connection. Anchor selection is not anchor observation; a generated phrase is not an additional choice; retry does not inflate the event count. No checkpoint asserts relief. Blank, unchanged and worse ratings retain their existing interpretation.
- **Long text:** actual baseline screenshots exposed overlapping thought/attention text and clipped feeling text. Focused-flow layouts now grow with the text rather than positioning those labels over it. Personal words are not shortened to make the illustration fit.

## Primary-source rationale

[WHO's *Doing What Matters in Times of Stress* publication](https://www.who.int/publications/i/item/9789240003927) and its [primary WHO overview](https://www.who.int/thailand/news/feature-stories/detail/doing-what-matters-in-times-of-stress) identify unhooking, acting on values, making room and kindness as stress-management skills. This supports the sequence from noticing to engagement with a chosen action. The explicit observation/consent controls, tolerable scope, external anchor, and stop/re-entry behavior are product safeguards; they are not claims that this interface is a validated treatment. The WHO PDF download returned HTTP 403 here, so this review used the accessible WHO publication/overview, not a claimed fresh full-PDF review.

[Kristin Neff's *Self-Compassion Break*](https://self-compassion.org/exercises/exercise-2-self-compassion-break/) combines acknowledging difficulty, common humanity and kindness, and invites personally fitting words. This supports replacing assumed fault with believable care. The implementation uses original interface wording and does not reproduce the exercise, require touch, or promise emotional improvement.

## Evidence

Baseline captures in [before](before/) are from the exact base commit. The browser inspected 320px and 390px widths, reduced motion, keyboard activation and 300-character unbroken text with enlarged type at 640px height. [Baseline results](before/browser-results.json).

The production browser script is [verify-care-refinements.cjs](../../../scripts/verify-care-refinements.cjs). It checks complete journeys at both widths, keyboard activation, exact draft restoration, Back/edit, stop and renewed consent, contextual/alternate attention cues, retries, unchanged/blank/worse outcomes, wordless/untried paths, planned/done/not-now action status, saved cards and return points, synthetic storage failures, repeat/delete, privacy of session history, and duplicate Finish prevention. It also checks long text for width overflow, overlap and clipping, plus legacy draft migration. [Production results](after/browser-results.json). Targeted response/action editing and stop/re-entry checks are in [verify-care-refinement-edits.cjs](../../../scripts/verify-care-refinement-edits.cjs), with [results](after/edit-results.json).

Selected comparisons:

| Change | Before | After |
|---|---|---|
| Direct noticing attempt | [Required pattern screen](before/unhook-pattern-320.png) | [Phrase attempt](after/unhook-frame-320.png) |
| Contextual attention | [Extra continuation](before/unhook-return-next-320.png) | [Action cue](after/unhook-return-320.png), [status/retry](after/unhook-status-320.png) |
| Observed anchor and consent | [Combined instruction](before/makeRoom-outside-320.png) | [Observation](after/makeRoom-outside-320.png), [consent](after/makeRoom-room-ready-320.png) |
| Acknowledgement without fault | [Assumed mistake/responsibility](before/selfCompassion-response-390.png) | [Care suggestions](after/selfCompassion-response-390.png) |
| Long text | [Overlapping thought/attention](before/unhook-long-enlarged-320.png) | [Full text layout](after/unhook-long-enlarged-320.png) |

All browser words are synthetic. Playwright is installed as temporary environment tooling; no app dependency was added. Native iOS/device behavior was not tested here. Merge and deployment remain with the parent/owner.

## Final validation

| Check | Result |
|---|---|
| `npm test -- --run` | 109 files, 953 tests passed |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; Vite emitted a bundle-size advisory |
| `node scripts/verify-v3-algorithm.mjs` | Passed |
| Production browser matrix | 15 cases passed, no page errors |
| Targeted edit/re-entry checks | 3 cases passed |
| `git diff --check` | Passed |

The initial browser runs exposed a route-transition timing race in the test harness and the visual defects described above. The final production matrix was rerun to completion after the fixes; `completed: true` is recorded in its JSON report.
