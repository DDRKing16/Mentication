# Mentication Personalisation, Memory and Privacy Contract

Version 1.0 — canonical product-design contract for intervention data.

This document defines how Mentication may personalise experiences, remember user-confirmed information and protect intervention content. It is a product and engineering standard, not a substitute for jurisdiction-specific legal review or the final public privacy policy.

## 1. Governing promise

Mentication remembers only what creates a clear future benefit that the user can understand and control.

The product must never create the impression that it secretly knows the user, monitors their safety, measures their nervous system or has reached a psychological conclusion from app behaviour.

Personalisation must be:

- **Explicit:** grounded in information the user entered, chose or approved.

- **Proportionate:** no more data than the feature requires.

- **Visible:** the user can see why a suggestion appeared.

- **Correctable:** stored items and patterns can be edited or rejected.

- **Deletable:** the user can remove an item, an intervention’s history or all memory.

- **Uncertain when appropriate:** weak evidence is not presented as knowledge.

- **Non-coercive:** memory is not used for streaks, guilt, pressure or engagement manipulation.

## 2. Data minimisation rule

Before storing any field, the feature owner must answer:

1. What future user benefit requires this field?

2. Could the same benefit be delivered with less precise or less sensitive information?

3. Is the field needed beyond the current session?

4. Has the user deliberately saved it or enabled the relevant memory?

5. How will the user inspect, correct and delete it?

If these questions do not have clear answers, the field remains session-only or is not collected.

## 3. Four memory tiers

### Tier 0 — Session state

Temporary information required to run the current intervention, such as current screen, temporary rating, selected adaptation, unsaved text, pause state and active handoff payload.

Default behaviour:

- not retained after the session unless the user saves a result;

- not used for long-term personalisation;

- excluded from product analytics in raw form;

- cleared after the defined session-expiry period.

### Tier 1 — User-saved artefacts

Content the user deliberately chooses to keep, such as a Clarity Card, coping route, Reality Record, Starting Point, saved scene shift, parked item, message draft or Dream move.

Requirements:

- Save is explicit and never preselected.

- The future use is explained at the point of saving.

- The artefact can be viewed, edited and deleted.

- Saving an artefact does not automatically authorise pattern inference.

### Tier 2 — Preferences

Settings that reduce future setup, such as preferred duration, narration level, soundscape, reduced motion, haptics, guidance level, body areas to skip and familiar media bookmarks.

Requirements:

- remember-setting behaviour is visible;

- sensitive preferences are never presented as medical facts;

- global accessibility preferences take priority over intervention defaults;

- preferences can be reset independently of saved artefacts.

### Tier 3 — Personalisation patterns

Summaries created from multiple user-confirmed choices or outcomes.

Examples:

- “Short physical entry steps have felt more reachable when mental effort is high.”

- “You usually choose minimal narration.”

- “This prediction has appeared before, and previous outcomes were mixed.”

Requirements:

- contributing observations are inspectable;

- the pattern states its basis and uncertainty;

- the user can confirm, correct, hide or delete it;

- deleting observations recalculates or removes the pattern;

- no pattern is created from typing speed, hesitation, missed sessions or passive sensor behaviour without separate informed consent and validation.

## 4. Consent model

Consent is granular. One blanket personalisation switch is insufficient.

The user controls at least:

1. **Remember my settings** — Tier 2 preferences.

2. **Keep things I save** — Tier 1 artefacts.

3. **Use my saved outcomes to personalise suggestions** — Tier 3 patterns.

4. **Carry relevant information between interventions** — handoff permission.

5. **Use AI on my entered content** — content-processing permission and disclosure.

Sensitive free text requires explicit saving even when general personalisation is enabled.

Consent rules:

- controls use plain affirmative language;

- optional consent is off until chosen;

- declining does not block the core intervention;

- withdrawal is as easy as enabling;

- consent changes trigger the required deletion or recalculation choices;

- consent version and purpose are recorded with stored data.

## 5. Pattern-evidence thresholds

Mentication distinguishes observations from patterns.

### One observation

Permitted: “You chose the short route today.”

Not permitted: “You prefer short routes.”

### Two observations

Permitted: “You chose this twice.”

Not permitted: “This works for you.”

### Three qualifying observations

A tentative pattern may be shown:

- “This may be more reachable for you.”

- “You have chosen this more often recently.”

It must show the contributing observations and allow Not Accurate.

### Five or more qualifying observations

A stronger descriptive pattern may be shown:

- “This has often felt more useful in your recent check-ins.”

Still prohibited:

- best;

- always;

- proven;

- your nervous system needs;

- clinically effective for you.

A pattern also requires relevant outcome information. Repeated selection alone cannot establish usefulness.

## 6. Recency and context

Personalisation must not assume that an old pattern still applies.

Every pattern defines:

- relevant context, such as goal, time of day, energy or setting;

- observation period;

- most recent supporting event;

- expiry or review rule.

Patterns based on stale or conflicting information are softened or withdrawn.

Use phrases such as “Recently,” “In three evening check-ins,” or “When you reported low energy.” Avoid permanent identity labels such as “You are someone who avoids difficult tasks.”

## 7. Confidence communication

Pattern confidence is communicated in plain language, not a pseudo-clinical score.

Approved states:

- **Not enough information**

- **Early pattern**

- **Repeated pattern**

- **Mixed pattern**

- **No longer current**

The interface may show event counts and dates. It must not show an unexplained psychological confidence percentage.

## 8. Prohibited inferences

Without a separately validated and consented future capability, Mentication must not infer:

- diagnosis or disorder;

- suicide or violence risk score;

- addiction or compulsion type;

- truth or falsity of a thought;

- whether avoidance is irrational;

- relationship safety;

- trauma history;

- motivation level as an internal trait;

- physiological arousal, relaxation or nervous-system regulation;

- sleep onset or sleep quality;

- whether the user completed an action in another app;

- whether another person replied or approved;

- moral character, reliability or commitment;

- clinical improvement or treatment response.

The product may respond to direct user reports without converting them into hidden labels.

## 9. Sensitive-content classes

High-sensitivity content includes:

- exact distressing thoughts;

- urges and trigger descriptions;

- safety-check responses;

- names, contact targets and relationship details;

- message drafts;

- predictions and feared outcomes;

- bedtime brain dumps;

- health, pain, mobility or injury information;

- imported audio and listening history;

- free-form intervention notes.

High-sensitivity rules:

- session-only by default;

- explicit Save required for retention;

- never included in raw analytics, crash reports or notification previews;

- never resurfaced automatically in an unrelated intervention;

- never used for advertising, sale or engagement targeting;

- never shown on a lock screen unless the user creates a safe notification;

- never presented as monitored by a person unless an actual monitored service is established.

## 10. Safety information

Safety checks route the immediate experience. They do not silently create a permanent risk profile.

Default:

- retain only the minimum event needed to complete the safety route;

- do not store the exact disclosure unless the user explicitly saves it for a defined support feature;

- do not send safety content to analytics;

- clearly state that Mentication is not an emergency-monitoring service;

- do not imply that a lack of alert means the user is safe.

Any future monitored-care feature requires separate consent, governance and response standards.

## 11. Intervention handoff contract

Handoffs use a temporary, field-level payload.

Before continuing, the user sees:

- why the next intervention is suggested;

- exactly what will carry over;

- whether the information will be saved;

- Continue Without Details where feasible;

- Cancel.

Example:

~~~text
Thought or Fact → Test the Prediction

Carry over:
✓ Your prediction
✓ Your estimated likelihood
□ Your full evidence notes
~~~

Rules:

- only information required by the receiving mechanism is preselected;

- high-sensitivity details require explicit confirmation;

- the payload expires if the handoff is abandoned;

- transfer does not automatically create long-term memory;

- the receiving intervention identifies carried content as user-provided;

- the user can edit it before beginning.

## 12. External-app handoffs

Before opening another app, disclose:

- destination;

- text or link being copied;

- whether the destination receives personal content;

- whether Mentication can detect a return;

- what remains saved in Mentication.

Mentication must not:

- mark an external action complete because another app opened;

- claim control over external playback, messages or data without a supported integration;

- read replies, listening history or completion state without separate permission;

- place sensitive text on the clipboard without explicit action.

## 13. AI processing contract

When AI processes intervention content:

1. The user is told that AI is being used.

2. Only the minimum necessary content is sent.

3. Unrelated intervention history is excluded.

4. Direct identifiers are removed or avoided where feasible.

5. The purpose is specific, such as draft task reduction or suggest claim parts.

6. Output is labelled as a suggestion.

7. The user can edit, reject, regenerate or proceed without AI.

8. Provider, retention and model-training treatment are documented before launch.

9. Raw prompts and responses are not placed in general analytics or logs.

10. A non-AI path remains available for the core intervention.

AI permission does not automatically authorise saving the input or using it for future personalisation.

## 14. User memory controls

The app provides a single **My Mentication Memory** area.

### Saved

User-created artefacts grouped by intervention and date.

### Preferences

Audio, guidance, motion, timing and intervention-specific defaults.

### Patterns

Every personalisation statement includes:

- why it appeared;

- contributing observations;

- Early, Repeated or Mixed status;

- Accurate;

- Not Accurate;

- Edit context;

- Hide;

- Delete.

### Privacy controls

- remember settings;

- save artefacts;

- personalised suggestions;

- cross-intervention carry-over;

- AI processing;

- delete one intervention’s memory;

- delete all Mentication memory;

- export my information where required or supported.

## 15. Correction and deletion

Deletion is functional, not cosmetic.

When an item is deleted:

- it disappears from the interface immediately;

- it stops contributing to recommendations and patterns immediately;

- derived patterns are recalculated or removed;

- cached handoff payloads are invalidated;

- downstream deletion and backup-retention timing follow the documented technical and legal policy.

The final implementation must publish the actual deletion timeframe. The interface must not say “deleted everywhere” unless that is technically true.

Corrections preserve provenance. User-corrected information replaces the active value, and a rejected inference must stop appearing. A minimal suppression instruction may be retained without unnecessary sensitive content.

## 16. Retention

Before launch, every stored field receives:

- purpose;

- sensitivity class;

- default retention period;

- user deletion behaviour;

- backup behaviour;

- processor destination;

- analytics eligibility.

High-sensitivity artefacts must not default to indefinite retention merely because storage is available.

The app may invite review of old saved material without exposing sensitive content in notifications.

## 17. Security and logging requirements

The production implementation must:

- protect data in transit and at rest using current platform-appropriate controls;

- apply least-privilege access;

- keep high-sensitivity text out of URLs, analytics events and ordinary logs;

- redact user content from error reporting;

- separate operational metrics from intervention content;

- document administrative access and auditing;

- avoid production data in development and design tools;

- test deletion, export and consent withdrawal.

Exact security controls must be verified against the final architecture rather than promised from design mockups.

## 18. Analytics boundary

Permitted de-identified product events may include intervention opened, route selected, stage reached, adaptation used, session ended, handoff offered or accepted, error state and accessibility mode used where appropriate.

Not permitted in general analytics:

- exact user text;

- message drafts;

- names;

- sensitive urge type;

- safety responses;

- prediction content;

- brain-dump content;

- health or injury details;

- imported-media names or listening history.

Completion analytics must not be interpreted as therapeutic effectiveness.

## 19. Permitted memory by intervention

| Intervention | May remember with permission | Must not infer or auto-resurface |
|---|---|---|
| Box Breathing | Pattern, pace, audio/guidance settings, reported comfort | Physiological regulation, respiratory health, exact 4–4–4–4 effectiveness |
| Thought or Fact | Saved Clarity Card, user-confirmed categories, optional conviction change | Whether the thought is false, a diagnosis, rejected interpretations; exact thought outside its chosen context |
| PMR | Route, pace, skipped areas, guidance, reported contrast | Injury, chronic tension, physiological relaxation or body condition |
| Urge Surfing | Window, user-confirmed urge category, strategy and reported choice | Addiction, risk score or recovery; exact urge wording without Save |
| Then What? | User-approved coping route and first action | Automatic resurfacing of the catastrophic narrative |
| Ignition Point | Pathway, constraints, start outcome and reported worthwhileness | Motivation, reward-system response or identity as fact |
| Change the Scene | User-created labels, route and reported shift | Precise location, floor plan or nervous-system effect without direct input |
| Test the Prediction | Saved prediction, approved experiment, observations and update | That a fear is irrational or disproved; high-risk belief classification |
| Open Channel | Explicitly saved draft, chosen bridge and user-reported outcome | Relationship safety, recipient response or message success |
| Countermove | User-confirmed pull function, trajectory and outcome | Whether behaviour was avoidance, protection or recovery without confirmation |
| Pulse Shift | Preferred position, movement level and reported availability | Fitness, health status or physiological activation |
| 5–4–3–2–1 Grounding | Preferred substitutions, pacing and guidance | Sensory ability, dissociation, panic severity or regulation |
| Reroute | Destination qualities, saved activities and user ratings | That an activity will regulate the user |
| Next Easiest Step | Approved task, barrier, entry point and return point | Productivity, executive-function diagnosis or why the user did not begin |
| Signal Lock | Approved target, sprint preference, captured distractions and outcome | Attention disorder, productivity score or external task completion |
| Tomorrow Parking Lot | Explicitly saved dump, user-confirmed daytime items and actions | Night-time AI priorities or reminders; sensitive content in notifications |
| Night Channel | Channel, capture level, stop point and saved media reference | Sleep onset, sleep quality, external listening completion or medical benefit |

## 20. Personalisation pipeline

~~~text
USER ACTION OR REPORT
↓
CLASSIFY PURPOSE AND SENSITIVITY
↓
SESSION ONLY OR EXPLICIT SAVE
↓
CHECK PERSONALISATION CONSENT
↓
AGGREGATE USER-CONFIRMED EVENTS
↓
APPLY EVIDENCE, RECENCY AND CONTEXT THRESHOLDS
↓
GENERATE DESCRIPTIVE PATTERN
↓
SHOW WHY IT APPEARED
↓
USER CONFIRMS, CORRECTS, HIDES OR DELETES
↓
RECALCULATE OR EXPIRE
~~~

An AI-generated interpretation never becomes memory without user confirmation.

## 21. Required memory-event record

Every stored memory event must represent:

~~~text
event ID
user ID
intervention ID
timestamp
event type
value or artefact reference
source: explicit / AI-suggested-and-confirmed / inferred
purpose
sensitivity class
consent category and version
retention rule
context fields
included in pattern: yes / no
deleted or corrected state
~~~

The implementation may use a different schema but must preserve these meanings.

## 22. Approval checklist

- [ ] Every stored field has a clear future user benefit.
- [ ] Session-only is the default for sensitive free text.
- [ ] Saving and personalisation are separate permissions.
- [ ] AI processing and long-term storage are separate permissions.
- [ ] Pattern wording matches its evidence level.
- [ ] Repeated selection is not treated as effectiveness.
- [ ] Users can inspect contributing observations.
- [ ] Users can mark a pattern inaccurate.
- [ ] Item deletion updates derived patterns.
- [ ] Handoff payloads are visible and field-specific.
- [ ] External-app limitations are honest.
- [ ] Safety responses do not create a hidden risk profile.
- [ ] Sensitive content is excluded from general analytics and logs.
- [ ] Notification previews contain no sensitive intervention content.
- [ ] Each intervention complies with the permitted-memory table.
- [ ] Retention, security, AI provider and deletion details are verified before public claims are made.

The contract is approved only when these rules appear in the product requirements, data model, interface and test plan.

