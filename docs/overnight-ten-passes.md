# Ten cumulative overnight implementation passes

Branch: `codex/overnight-ten-passes`, starting from main `e292234` plus the completed required Dear 2100 check `681952b`. No push, merge or deploy. Requested multipliers are aspirations, not measured quality or clinical claims. Each pass inspects the cumulative version, implements focused behavior, and validates it before continuing.

## Pass 1 — authored practice discovery

Inspected all current Library entries, need entry language, categories, durations and the active standalone Signal Lock/Dear journeys. Fixed the unlabeled Reset category. Search now finds existing need phrases, supported directions and authored acronyms, including “cannot get started”, without changing clinical matching. Self-paced maps/steps/reflection and Tara preparation are labeled honestly; Dear no longer promises a fixed duration or guaranteed committed action. Results have an announced count and an explicit clear-search/filter recovery action.

Validation: four data-contract tests passed; typecheck passed; actual 390px Library verified Reset, plain-language search, Tara time, no-results recovery and no overflow. No artwork, intervention naming or matching logic changed.

## Pass 2 — readable, findable saved work on mobile

Inspected Return points and native saved-card schemas. Reworked records into practice-colored cards using existing brand atmospheres, with real dates only when available. Added local search across actually displayed saved wording. Tara now shows its confirmed prediction, observation and reported result even when optional learning/action fields are blank; factual prediction results remain distinct from historical difficulty comparisons. Archive destinations are a separate disclosure and do not imply saved data.

Validation: three source-fidelity/search/date tests passed; typecheck passed; real 320×640 route verified native Tara recap with blank optional fields, word search/recovery, actual saved date and 150% text with long-word wrapping/no overflow. No storage schema or artwork changed.

## Remaining passes

3–10 pending; preserve this log when continuing.
