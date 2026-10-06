# Three care practices — substantial redesign

Base: integrated main `6ce94730424ba67bb27281fc846ce2bec2606949`. Local branch: `codex/care-practices-redesign`. No push, merge or deployment. Original evidence was captured from the actual integrated route before edits; redesign evidence comes from Library → ResetFlow → each actual experience.

## What the mobile review revealed

The original three experiences had the same worksheet structure: a decorative SVG above a rounded card, repeated textarea/suggestion/continue steps, and a practice paragraph quoting a generic sentence. The critical line, sticky thought or feeling rarely changed the visual practice. Long copy and disconnected controls weakened the sense of doing anything. The integrated “Another way” button also took space above the centerpiece.

## What changed

- **Self-Compassion:** a warm dark palette and a broad illuminated shelter around the person's own response. The chosen critical line is shown as words a cared-for person is hearing; suggestions are appropriate to the selected starter, and all wording is editable. The person offers a believable response to themselves, tries a gentle or steady tone with a concrete prompt, and can explicitly report trying the words. They then choose care as a pause, support or repair. Takeaway retains critical line → caring response → supportive action.
- **Unhook:** the exact thought begins in the foreground. One action adds the noticing frame; the next changes the thought's visual position and makes room for an external attention anchor. See/hear/support choices are compact; naming the anchor is optional and closes after the person reports noticing it. The thought remains visible while the anchor takes the center. Long thoughts stay intact in storage and the accessibility tree, with a full-thought disclosure alongside the abbreviated side card. Nothing disputes the thought or scores whether it has gone away.
- **Make Room:** the named feeling remains the same inside a field of space. The person first chooses an external anchor, then explicitly consents to trying room. They control “just a little” or “a little more” space and can return attention outward. The visual changes the surrounding space, not the feeling's size, colour or disappearance. Immediate decline/stop routes use external orientation; no intense exposure, trauma recall or forced breathing. The chosen action is something they can do with the feeling present.

These are distinct interaction components. Shared code now contains the frame, ratings, routine action/takeaway UI and persistence controller, rather than one worksheet with swapped labels. The original `CarePracticeExperience` export remains a compatibility dispatcher.

Every pair of enabled practice button activations updates a quiet inline milestone using the current rating, words, response, anchor or action status. Toolbar/alternative controls are excluded; they do not grant practice credit. Text editing and elapsed time do not count. No mandatory dismissal taps, timers, confetti or improvement claims. Motion is subtle and has an immediate static equivalent.

## Integration contract preserved

IDs and default export paths stay `selfCompassion` / `SelfCompassionExperience.jsx`, `unhook` / `UnhookExperience.jsx`, and `makeRoom` / `MakeRoomExperience.jsx`. Props remain `intervention`, `answers`, `onComplete`, `onAttemptEvent`, `onExit`, optional `persistence`. The callback shape and exact before/after questions, scale anchors and null skips are unchanged. `change` still means after minus before, or null. Planned actions remain separate from reported completed actions; attempts and completion metadata contain no private free text.

Storage keys remain `mentation.flagship.active.v1` (existing 24-hour draft) and `mentation.carePractices.saved.v1` (one separately saved card per ID). Schema remains `version: 1` for compatibility with the integrated Return points page. The normalizer adds optional `responseRead`, `responseTone`, `defusionStep`, `distance`, `anchorType`, `anchorText`, `anchorNoticed`, `allowance`, and `attentionFocused`, with neutral defaults for older saved cards/drafts. Old words, ratings and action statuses are retained. Successful deletes verify the resulting store; blocked verification cannot become a success message. Corrupt saved stores are preserved rather than overwritten. Exit explicitly flushes the current draft; Finish clears it and signals the existing host goal reassessment. Saved-card review closes through exit and does not create a completed practice.

Shared routing, catalogue, need-based entry, central return UI and alternatives source files were not edited. **Coordination finding:** current main's `NEED_ENTRIES` has no choices for these three, although the searchable Library and Return points routes correctly expose all three. The integration owner should add need mappings for harsh self-talk → `selfCompassion`, caught in a thought → `unhook`, and struggling with a feeling → `makeRoom` before publishing if those entries are intended.

## Clinical wording and limits

Technique selection retains the previously reviewed WHO and WA CCI rationale from `care-practices.md`. All new prose, SVG artwork and interaction sequences are original. This implementation makes no claim of measured therapeutic benefit or a literal “12×” improvement. A changed display represents the person's chosen way of attending; only an explicit rating supplies before/after evidence. The rating questions and anchors were not changed by the redesign.

## Evidence and rerunnable checks

`care-practices-redesign-evidence/index.html` presents the actual 390px before/after practice screens and new takeaways. No server or deployment is needed to open that evidence gallery.

With Vite running:

```sh
CARE_PREVIEW_URL=http://127.0.0.1:5174 node scripts/verify-care-practices.cjs
CARE_PREVIEW_URL=http://127.0.0.1:5174 node scripts/verify-care-practices-long-input.cjs
```

Playwright is external verification tooling, not a new product dependency. Chromium defaults to `/usr/bin/chromium`, overridable by `CHROMIUM_PATH` in the full suite. Evidence outputs default to `/tmp/care-redesign`; override with `CARE_EVIDENCE_DIR`.

- Nine integrated flows: all three at **320 / 390 / 430px**. Library entry, personal interactions, exact pre/post questions, zero/blank ratings, interruption/reload/resume, native dialog alternatives, save → host completion → Return points → reopen/delete, fresh repeat, explicit decline, keyboard Enter/Space, heading focus, OS reduced motion, large text, high contrast and horizontal overflow checks.
- At 390px: quota failure and retry for saving, blocked saved-card deletion and retry, blocked draft deletion, and failed draft persistence. Success messages require verified mutation.
- Six additional integrated long-input flows at 320/390px: 300-character inputs retained, complete return phrases, no horizontal overflow, and Unhook's thought/anchor bounds do not overlap. Full thought can be read.
- 25 targeted model/storage tests include backward-compatible restoration, real-input milestones, planned/done distinction, matched/blank ratings, corrupted-data preservation, blocked read/write/delete verification and host TTL expiry.

Final status: **60 test files / 473 tests passed**, typecheck, lint, production build and V3 verification passed. All nine integrated mobile flows and all six long-input flows passed. The final three 390px flows also passed after replacing font-dependent takeaway symbols with SVG icons. See the committed browser, long-text and aggregate result logs. Native iOS and screen-reader audio output were not run in this Linux environment. No shared need-entry change or publication is included in this local review commit.
