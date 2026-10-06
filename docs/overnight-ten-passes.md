# Ten cumulative overnight implementation passes

Branch: `codex/overnight-ten-passes`, starting from main `e292234` plus the completed required Dear 2100 check `681952b`. No push, merge or deploy. Requested multipliers are aspirations, not measured quality or clinical claims. Each pass inspects the cumulative version, implements focused behavior, and validates it before continuing.

## Pass 1 — authored practice discovery

Inspected all current Library entries, need entry language, categories, durations and the active standalone Signal Lock/Dear journeys. Fixed the unlabeled Reset category. Search now finds existing need phrases, supported directions and authored acronyms, including “cannot get started”, without changing clinical matching. Self-paced maps/steps/reflection and Tara preparation are labeled honestly; Dear no longer promises a fixed duration or guaranteed committed action. Results have an announced count and an explicit clear-search/filter recovery action.

Validation: four data-contract tests passed; typecheck passed; actual 390px Library verified Reset, plain-language search, Tara time, no-results recovery and no overflow. No artwork, intervention naming or matching logic changed.

## Remaining passes

2–10 pending; preserve this log when continuing.
