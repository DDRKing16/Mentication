# Journey inventory and launch checks

The original active set is 13 catalogue practices plus Dear 2100 and Foundations.
Four new approved builds bring the active set to 19 through the integrated catalogue and host dispatch. Tara is excluded pending its supplied contract and assets. Names/artwork remain owned by their established designs.

| Experience | Personal return point | Relevant alternative |
| --- | --- | --- |
| Box Breathing | Optional chosen pace/adjustment note | Natural breath plus still external object |
| Progressive Muscle Relaxation | Optional chosen area/release-only note | External neutral detail without tensing/scanning |
| Thought or Fact | Existing confirmed perspective/return phrase; readable/deletable in shared hub | Leave thought unresolved; notice a neutral detail |
| Urge Surfing | Optional safe next-action/support note; existing opt-in coarse feedback | Distance from trigger or chosen support |
| The Happy Bump | Optional chosen next-activity note; existing preferences retained | One small comfort or rest without a sequence |
| Change the Scene | Optional chosen setting/when-to-repeat note | One change within reach without moving |
| The Good Map | Existing map/actions reopened in native experience | Consider one worthwhile thing without building a map |
| 5-4-3-2-1 Grounding | Optional accessible-sense/detail note | One accessible sense without counts |
| Vector Shift | Optional attention cue for away from screen | Still object/familiar sound without targets |
| Next Easiest Step | Existing task/checked steps reopened natively | Identify one starting resource/question without doing task |
| Signal Lock | Actual run/explicit feeling; optional cue note | One external steady detail |
| Tomorrow Parking Lot | Existing explicitly saved notes in Parking Lot | Rest without planning/recording |
| Night Channel | Optional listening/quiet preference note now or later | Quiet rest; no mandatory completion/reflection |
| Dear 2100 | Existing saved book/committed action | One kind practical action or a break |
| Foundations | Existing saved plan | One manageable part of today |
| Gentle Tapping | Exact optional check-in; shared optional adjustment/cue | Hands at rest and neutral external detail |
| Self-Compassion | Existing explicitly saved compassionate response and care-action card | Ordinary act of care or rest without wording |
| Unhook from the Thought | Existing explicitly saved noticing phrase and next-action card | External detail or practical action without proving thought |
| Make Room for the Feeling | Existing explicitly saved phrase and chosen-action card | External orientation or support, without inward attention |

## Automated and browser coverage

- New storage tests cover blank rejection, exact entered content, update without
  duplicate automatic records, session-statistics separation, export/delete,
  quota failures, corrupt-data preservation and global app-data clearing.
- Bridge tests cover matching origin/source/request and missing receiver errors.
- `qa/journey-experience-browser.py`: mobile need entry, explicit baseline, PMR
  pause/alternative/explicit resume, native focus containment/Escape, optional save,
  blocked write/delete, host final-check-in refresh, return/read/delete, existing
  Thought or Fact records without copying, Home bridge routes and browser Back.
- `qa/journey-standalone-browser.py`: original standalone documents remain mounted
  across alternatives; Vector Shift pauses; Foundations and Signal Lock acknowledge secure pauses; cross-tab deletion disposes an old document before it can resurrect deleted state.

Combined check results and remaining device-testing limits are recorded in `TEST_RESULTS.md`. Narration coverage remains incomplete; no absent audio was fabricated. Native iOS/VoiceOver and moderated testing still require the device/participants.

## Practical participant test plan

Invite 5–8 participants using their own ordinary current need, with permission to stop, skip scales or use synthetic wording. Do not ask for trauma recall or assume a benefit. On a small phone, ask them to find a starting practice, explain why it was suggested, try a relevant alternative, return to their valid progress, and optionally save one real useful cue. After closing/reopening, ask them to find and delete it, then explain where it was stored. Include one keyboard or screen-reader user and one large-text/reduced-motion user.

Observe time to first useful action, missed controls, confusing question/scale wording, and whether the saved return point is understandable without explanation. Ask what felt unnecessary and what they would use again. Record usability observations only with consent; no private exercise text is needed. Success criteria: no dead routes or lost confirmed progress; no expectation of diagnosis or guaranteed improvement; optional saving and device-local deletion are understood. Treat feedback as usability evidence, not clinical effectiveness evidence.
