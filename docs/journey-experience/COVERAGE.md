# Journey inventory and launch checks

The original active set is 13 catalogue practices plus Dear 2100 and Foundations.
Four new approved builds bring the planned set to 19 after worker transfer and
registration; Tara is additionally pending its supplied contract and assets. Names/artwork remain owned by their established designs.

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
| SignalLock | Grounding worker's run/explicit feeling; optional cue note | One external steady detail; receiver pending |
| Tomorrow Parking Lot | Existing explicitly saved notes in Parking Lot | Rest without planning/recording |
| Night Channel | Optional listening/quiet preference note now or later | Quiet rest; no mandatory completion/reflection |
| Dear 2100 | Existing saved book/committed action | One kind practical action or a break |
| Foundations | Existing saved plan | One manageable part of today; receiver/key pending |
| Tapping | Worker-defined outcome; shared optional adjustment/cue | Hands at rest and neutral external detail |
| Self Compassion | Worker-defined outcome; optional care phrase/action | Ordinary act of care or rest without wording |
| Unhook from Thought | Worker-defined outcome; optional wording/next action | External detail or practical action without proving thought |
| Make Room for Feeling | Worker-defined outcome; optional boundary/support/action | External orientation or support, without inward attention |

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
  across alternatives; Vector Shift pauses; missing worker receivers report errors; cross-tab deletion disposes an old document before it can resurrect deleted state.
- Original all-package commands are required again after integration. New worker
  tests are not evidence that the combined 19-experience build has passed.

These checks do not claim every original internal draft survives arbitrary refresh.
They verify the shared changes and existing completion restoration. Native iOS and
VoiceOver require device testing; browser emulation is not native-device evidence.

## Concrete launch gaps observed

1. Transfer and combine completed worker patches, including grounding metadata and
   Foundations/SignalLock bridge receivers. Register and test all four new IDs.
2. Narration audit reports 68 of 92 catalogue lines ready and 24 missing. The current
   Change the Scene prompts lack bundled narration and truthfully show text-only
   when audio is requested. Generic catalogue audit misses do not establish that a
   separately bundled Good Map/Vector Shift soundtrack is absent. New worker audio
   needs its own inspection; no new narration was fabricated/generated here.
3. Test on an iPhone: safe-area controls, small screen, keyboard, Back gesture,
   interruption by background/lock/call, explicit resume and storage failure paths.
4. Run a small moderated trial with consenting volunteers before release. Use
   synthetic or voluntarily entered content; record no private thoughts by default.

## Practical moderated test plan (no recruitment or data transmission performed)

Use 5–8 volunteers with mixed familiarity and accessibility needs. Ask each to:
choose a starting practice from a plain-language need, explain the reason in their
own words, adapt a practice that does not suit them, return to their original
progress, optionally keep a takeaway, reopen it later and delete it. Include one
quiet/no-audio session and one interrupted session.

Observe time to start, mistaken navigation, whether pause/resume is understood,
whether a rating is mistaken for a measured clinical result, whether saved scope
and deletion are understood, and whether the takeaway is useful to that person.
Use a short debrief and anonymised issue counts. Do not record private content,
add analytics, contact volunteers, spend money or publish without separate approval.

Resolve blocking confusion or loss of work before release. Keep refinements limited
to observed navigation, wording, controls, save/delete and accessibility issues.
