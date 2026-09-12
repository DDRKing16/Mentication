# Recommendation Engine V2

## Decision pipeline

1. Collect the current entry context, including direction, subtype, intensity band, whereFelt, time, location, and explicit safety preferences.
2. Run a hard eligibility gate that rejects interventions violating the user’s constraints: no breathing, eyes open, no audio, discreet mode, movement restrictions, location/private-environment rules, resource requirements, remaining-time budget, and automatic safety eligibility.
3. If too few candidates remain, narrow to the safe subset and then return the best available fallback. If no valid intervention exists, show a calm, specific message asking the user to update a preference.
4. Score the remaining interventions against the current state, mechanism balance, target channel, intensity fit, recency, and prior effectiveness.
5. Build an initial pathway from the top-ranked eligible candidates while avoiding duplicates of mechanism and preserving total duration within budget.
6. Run the chosen practice. Record each attempt with a structured outcome, exit reason, and coarse context key.
7. After the pulse check, adapt based on the user’s response and re-rank remaining candidates before continuing.
8. Save the actual completed pathway separately from the originally planned pathway for auditing and learning.

## Context fields

The engine uses a compact context summary rather than a large one-off state object:

- direction
- subtype
- intensity
- whereFelt
- location
- timeMin / remainingTime
- audio preference
- movement preference
- discreet / eyesOpen / noBreathing / noAudio
- major preference mode

This keeps the model deterministic and testable without producing sparse combinations that cause unstable recommendations.

## Safety constraints

The hard eligibility layer never violates the user’s explicit limits:

- noBreathing prevents breathing interventions
- eyesOpen excludes closed-eye practices
- noAudio and audio=no block required-audio options
- discreet mode removes loud or highly visible practices
- movement restrictions prevent full-body options that are not allowed
- work/public location rejects private-environment interventions
- requiredResources must be available
- time budgets must fit within the remaining session duration, with a small 30-second rounding tolerance
- automaticEligible and recommendationEligible are enforced where relevant

The engine always prefers a smaller safe candidate set over silently ignoring an explicit preference.

## Attempt and reward model

Every attempt records:

- intervention_id
- mechanism
- recommended_rank
- started_at / ended_at
- completed_percentage
- response (better, same, worse, not_answered)
- exit_reason (completed, skipped, not_helping, switched, exited)
- switch_preference when relevant
- coarse context key

The pulse response is treated as the primary effectiveness signal. Completion and willingness to reuse are tracked separately as acceptability signals rather than symptom change. This avoids incorrectly crediting an entire multi-step pathway to every intervention equally.

## Confidence-weighted learning

The model keeps a cold-start prior from the intervention metadata and then applies gradual, Bayesian-style shrinkage as evidence accumulates. Reward signals are weighted by recency with an approximate 45-day half-life, and dislikes decay similarly over time so old rejections do not permanently bury a valid intervention.

Priority ordering is:

1. Same intervention in a similar context
2. Same mechanism in a similar context
3. Intervention across contexts
4. Mechanism overall
5. Clinical metadata prior

Recommendation learning uses device-local session history. No account or remote session database is required.

## Exploration limits

Exploration is intentionally conservative and only triggers when the model has enough distinct, comparable candidates and the risk is low.

- top three eligible candidates only
- no exploration in Immediate mode
- no exploration at intensity 9–10
- ~10% max exploration at intensity 0–6
- ~5% max exploration at intensity 7–8
- 0% at intensity 9–10
- seeded RNG for deterministic tests
- never explore solely because an intervention is unused

This preserves safety and keeps the model explainable.

## Backwards compatibility

The scheme preserves all legacy session fields and supports older records that do not yet have the new V2 attributes. Historical sessions without a valid baseline are ignored for effectiveness attribution, and direct two-click entry still works quickly because the flow hydrates the current entry state without forcing a new screen.

## Marking interventions production-ready or ineligible

Future interventions should set the following metadata explicitly:

- releaseStatus
- experienceTier
- recommendationEligible
- automaticEligible
- allowExploration
- riskLevel
- requiredResources
- contraindicationTags
- supportedSubstates
- unsuitableSubstates

Production-safe interventions remain eligible; unfinished or draft interventions are excluded from automatic recommendations. Strong cold exposure or breath-hold tools remain available in the library but are not selected automatically as a first-line acute intervention unless there is explicit opt-in and suitable safety metadata.
