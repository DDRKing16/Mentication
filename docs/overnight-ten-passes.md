# Ten cumulative overnight implementation passes

Branch: `codex/overnight-ten-passes`, starting from main `e292234` plus the completed required Dear 2100 check `681952b`. No push, merge or deploy. Requested multipliers are aspirations, not measured quality or clinical claims. Each pass inspects the cumulative version, implements focused behavior, and validates it before continuing.

## Pass 1 — authored practice discovery

Inspected all current Library entries, need entry language, categories, durations and the active standalone Signal Lock/Dear journeys. Fixed the unlabeled Reset category. Search now finds existing need phrases, supported directions and authored acronyms, including “cannot get started”, without changing clinical matching. Self-paced maps/steps/reflection and Tara preparation are labeled honestly; Dear no longer promises a fixed duration or guaranteed committed action. Results have an announced count and an explicit clear-search/filter recovery action.

Validation: four data-contract tests passed; typecheck passed; actual 390px Library verified Reset, plain-language search, Tara time, no-results recovery and no overflow. No artwork, intervention naming or matching logic changed.

## Pass 2 — readable, findable saved work on mobile

Inspected Return points and native saved-card schemas. Reworked records into practice-colored cards using existing brand atmospheres, with real dates only when available. Added local search across actually displayed saved wording. Tara now shows its confirmed prediction, observation and reported result even when optional learning/action fields are blank; factual prediction results remain distinct from historical difficulty comparisons. Archive destinations are a separate disclosure and do not imply saved data.

Validation: three source-fidelity/search/date tests passed; typecheck passed; real 320×640 route verified native Tara recap with blank optional fields, word search/recovery, actual saved date and 150% text with long-word wrapping/no overflow. No storage schema or artwork changed.

## Pass 3 — clear selection feedback and honest unanswered ratings

Inspected need selection and Reset assessment controls. Choosing a need now focuses and brings its tailored preview into view, confirms the exact user choice, and provides a clear way back to the chosen option before launching. Generic unanswered baseline/end ratings show an em dash and “Choose a rating”, with an honest slider announcement, rather than looking like a selected 5. Explicit number/slider interaction and the existing Confirm/Skip semantics remain.

Validation: real 320px first-click preview/focus/change-without-launch flow passed; actual Library → Box Breathing baseline proved no selected number until explicit 5; seven existing baseline fidelity tests and typecheck passed. Inspection also found direct `/reset` without state leaves an empty setup; address it in pass 4.

## Pass 4 — reliable fresh and repeat entry

Inspected onboarding, setup fallback, and launch payloads from Home/My Plan/Library/need entry. Explicit onboarding can now complete for the open run even when storage denies access, avoiding a welcome redirect loop; deleting app data resets that memory. Bare `/reset` uses the existing guided choices. Retired prebuilt pathways recover into guided setup and no longer retain an unusable fixed pathway. Shared launch helpers retain the chosen practice/context while clearing old goal/distress ratings; repeat/suggested launches cannot answer today’s assessment from history.

Validation: 21 entry/recommendation/history tests passed; typecheck passed; actual browser verified bare setup, retired-pathway fallback and storage-denied onboarding reaching Home. Matching algorithms and existing immediate-reset behavior are unchanged.

## Remaining passes

5–10 pending; preserve this log when continuing.
