# Required Dear 2100 threat-system check

Screen: `rN` in `design/dear2100/app.js`, “Our Threat Detection System”, Dear 2100 stage 3. The live route embeds `public/dear2100-updated/index.html`; the older React Dear components are not the active experience. The four-phase visual and optional deeper evolution explanation are preserved.

Previously the practical-only path replaced stage 3, and the fear/mixed paths could advance without interaction. Stage 3 now appears on all three paths. Exactly four answers and explicit scoring are required; 3/4 (75%) or 4/4 passes. Failure shows four corrective explanations and a retry that clears selections and focuses the first radio. Changing an answer requires scoring again. This is comprehension of authored content, not diagnosis or improvement measurement.

Current-chapter downstream navigation, restoration, home resume, overview, stage rails, plan entry, model-context alternate view, plan saving and observation entry are guarded. A legacy book does not receive an inferred pass. Existing words, practical support questions, furthest progress and historical book access remain. Back, pause, home and host Save & return Home remain available. New chapters start without a pass; interruption preserves the local answers/submission. This is an additive validated format-7 property, not a backend or new storage system.

## Exact questions and answers

1. **What does noticing a possible threat tell you?**
   - A: The danger is confirmed.
   - B: Your first impression is a fact.
   - **C: A signal caught your attention; its meaning is still open.**
   - D: You deliberately chose the response.
   - Explanation: Noticing is automatic. The first signal is incomplete, so your first impression does not establish what is there.
   - Source: Threat phase text, reframe and detail.
2. **What does a racing heart establish on its own?**
   - **A: Your body is responding; context still matters.**
   - B: There is definitely a threat.
   - C: Your prediction is accurate.
   - D: Reasoning has already checked the situation.
   - Explanation: The body may prepare before you understand what happened. A racing heart is a response, not proof of a threat.
   - Source: Alarm phase text and detail.
3. **How can you check an uncertain social cue?**
   - A: Treat the worst prediction as the only explanation.
   - B: Assume you know what someone thinks.
   - C: Use discomfort as proof of their meaning.
   - **D: Check what was actually said or done.**
   - Explanation: A social cue can have several meanings. Check observable context before treating a prediction as the only explanation.
   - Source: Check phase text, reframe and detail.
4. **If the situation is safe enough, what can noticing the story loop help you do?**
   - A: Guarantee that fear will stop.
   - **B: Make room to check the story and choose a next move.**
   - C: Prove that the story is true.
   - D: Remove uncertainty by always avoiding.
   - Explanation: Noticing can create room to choose; it does not switch off fear. Avoidance can bring brief relief while leaving uncertainty intact.
   - Source: Loop phase text/reframe/detail and the threat-screen footer.

## Validation

- **65 files / 538 tests passed**, including unanswered/malformed data, explicit submission, every threshold from 0/4 through 4/4, retry, and downstream navigation on all three barrier paths.
- Typecheck, lint, production build, V3 verification and whitespace check passed.
- Production browser: three fresh paths at 320/390px passed unanswered gating, displaying all scenes without passing, 50% failure, corrective explanations, retry focus, 75% pass, radio keyboard interaction, home exit/resume, Back, refresh and preserved answers. 320px enlarged text has no horizontal overflow.
- Four legacy/alternate-entry cases (restored journey, plan, home and book) passed overview/stage-rail/model-tool bypass checks, 100% scoring, and progress preservation.
- Starting a new chapter resets the previous pass. No browser errors observed.
- Executable regression: `qa/dear-threat-required-browser.py`; logs `/tmp/threat-*.log`; mobile capture `/tmp/dear-threat-required/threat-and-check-320.png`.

No push, merge or deploy performed. Native iOS and spoken screen-reader testing remain outside this Linux verification.
