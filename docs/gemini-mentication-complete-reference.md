# Mentication: Complete Working Reference for Gemini

This document is a long-form working reference for understanding Mentication as a product, codebase, and strategic concept. It is intended to give an AI system enough context to reason about the app without having to reconstruct the whole repository from scratch.

## 1. What Mentication is

Mentication is a standalone, local-first wellbeing application built with React, Vite, and Capacitor. It is designed to help a person regulate their state in the moment by guiding them into a practical intervention that fits their current condition, available time, setting, and preferences.

The app is not built around a remote account system, a hosted application backend, or a therapy-provider dashboard. Its core promise is immediate usefulness with minimal friction:

- no sign-up;
- no account required;
- no hosted session database;
- no runtime analytics platform;
- no dependency on a remote narration or voice service;
- no requirement to hand sensitive distress data to a third party in order to use the product.

At its heart, Mentication is a guided regulation engine. It helps a user answer a small number of practical questions, identifies a useful direction such as Calm, Lift, Ground, Focus, or Sleep, then assembles a pathway of interventions that are eligible, safe within the app’s declared rules, time-aware, and shaped by prior device-local outcomes.

Mentication should be understood as a product that sits between three categories:

1. a mental wellbeing tool;
2. a structured intervention library;
3. a lightweight personal regulation system.

It is not just a meditation player, not just a journaling app, and not just a collection of self-help cards. It is a decision-making and intervention-delivery product.

## 2. What Mentication is not

Understanding the negative space is important because much of the product’s identity comes from what it deliberately refuses to be.

Mentication is not:

- a social network;
- an engagement-maximising habit loop;
- an always-on tracker;
- a passive mood surveillance system;
- a diagnostic engine;
- an emergency monitoring service;
- a substitute for crisis care;
- a therapy note repository by default;
- a cloud-first SaaS mental health platform.

The codebase and documentation repeatedly reinforce this boundary. Privacy, user control, and local execution are central. The product should not secretly infer diagnoses, risk states, or identity-level traits from behavior. It should not pretend to know more than the user explicitly told it. It should not pressure the user with streak guilt, coercive nudges, or false claims of clinical precision.

## 3. Core product promise

The strongest plain-language description of Mentication is:

**A reset that meets you where you are.**

That is visible in the welcome flow and reflected throughout the product. The app is built to help a user get one clear next step instead of being overwhelmed by too many options. It aims to:

- reduce activation when the user is overwhelmed, anxious, or panicky;
- increase healthy activation when the user is flat, low, or inert;
- reconnect the user to the present moment when disconnected or overstimulated;
- restore attention and action when focus is impaired;
- support bedtime and nighttime regulation without pretending to medically treat sleep.

The product is practical rather than abstract. It wants to be used in real-life moments of friction, distress, fatigue, avoidance, rumination, overwhelm, and bedtime wakefulness.

## 4. Strategic boundary for future work

The current repository implements a local-first V1. Future work should deepen, not weaken, the product’s visible through-line: immediate regulation, privacy-respecting personalisation, low-friction intervention delivery, and honest capability boundaries.

## 5. Current monetisation position

At a high level, the current repository presents V1 as account-free with premium behavior deferred; use `docs/app-store-release.md` as the canonical source for the exact current monetisation and platform guidance.

So the correct framing is:

- current reality: complete free local-first V1;
- future option: premium or subscription layers may exist later;
- hard boundary: do not compromise privacy or platform rules to monetise.

## 6. The main product idea: an easy regulation pathway

One of Mentication’s distinctive ideas is the reduction of complexity at the moment of need. Many mental wellbeing products make the user search, diagnose themselves, or choose from a large content library while already dysregulated. Mentication instead tries to create an easy regulation pathway.

That pathway works like this:

1. The user indicates what they need through the visible top-level home entries such as Calm, Lift, Ground, Focus, Sleep, or Guide me; “Reset” remains an internal direction label used by the engine and flow logic.
2. The app gathers a compact current context: direction, intensity, where the issue is felt, time available, audio preference, movement constraints, location, and related restrictions.
3. The recommendation engine filters out interventions that are not eligible under those conditions.
4. It ranks the remaining candidates.
5. It builds a pathway instead of simply naming one intervention.
6. The user completes a segment, checks in again, and the app can adapt the next step based on what happened.
7. The completed pathway and response are saved locally for learning and reflection.

That is the product’s regulating intelligence. The unique value is not merely “25 interventions.” It is “25 interventions that can be assembled intelligently into a helpful pathway with privacy-preserving learning.”

## 7. User experience structure

The app has a clean mobile-first tabbed structure plus a few top-level non-tab routes.

Main tab surfaces:

- Home
- Intervention Library
- My Plan
- Regulation Profile
- Your Patterns / Insights
- Settings

Non-tab routes:

- Welcome / onboarding
- Reset flow
- Crisis support
- Privacy summary
- not-found page

The app shell keeps tabs mounted once visited so state survives tab switching. This makes the experience feel app-like rather than page-like.

### Home

Home asks, “What do you need right now?” and presents directional entry points. It also surfaces:

- a last-worked option if prior sessions exist;
- a “what works for you” pathway built from history;
- a time-of-day recommendation if no strong prior history exists.

### Intervention Library

The library exposes the active catalogue, grouped by direction, searchable, and filterable by practical properties such as:

- quick;
- discreet;
- eyes open;
- sleep-friendly;
- no breathing.

This matters because Mentication is both guided and browsable. It is not a black-box engine only.

### My Plan

My Plan is a focused personalisation surface. It shows:

- a recommendation for today based on time of day plus the recommendation engine;
- a “what works for you” pathway built from the user’s prior outcomes.

### Regulation Profile

This is the personal history and control surface. It computes a profile from local session history and shows:

- average start and end intensity;
- typical improvement;
- last-worked pathway;
- history;
- strongest tools and combinations when available;
- data deletion controls.

### Insights / Your Patterns

This page surfaces non-clinical patterns derived from local sessions, such as:

- most often useful interventions;
- direction-level trends;
- location trends;
- situation patterns;
- streak-like usage information.

The language is careful to frame these as usage and check-in patterns, not medical conclusions.

### Settings

Settings contains accessibility and control preferences, including:

- reduced motion;
- high contrast;
- captions by default;
- one-handed reach;
- ambient soundscape;
- text size;
- crisis support access;
- data management entry points;
- privacy summary access.

## 8. Repository and code structure

Top-level understanding:

- `src/` contains the application source.
- `src/pages/` holds route-level pages.
- `src/components/` contains UI and interactive experience components.
- `src/lib/` contains the core product logic, intervention catalogue, recommendation engine, storage, privacy-related helpers, and domain utilities.
- `docs/` contains product and engineering standards.
- `ios/` is the generated and maintained native Xcode project.
- `scripts/` contains validation and support scripts.
- `capacitor.config.ts` defines native application configuration.

Key files:

- `src/lib/localData.js`: session persistence and app-owned local-data deletion/export.
- `src/lib/interventions.js`: active intervention catalogue wiring plus pathway and learning helpers.
- `src/lib/recommendationV3.js`: scoring, eligibility, and effectiveness logic.
- `src/lib/final50Catalog.js`: curated active-catalogue construction and legacy-to-current resolution.
- `src/pages/ResetFlow.jsx`: the central guided flow.
- `src/components/AppShell.jsx`: mounted-tab container.
- `README.md`: setup, validation, and iOS workflow.

## 9. Technology stack

Mentication is built with technologies defined in `package.json` and related config files, including:

- React;
- Vite;
- Capacitor for native packaging;
- React Router;
- TanStack React Query;
- Framer Motion;
- Tailwind CSS;
- Vitest;
- ESLint;
- TypeScript tooling for type-checking JavaScript via `jsconfig.json`.

Even though the app is written largely in JavaScript/JSX, it uses type-checking and structured tooling to enforce discipline.

## 10. Local-first architecture

Local-first is not marketing decoration in this repository. It is the architecture.

Session history is stored in browser local storage. The authoritative app-owned storage namespaces and deletion/export behavior live in `src/lib/localData.js`.

The session store keeps a bounded list of sessions and exposes list/create/delete functionality. The app can also export local app data and delete all app-owned local data from the device. When data is erased, the app dispatches events so the UI updates accordingly.

The implications are important:

- the user can use the app without trusting a remote database;
- sensitive state does not need an account to exist;
- recommendation learning can happen without cloud AI;
- deletion is immediate and understandable;
- offline-friendly behavior is natural.

## 11. Privacy model

Privacy is one of the defining product pillars.

The privacy summary and deeper privacy contract establish these rules:

- no account is required;
- session history, ratings, preferences, and intervention memory remain on device;
- there is no analytics SDK in the default runtime model;
- there is no runtime narration service;
- all app fonts, visuals, and available narration are bundled;
- sensitive free text is not supposed to feed recommendation memory by default;
- the user must be able to delete local memory and session history.

The larger privacy contract goes even further. It defines memory tiers, explicit consent expectations, limits on inference, deletion rules, AI processing boundaries, and analytics prohibitions. A major theme is that Mentication must never create the false impression that it secretly “knows” the user.

## 12. Data philosophy

Mentication’s data philosophy can be summarised as:

**remember only what creates clear future benefit, and only in a form that preserves user control.**

The repository distinguishes between:

- temporary session state;
- user-saved artifacts;
- preferences;
- higher-level personalisation patterns.

It rejects hidden profiling and coercive engagement tricks. It also draws strict boundaries around what should not be inferred, such as diagnosis, risk scores, trauma history, motivation as a trait, sleep quality as a hidden fact, or whether another person responded to a message.

This is a very important part of the product’s identity. It should be treated as a core product invariant, not an optional preference.

## 13. The intervention catalogue

Mentication’s active catalogue is arranged by directional purpose, not by raw content type alone. The current product docs describe a locked V1 catalogue snapshot, while the implementation authority lives in `src/lib/final50Catalog.js`, `src/lib/interventions.js`, `FINAL_50_LOCK.md`, and `scripts/verify-v3-algorithm.mjs`.

The repository also retains traces of a larger historical or transitional catalogue architecture. There are archived interventions, legacy ID aliases, and “final50/core25” naming in code and docs. The conceptual truth for product scope is that V1 is a curated active set, not an infinite toolbox.

Representative active interventions include:

- Extended Exhale
- Box Breathing
- Progressive Muscle Relaxation
- Thought or Fact?
- Solvable or Hypothetical Worry?
- Urge Surfing
- Then What?
- Ignition Point
- Countermove
- Open Channel
- Pulse Shift
- Test the Prediction
- Change the Scene
- Self-Compassion Break
- 5-4-3-2-1 Grounding
- Reroute
- Orienting Scan
- Name What You’re Feeling
- Next Easiest Step
- Signal Lock
- Friction Sweep
- Tomorrow Parking Lot
- Night Channel
- Awake-in-Bed Reset
- Drop the Sleep Struggle

These are not random wellness snippets. Each intervention has rich metadata attached to it for algorithmic use.

## 14. Intervention metadata model

Each intervention can carry properties such as:

- category;
- mechanism;
- targets;
- supported states;
- intensity range;
- duration;
- cognitive load;
- physical demand;
- environment constraints;
- eye-state suitability;
- audio requirements;
- movement requirements;
- discreet suitability;
- bedtime suitability;
- panic suitability;
- release status;
- experience tier;
- recommendation eligibility;
- automatic eligibility;
- exploration allowance;
- risk level;
- required resources;
- contraindication tags;
- supported and unsuitable substates;
- pathway roles.

This metadata is what makes intelligent recommendation possible. The app is not hard-coded with simplistic if/else rules alone. It uses intervention semantics.

## 15. Directions and user-facing framing

The app’s directional structure matters more than traditional clinical categories because it matches how users feel in the moment.

Directions include:

- Calm: reduce activation;
- Lift: increase healthy activation, mood, or momentum;
- Ground: reconnect to the present;
- Reset: shift mental stuckness or rumination;
- Focus: restore attention and action;
- Sleep: wind down to rest.

The currently visible primary entry surfaces emphasize Calm, Lift, Ground, Focus, Sleep, and “Guide me.” Reset is still part of the conceptual and engine vocabulary, especially for cognitive stuckness, but it is not the main user-facing top-level button set described above.

## 16. Flagship interventions

Not all interventions are equal in product identity. Some are more “flagship” in the sense that they embody richer interaction design and distinctive experience logic.

Interactive flagship IDs include experiences such as:

- Thought or Fact?
- Urge Surfing
- Ignition Point
- Change the Scene
- Test the Prediction
- Then What?
- Countermove
- Open Channel
- Pulse Shift
- Next Easiest Step
- Tomorrow Parking Lot
- Reroute
- Signal Lock
- Night Channel
- The Happy Bump

These richer experiences matter because Mentication is not only a library of breath timers. It is also a set of custom behavioral and cognitive flows.

## 17. Notable flagship themes

### Reroute

Reroute combines brief grounding and physical redirection. It is designed for moments where a person needs a simple foothold and a viable next move.

### Signal Lock

Signal Lock is a focus sprint experience. It validates a target, supports setup, offers timed sprints, allows pause/resume, and helps the user contain distractions.

### Night Channel

Night Channel is a bedtime attentional redirection experience. It is honest about source availability and hands playback to the user’s chosen audio app when needed. It does not pretend to own external playback states.

### Thought or Fact?

This is a cognitive distancing / evidence-checking experience. It is central to the app’s “reset” logic around rumination and thought fusion.

### Urge Surfing

This is a structured urge-regulation flow with staged routing and post-rating transitions, aimed at helping the user notice, name, ride, and complete an urge without collapsing the experience into hidden risk scoring.

## 18. Recommendation engine overview

The recommendation system is one of the most important technical assets in the product.

Its decision pipeline, as documented and implemented, broadly works like this:

1. collect current context;
2. run hard eligibility gates;
3. retain only the safe/allowed subset;
4. score candidates;
5. assemble an initial pathway;
6. run the chosen practice;
7. capture outcome and adapt;
8. save completed pathway separately from planned pathway.

This is more sophisticated than “show a random breathing exercise.” It is a compact context-aware recommendation and adaptation loop.

## 19. Recommendation context fields

The engine uses a compact state summary rather than an uncontrolled giant state object. Context can include:

- direction;
- subtype;
- intensity;
- where felt;
- location;
- time available;
- remaining time;
- audio preference;
- movement preference;
- discreet mode;
- eyes-open requirement;
- no-breathing requirement;
- no-audio requirement;
- preference mode.

The design goal is deterministic and testable recommendation behavior.

## 20. Hard eligibility rules

Hard eligibility is a major product integrity feature. The engine refuses interventions that violate explicit constraints. It does not silently override them.

Examples:

- no breathing excludes breathing interventions;
- eyes-open excludes closed-eye practices;
- no audio excludes required-audio interventions;
- discreet mode excludes loud or highly visible practices;
- movement restrictions exclude incompatible physical interventions;
- work or public setting excludes private-environment practices where relevant;
- required resources must actually be available;
- time budgets must fit;
- automatic and recommendation eligibility flags are respected.

This is part of Mentication’s trust model. If a user says they need discreet, no-audio, or no-breathing, the app should respect that.

## 21. Scoring model

The V3 engine uses transparent weighted components. The scoring model in `src/lib/recommendationV3.js` combines factors such as:

- state fit;
- intensity fit;
- personal fit;
- target fit;
- direction fit;
- load/arousal fit;
- context fit;
- evidence fit;
- role fit;
- diversity fit;
- novelty fit.

The exact numeric weights should be treated as code-level implementation details owned by `src/lib/recommendationV3.js` and cross-checked by `scripts/verify-v3-algorithm.mjs`, rather than duplicated as a second source of truth here. In addition to the weighted components, the scorer also applies a dislike penalty and a small deterministic jitter term for stable ranking behavior.

## 22. Pathway construction

Mentication builds pathways, not just single picks.

Pathway length is influenced by available time. Short windows may get one intervention, medium windows two or three, and longer windows more. The system also assigns pathway slots such as opener, core, and closer. This matters because some interventions are better as openers or rescue steps, while others are better as core cognitive work or closing wind-downs.

The engine tries to preserve diversity of mechanism and family across a pathway so the user does not get the same type of intervention repeatedly unless diversity relaxation is necessary as a last resort.

There is also a concept of immediate mode for high distress, which narrows the candidate pool to low-load rescue-appropriate interventions.

## 23. High-distress logic

When distress is high, the engine is intentionally more bottom-up. If multiple candidates are competitively ranked for the opener, the system prefers more physiological or sensory regulation before heavier cognitive work.

This is an important design philosophy: in high distress, start with the body or basic orientation before asking the user to reason deeply.

## 24. Learning model

Mentication learns from outcomes, but carefully.

It records attempt-level data such as:

- intervention ID;
- mechanism;
- recommendation rank;
- timestamps;
- completion percentage;
- pulse response;
- exit reason;
- switch preference;
- context key.

Learning is confidence-weighted and recency-weighted. Reward and dislike decay are implemented in code so old outcomes do not permanently dominate the system; use `src/lib/recommendationV3.js`, `src/lib/preferences.js`, and `scripts/verify-v3-algorithm.mjs` for the exact current behavior.

The hierarchy of evidence prioritizes:

1. same intervention in similar context;
2. same mechanism in similar context;
3. intervention across contexts;
4. mechanism overall;
5. clinical metadata prior.

This is not a giant machine-learning stack. It is a pragmatic, inspectable, device-local learning system.

## 25. Negative-preference memory

The app includes strong dislike memory. If the user indicates that something is not helping, that signal has meaningful weight. It also decays over time so one old rejection does not become a permanent veto; the exact decay behavior lives in `src/lib/preferences.js`.

This is a subtle but valuable product choice. It treats user aversion seriously without freezing the system forever.

## 26. Adaptation during the reset flow

The Reset flow is not static. After a segment, the user can effectively tell the system what remains, and the app can:

- continue coaching;
- add more time;
- repeat;
- switch direction;
- adapt the next pathway segment.

This is a distinctive strength. The app is not only a pre-session recommender; it is an in-session adaptive guide.

## 27. Entry modes

The app supports several ways into the core experience:

- immediate entry from onboarding;
- directional entry from home;
- unsure flow for people who do not know what they need;
- direct library launch of a single intervention;
- prebuilt pathway launch from history or recommendation surfaces.

The unsure flow is important because it lowers the cognitive burden on the user. It asks simple branching questions like whether the person feels too high, too low, or just stuck, then routes them toward a likely direction.

## 28. Design philosophy

The design language is mobile-first, soft, and calming, but not bland. The app uses motion, careful typography, and focused visual framing. Framer Motion is used for page transitions and experience flow. Accessibility preferences can reduce motion. The interface emphasizes:

- clear hierarchy;
- limited simultaneous choices;
- rounded, tactile controls;
- low-friction navigation;
- app-like persistence across tabs;
- practical trust cues.

The tone is not clinical-industrial and not playful-gamified. It aims for warm competence.

## 29. Accessibility model

Accessibility is treated as product behavior, not decoration. The app includes settings for:

- reduced motion;
- high contrast;
- captions;
- text scaling;
- one-handed reach;
- ambient soundscape preferences.

Accessibility preference storage is split across the older contract in `src/lib/accessibility.jsx` and the newer contract in `src/hooks/useAccessibilityPrefs.js`. Before changing persistence or migration behavior, verify the current usage in those files and in `src/pages/Settings.jsx`, because the repository does not treat the two stores as interchangeable.

## 30. Audio and narration model

Mentication supports narration and optional soundscapes, but it does so within a privacy-preserving boundary. Narration resolves from checked-in manifests and bundled assets. Missing narration falls back to on-screen text. The app does not call a runtime voice service. This is important for both privacy and reliability.

The app also has logic around discreet and no-audio preferences. Spoken audio should be suppressed when the user has indicated discreet/no-audio requirements.

## 31. Native application model

The repository includes a Capacitor iOS app. The current native configuration authority is `capacitor.config.ts`, and the release-process authority is `docs/app-store-release.md`. Together they define the active app identity, web build handoff, and native plugin behavior for the current snapshot.

The repository also contains release notes emphasizing privacy declarations, lack of tracking, lack of collected data, and the fact that all features are local and account-free in V1.

## 32. Validation and engineering discipline

Use `README.md` as the canonical source for the current validation commands.

The important extra context here is that `scripts/verify-v3-algorithm.mjs` validates recommendation-engine invariants, intervention-count expectations, scoring behavior, immediate-mode constraints, and dislike-penalty behavior. In other words, the intervention algorithm is treated as a real product subsystem that deserves explicit verification.

## 33. Product boundaries around AI

The repository does not position live AI as a requirement for the core product. In fact, the privacy contract is careful about future AI use. If AI ever processes user content, it must be:

- explicit;
- minimal;
- purpose-specific;
- editable by the user;
- optional for core intervention use;
- separated from long-term storage permission.

This document is written for Gemini as a documentation audience, not as evidence of a current in-product Gemini feature. If Mentication ever adds Gemini-assisted or other AI-assisted product behavior, it should be governed, transparent, and bounded. AI is not the product’s excuse to weaken privacy.

## 34. Intended value to the user

Mentication’s intended value is immediate, practical, repeatable relief and guidance. More specifically, it tries to offer:

- a fast way to regulate in moments of overwhelm;
- a structured bridge from dysregulation into action;
- a system that gets better at matching the person over time without invading their privacy;
- a safer-feeling experience for people who do not want accounts or surveillance;
- a mental wellbeing product that feels useful in real life rather than merely inspirational.

Its value proposition is not only emotional. It is also cognitive and operational: reduce friction, reduce indecision, reduce overload, and give the user a path.

## 35. Future direction within repository boundaries

A coherent future for Mentication would likely deepen rather than replace the current principles. Repository-consistent future directions could include:

- richer personalisation with explicit user control;
- more polished flagship experiences;
- a stronger evidence-aware intervention registry;
- clearer saved artifacts and memory management;
- optional premium layers built on top of the complete free core;
- more native refinement on iOS;
- potentially Android packaging if aligned with product goals;
- better explanation surfaces for “why this was suggested”;
- carefully bounded AI support for drafting or summarising user-entered content when explicitly enabled.

Future work should avoid:

- aggressive cloud dependence;
- hidden profiling;
- ad-tech or analytics creep;
- medical overclaiming;
- engagement manipulation;
- storing intimate user text by default;
- embedding private API keys in app bundles.

## 36. Important engineering constraints for assistants and contributors

This section is a summary of the contributor-facing boundaries already reflected in `AGENTS.md`, `README.md`, and the repository docs. When proposing or modifying Mentication, assistants and contributors should preserve these rules:

- keep it local-first unless there is an explicit product decision otherwise;
- do not introduce a hosted backend casually;
- do not add analytics or tracking by default;
- do not store sensitive content unnecessarily;
- do not claim capabilities the app does not actually have;
- do not add private API keys to frontend or native bundles;
- keep recommendation logic explainable and testable;
- preserve deletion/export control;
- preserve account-free usage;
- preserve honest safety boundaries.

## 37. Known codebase nuances

Gemini should also understand that the repository has some transitional naming and architecture traces:

- “final50” naming remains in several files even though the active V1 scope is curated; the practical catalogue entry points are `src/lib/interventions.js` and `src/lib/final50Catalog.js`;
- legacy intervention aliases and archived interventions still exist for migration compatibility; the resolver logic also lives in `src/lib/final50Catalog.js`;
- recommendation behavior should be treated as authoritative in `src/lib/recommendationV3.js`, `src/lib/interventions.js`, and `scripts/verify-v3-algorithm.mjs`;
- local-session and device-data behavior should be treated as authoritative in `src/lib/localData.js` and the privacy-oriented docs under `docs/`;
- accessibility behavior includes layered or evolving contracts, with key behavior split across `src/lib/accessibility.jsx` and `src/hooks/useAccessibilityPrefs.js`;
- privacy contracts and memory boundaries should be read from `docs/personalisation-memory-privacy-contract.md`, the privacy summary surfaces, and `src/lib/localData.js`.

This does not mean the product lacks direction. It means the codebase has evolved through earlier catalogue and architecture phases.

## 38. Short summary for quick orientation

If all of Mentication had to be compressed into a few lines, the most accurate summary would be this:

Mentication is a standalone, local-first, mobile-first mental wellbeing app that guides a user into the most suitable short intervention pathway for their current state. It combines a curated intervention library, a privacy-preserving recommendation engine, adaptive in-session routing, and device-local learning. It is intentionally account-free, has no analytics in its default runtime model, and is honest about its limits.

## 39. Final framing

The most important thing for Gemini to understand is that Mentication is not just “an app with breathing exercises.” It is a product system with a worldview:

- help immediately;
- reduce friction;
- meet the user where they are;
- remember carefully;
- adapt intelligently;
- stay honest;
- keep control on the user’s device whenever possible.

That worldview is the through-line connecting the UX, recommendation engine, privacy model, and intervention design.
