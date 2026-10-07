# Tara guided redesign — baseline diagnosis

Initial comparison baseline: `e292234f998c34bf76fa32e8cd7485b8ad5d5563`. Final local implementation is based on latest main `a3d2cadfd95b565e13d7e23912c35013e08a4a9f`, worktree `/workspace/Mentication-tara-guided-final`, branch `codex/tara-guided-redesign-20261007-main`. No push, source upload, merge or deployment is authorized for this redesign.

Actual baseline: 14 rendered states at 390px and 320px with 24px root text were captured and visually inspected. Full/viewport PNGs and dimensions/hashes are in `baseline/`. They include entry, challenge, generated move, editor, rehearsal choice/confirmation, live, support, reflection and recap. All fixtures are synthetic; no real outcomes are implied. The existing art and palette have been retained for the next implementation.

## Specific weaknesses

- A challenge reveals an automatically chosen sentence. The other tactical choices sit behind an edit link, so meaningful strategy selection is secondary.
- Rehearsal has one imagined cue and one response choice. There is no practice of the next difficulty or recovery move; confirming practice jumps straight into live support.
- Tara's artwork appears with the question, but her authored guidance rarely makes a specific tactical distinction for the user's situation.
- Users cannot name their actual situation through the main flow, though the data model has a situation field. Generic categories consequently dominate headings and saved-return labels.
- Live actions remain generic across challenges. The backup plan is a broad worksheet under a disclosure instead of a rehearsed, chosen recovery action.
- Reflection preserves honest outcome choices, but “what to carry forward” is an empty optional editor. It does not help make an explicit keep/adjust/try-later decision from that outcome.
- At 320px/150% text, repeated large headings and two-column answer grids make short words wrap into tall cards. Example baseline full-page heights: live 1246px, reflection 1546px, rehearsal 1252px. These are layout observations, not an effectiveness score.
- Reliability is a valuable baseline: verified device storage, historical comparisons, explicit practice/completion and deletion semantics must survive.

## Proposed interaction

1. Character-led entry: prepare a plan or open immediate support.
2. Choose situation and challenge; these two actual choices reveal contextual tactical guidance.
3. Choose a believable first move, edit/name the moment if useful, then rehearse or keep the plan without practice.
4. Two authored practice beats: starting, then recovering when the difficulty returns. Each response choice reveals a concrete try-now action; explicit “I tried it” confirms practice, never selection alone. Skipping remains available.
5. Keep a pocket plan: first move and chosen backup, with optional self-reported usability. Save/leave or open live support deliberately.
6. Live: chosen move first, contextual support and explicit return. No inferred event participation.
7. Reflect: actual action and prediction result, separate from difficulty. Offer concrete editable keep/adjust/try-later options that are stored only on explicit selection. Preserve original wording/outcome.

## Qualitative comparison rubric

| Dimension | Observed baseline | Improvement to verify |
| --- | --- | --- |
| Visual craft | Consistent art/palette; repetitive panels and narrow choices | Distinct scene, tactic, practice and pocket-plan compositions; full-width mobile choices |
| Practice quality | One cue, one response, explicit practice confirmation | Starting and recovery beats with usable words/actions and explicit practice records |
| Personalization | Event/challenge; mostly default wording | Named moment, deliberately selected tactic, edited practice wording, chosen backup |
| Engagement | Choice reveals a static sentence | Decisions reveal actionable Tara guidance and a usable next beat; no reward theatre |
| Cognitive burden | Several optional editors; repeated content | One decision at a time, short cues, optional detail, clear primary action |
| Mobile/accessibility | No overflow; enlarged text creates tall split-column cards | Full-width choices, compact headings, retained text sizing, keyboard/focus/reduced-motion checks |
| Reliability | Verified drafts/recaps and explicit outcome semantics | Preserve those guarantees while adding bounded local practice state and legacy compatibility |

This rubric is a design assessment, not a validated clinical measure. No numeric multiplier or percentage improvement will be manufactured. Before/after evidence will distinguish implemented behavior, observed layout changes, subjective design judgement, and unresolved limits.
