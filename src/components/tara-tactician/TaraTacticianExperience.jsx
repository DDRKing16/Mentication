import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, X } from 'lucide-react';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { COMPARISONS, EVENTS, TARA_ID, beginTackle, chooseChallenge, chooseEvent, confirmReflection, newTaraState, preparePlan, returnToEvent, taraCompletion } from '@/lib/taraTacticianState';
import { clearTara, loadTara, saveTaraDraft, saveTaraRecap } from '@/lib/taraTacticianStorage';
import '@/styles/tara-tactician.css';

const PLAN_LABELS = { mind: 'Mind may say', notice: 'Notice', do: 'Do', spikes: 'If it spikes' };
const STAGES = ['Prepare', 'Rehearse', 'Tackle', 'Reflect'];
const stageFor = phase => ['entry', 'prepare', 'plan'].includes(phase) ? 0 : phase === 'rehearse' ? 1 : ['tackle', 'support'].includes(phase) ? 2 : 3;
const TITLES = { entry: 'One small step into something difficult.', prepare: 'What are you facing?', plan: 'A plan you can actually use.', rehearse: 'Try your first move.', tackle: 'Just the next step.', support: 'A little support, right here.', reflect: 'What actually happened?', recap: 'What you want to take with you.' };
const SUPPORT = {
  racing: { title: 'Come back to one thing.', body: 'You do not need to answer every thought. Notice one thing you can see, then choose the next useful action.', prompt: 'What is the next thing I want to say or do?' },
  overwhelmed: { title: 'Make the moment smaller.', body: 'Feel your feet, or look at a steady object. Let your next step be smaller. You can slow down, ask for help, or pause.', prompt: 'What would make this manageable right now?' },
  'step-out': { title: 'You can choose your pace.', body: 'Staying and stepping out are both available. Decide what fits this situation; you can return when it makes sense.', prompt: 'What do I need to continue safely?' },
};

function Field({ name, label, value, onChange, hint, rows = 2, inputRef }) {
  const id = `tara-${name}`;
  return <div className="tara-field"><label htmlFor={id}>{label}</label>{hint && <p id={`${id}-hint`}>{hint}</p>}<textarea ref={inputRef} id={id} value={value} onChange={e => onChange(e.target.value)} rows={rows} maxLength={3000} aria-describedby={hint ? `${id}-hint` : undefined} /></div>;
}
function Action({ children, onClick, secondary = false, disabled = false }) {
  return <button type="button" className={`tara-action ${secondary ? 'tara-action--secondary' : ''}`} onClick={onClick} disabled={disabled}>{children}{!secondary && <ArrowRight size={19} aria-hidden="true" />}</button>;
}
function Plan({ state }) {
  return <dl className="tara-plan">{Object.entries(PLAN_LABELS).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{state.plan[key] || (key === 'do' ? 'Choose one safe, manageable next step.' : 'Not added yet.')}</dd></div>)}</dl>;
}

export default function TaraTacticianExperience({ intervention, sessionId, answers, onAttemptEvent, onComplete, onExit }) {
  const { prefs } = useAccessibilityPrefs();
  const [initial] = useState(() => { try { return { ...loadTara(), error: '' }; } catch (error) { return { draft: null, recaps: [], error: error.message || 'Device storage is unavailable.' }; } });
  const [state, setState] = useState(() => initial.draft || newTaraState());
  const [recaps, setRecaps] = useState(initial.recaps);
  const [saveStatus, setSaveStatus] = useState(initial.error ? 'error' : initial.draft ? 'saved' : 'idle');
  const [error, setError] = useState(initial.error);
  const [deleting, setDeleting] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const headingRef = useRef(null); const revealRef = useRef(null); const predictionRef = useRef(null); const deleteRef = useRef(null); const deleteButtonRef = useRef(null);
  const currentRef = useRef(state); const completedRef = useRef(false); const startedRef = useRef(Date.now()); const snapshotsRef = useRef([]);
  currentRef.current = state;

  useEffect(() => {
    const marker = { id: currentRef.current.id, phase: currentRef.current.phase };
    window.history.replaceState({ ...window.history.state, tara: marker }, '');
    const pop = event => {
      const marker = event.state?.tara;
      if (marker?.id !== currentRef.current.id) return;
      const previous = snapshotsRef.current.findLast(item => item.phase === marker.phase);
      if (previous) setState(previous);
      else if (marker.phase !== 'recap' || currentRef.current.comparison) setState(value => ({ ...value, phase: marker.phase }));
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (state.phase === 'entry' || reviewOnly) return;
    try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); }
    catch (error) { setSaveStatus('error'); setError(error.message || 'This draft could not be saved.'); }
  }, [state, reviewOnly]);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [state.phase]);
  useEffect(() => { if (deleting) deleteRef.current?.focus(); }, [deleting]);
  useEffect(() => {
    const erased = () => {
      try { if (loadTara().draft === null) { setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setReviewOnly(false); completedRef.current = false; snapshotsRef.current = []; setError(''); } } catch { /* No write on a storage read failure. */ }
    };
    const changed = event => { if (event.storageArea === window.localStorage && event.newValue === null && (event.key === null || event.key === 'mentation.tara-tactician.v1')) erased(); };
    window.addEventListener('mentation:sessions-changed', erased);
    window.addEventListener('mentation:tara-cleared', erased);
    window.addEventListener('storage', changed);
    return () => { window.removeEventListener('mentation:sessions-changed', erased); window.removeEventListener('mentation:tara-cleared', erased); window.removeEventListener('storage', changed); };
  }, []);

  const edit = patch => setState(value => ({ ...value, ...patch, saved: false }));
  const go = next => {
    snapshotsRef.current.push(currentRef.current);
    window.history.pushState({ ...window.history.state, tara: { id: next.id, phase: next.phase } }, '');
    setState(next);
  };
  const exit = () => {
    if (!reviewOnly && state.phase !== 'entry') onAttemptEvent?.({ interventionId: TARA_ID, action: 'exited', exitReason: 'exited', completedPercentage: stageFor(state.phase) / 4, startedAt: startedRef.current, timestamp: Date.now() });
    onExit?.();
  };
  const back = () => {
    if (snapshotsRef.current.length) window.history.back();
    else if (state.phase === 'support') go(returnToEvent(state));
    else if (state.phase === 'recap' && reviewOnly) go({ ...state, phase: 'entry' });
    else if (state.phase !== 'entry') go({ ...state, phase: state.phase === 'reflect' ? 'tackle' : state.phase === 'prepare' ? 'entry' : state.phase === 'plan' ? 'prepare' : 'plan' });
    else exit();
  };
  const reveal = () => requestAnimationFrame(() => revealRef.current?.focus({ preventScroll: false }));
  const saveRecap = () => {
    try { const saved = saveTaraRecap(state); setRecaps(saved.recaps); setState(saved.draft); setSaveStatus('saved'); setError(''); }
    catch (error) { setSaveStatus('error'); setError(error.message || 'Your recap could not be saved.'); }
  };
  const finish = () => {
    if (reviewOnly || state.completionReported) { onExit?.(); return; }
    if (completedRef.current) return;
    completedRef.current = true;
    try { saveTaraDraft({ ...state, completionReported: true }); } catch { /* The host session remains the source of truth if persistence fails. */ }
    onAttemptEvent?.({ interventionId: TARA_ID, action: 'completed', exitReason: 'completed', completedPercentage: 1, startedAt: startedRef.current, timestamp: Date.now() });
    onComplete?.({ interventionId: TARA_ID, skipReflection: true, outcome: taraCompletion(state) });
  };
  const remove = () => {
    try { clearTara(); setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setError(''); setReviewOnly(false); completedRef.current = false; snapshotsRef.current = []; setDeleting(false); }
    catch (error) { setError(error.message); setSaveStatus('error'); }
  };
  const live = ['tackle', 'support'].includes(state.phase);
  const event = EVENTS.find(item => item.id === state.event);
  const stage = stageFor(state.phase);

  return <div className={`tara ${live ? 'tara--live' : ''}`} data-reduced-motion={prefs.reducedMotion || undefined} data-intervention={TARA_ID}>
    <div className="px-4 pt-2 text-center"><JourneyOptions id={TARA_ID} /></div>
    <header className="tara-header"><button className="tara-icon" onClick={back} aria-label="Go back"><ArrowLeft size={21} /></button><div><span>Mentication</span><p>Tara Tactician</p></div><button className="tara-icon" onClick={exit} aria-label="Exit Tara"><X size={21} /></button></header>
    <nav className="tara-stages" aria-label="Intervention progress">{STAGES.map((name, index) => <span key={name} aria-current={stage === index ? 'step' : undefined}>{name}</span>)}</nav>
    <main className="tara-main">
      <div className="tara-intro"><div><p className="tara-eyebrow">{live ? 'In the moment' : state.phase === 'recap' ? 'Your reflection' : 'Small steps. Your pace.'}</p><h1 ref={headingRef} tabIndex={-1}>{TITLES[state.phase]}</h1></div><div className="tara-portrait"><img src="/media/brand/tara-tactician.webp" alt="Tara, a chestnut and white spaniel wearing teal tactical gear" /></div></div>
      <div className="tara-content">
        {state.phase === 'entry' && <><p className="tara-lead">Prepare for a difficult moment, try a first move, and keep support close when it happens.</p><div className="tara-stack"><Action onClick={() => { setReviewOnly(false); go({ ...newTaraState(), phase: 'prepare', entryMode: 'prepare' }); }}>Prepare for something</Action><Action secondary onClick={() => { setReviewOnly(false); go({ ...newTaraState(), phase: 'support', entryMode: 'live', support: 'overwhelmed', eventStatus: 'in-progress' }); }}>I’m in it now</Action></div><p className="tara-note">Your draft stays on this device. Saved recaps are optional. Clear Tara data whenever you want.</p>{recaps.length > 0 && <details className="tara-card"><summary>Your saved recaps</summary><div className="tara-stack">{recaps.map(record => <button key={record.id} className="tara-choice" onClick={() => { setReviewOnly(true); go(record); }}>{record.situation || EVENTS.find(item => item.id === record.event)?.label || 'A difficult moment'}<span>{COMPARISONS.find(([value]) => value === record.comparison)?.[1]}</span></button>)}</div></details>}</>}
        {state.phase === 'prepare' && <><p className="tara-lead">Choose the closest fit. You can keep the details to yourself.</p><fieldset className="tara-group"><legend>The situation</legend><div className="tara-choice-grid">{EVENTS.map(item => <button key={item.id} className="tara-choice" aria-pressed={state.event === item.id} onClick={() => { setState(value => chooseEvent(value, item.id)); reveal(); }}>{item.label}</button>)}</div></fieldset>{event && <section ref={!state.challenge ? revealRef : undefined} tabIndex={-1} className="tara-reveal"><fieldset className="tara-group"><legend>What feels difficult?</legend><div className="tara-stack">{event.challenges.map(challenge => <button key={challenge} className="tara-choice" aria-pressed={state.challenge === challenge} onClick={() => { setState(value => chooseChallenge(value, challenge)); reveal(); }}>{challenge}</button>)}</div></fieldset></section>}{state.challenge && <section ref={revealRef} tabIndex={-1} className="tara-card tara-reveal" aria-label="Your prediction"><p className="tara-eyebrow">A prediction to check</p><Field name="prediction" label="What might happen?" hint="This is a possibility, not a fact. Keep or change the suggestion." value={state.prediction} inputRef={predictionRef} onChange={prediction => edit({ prediction, predictionEdited: true })} /><label className="tara-select-label" htmlFor="tara-likelihood">How likely does it feel? (optional)</label><select id="tara-likelihood" value={state.likelihood} onChange={e => edit({ likelihood: e.target.value })}><option value="">Not rated</option><option value="unlikely">Unlikely</option><option value="possible">Possible</option><option value="likely">Likely</option><option value="unsure">I’m not sure</option></select><Field name="situation" label="A name for this situation (optional)" value={state.situation} onChange={situation => edit({ situation })} rows={1} /><div className="tara-stack"><Action disabled={!state.prediction.trim()} onClick={() => go(preparePlan(state))}>That fits — make my plan</Action><Action secondary onClick={() => predictionRef.current?.focus()}>Change the prediction</Action></div></section>}</>}
        {state.phase === 'plan' && <><p className="tara-lead">These are starting points. Change anything so it sounds like you.</p><div className="tara-card">{Object.entries(PLAN_LABELS).map(([key, label]) => <Field key={key} name={`plan-${key}`} label={label} value={state.plan[key]} onChange={value => edit({ plan: { ...state.plan, [key]: value } })} />)}</div><div className="tara-stack"><Action onClick={() => go(beginTackle(state))}>Use my plan</Action><Action secondary onClick={() => go({ ...state, phase: 'rehearse' })}>Rehearse once (optional)</Action><Action secondary onClick={exit}>Keep my plan for later</Action></div></>}
        {state.phase === 'rehearse' && <><p className="tara-lead">Imagine the moment arriving. Try your first sentence or move, aloud or quietly. No timer and no perfect performance.</p><div className="tara-card"><p className="tara-eyebrow">Your first move</p><p className="tara-quote">{state.plan.do}</p><Field name="rehearsal" label="Words I want to try (optional)" value={state.rehearsal} onChange={rehearsal => edit({ rehearsal })} /></div><div className="tara-stack"><Action onClick={() => go(beginTackle({ ...state, rehearsed: true }))}>I tried it — use my plan</Action><Action secondary onClick={() => go(beginTackle(state))}>Skip rehearsal and use my plan</Action><Action secondary onClick={() => go({ ...state, phase: 'plan' })}>Adjust my plan</Action></div></>}
        {state.phase === 'tackle' && <><p className="tara-lead">Keep this nearby if useful. You can leave the screen and return to your plan.</p><div className="tara-card"><p className="tara-eyebrow">Your plan, close by</p><Plan state={state} /></div><fieldset className="tara-group"><legend>What would help right now?</legend><div className="tara-stack">{[['racing', 'My mind is racing'], ['overwhelmed', 'I feel overwhelmed'], ['step-out', 'I want to step out']].map(([support, label]) => <button key={support} className="tara-choice" onClick={() => go({ ...state, phase: 'support', support })}>{label}</button>)}</div></fieldset><div className="tara-stack"><Action onClick={() => go({ ...state, phase: 'reflect', actual: '', comparison: '', eventStatus: state.eventStatus === 'stepped-out' ? 'stepped-out' : 'unknown', actualActionConfirmed: state.eventStatus === 'stepped-out' })}>Event finished</Action><Action secondary onClick={() => go({ ...state, phase: 'plan' })}>Adjust my plan</Action><Action secondary onClick={exit}>Leave and return later</Action></div></>}
        {state.phase === 'support' && <><div className="tara-card"><Compass aria-hidden="true" className="tara-support-icon" /><h2>{SUPPORT[state.support || 'overwhelmed'].title}</h2><p>{SUPPORT[state.support || 'overwhelmed'].body}</p><p className="tara-support-prompt">{SUPPORT[state.support || 'overwhelmed'].prompt}</p>{state.plan.do && <p><strong>Your next step:</strong> {state.plan.do}</p>}</div><div className="tara-stack">{state.support === 'step-out' ? <><Action secondary onClick={() => go({ ...state, support: 'overwhelmed' })}>Stay with support</Action><Action secondary onClick={() => go({ ...state, phase: 'tackle', support: '', eventStatus: 'stepped-out' })}>Step out intentionally</Action></> : <Action onClick={() => go(returnToEvent(state))}>Back to event</Action>}<Action secondary onClick={() => go({ ...state, phase: 'reflect', comparison: '', actual: '', eventStatus: state.eventStatus === 'stepped-out' ? 'stepped-out' : 'unknown', actualActionConfirmed: state.eventStatus === 'stepped-out' })}>Event finished</Action><Action secondary onClick={() => go({ ...state, phase: 'prepare' })}>Make or adjust a plan</Action></div></>}
        {state.phase === 'reflect' && <><p className="tara-lead">It can have been easier, harder, or still unclear. A prediction and an observation can differ.</p><div className="tara-card"><p className="tara-eyebrow">What I predicted</p><p>{state.prediction || 'No prediction recorded.'}</p><Field name="actual" label="What actually happened? (optional)" value={state.actual} onChange={actual => edit({ actual })} /><label className="tara-select-label" htmlFor="tara-event-status">What did you do?</label><select id="tara-event-status" value={state.actualActionConfirmed ? state.eventStatus : ""} onChange={e => edit({ eventStatus: e.target.value, actualActionConfirmed: true })}><option value="" disabled>Choose or say you’re unsure</option><option value="finished">I took part (all or some)</option><option value="stepped-out">I stepped out intentionally</option><option value="not-attempted">I did not attempt it</option><option value="unknown">I’m not sure how to describe it</option></select></div><fieldset className="tara-group"><legend>Compared with my prediction</legend><div className="tara-stack">{COMPARISONS.map(([comparison, label]) => <button key={comparison} className="tara-choice" aria-pressed={state.comparison === comparison} onClick={() => edit({ comparison })}>{label}</button>)}</div></fieldset><Field name="learning" label="What would I keep or change? (optional)" value={state.learning} onChange={learning => edit({ learning })} /><Field name="next-step" label="My next small step (optional)" value={state.nextStep} onChange={nextStep => edit({ nextStep })} /><Action disabled={!state.comparison || !state.actualActionConfirmed} onClick={() => go(confirmReflection(state))}>Confirm my reflection</Action></>}
        {state.phase === 'recap' && <><p className="tara-lead">A record of what you reported. You do not need to turn it into a positive ending.</p><div className="tara-card tara-recap"><dl><div><dt>I predicted</dt><dd>{state.prediction || 'Not recorded.'}</dd></div><div><dt>I observed</dt><dd>{state.actual || 'Not recorded.'}</dd></div><div><dt>My comparison</dt><dd>{COMPARISONS.find(([value]) => value === state.comparison)?.[1]}</dd></div><div><dt>My action</dt><dd>{{ finished: 'Took part in all or some of the event', 'stepped-out': 'Stepped out intentionally', 'not-attempted': 'Did not attempt it', unknown: 'Still unclear' }[state.eventStatus]}</dd></div>{state.learning && <div><dt>Keep or change</dt><dd>{state.learning}</dd></div>}{state.nextStep && <div><dt>Next small step</dt><dd>{state.nextStep}</dd></div>}</dl></div><div className="tara-stack">{!reviewOnly && <Action secondary disabled={state.saved} onClick={saveRecap}>{state.saved ? <><Check size={18} aria-hidden="true" /> Recap saved on this device</> : 'Save recap on this device (optional)'}</Action>}<Action onClick={finish}>{reviewOnly || state.completionReported ? 'Close recap' : 'Finish'}</Action>{!reviewOnly && <Action secondary onClick={() => go({ ...state, phase: 'reflect' })}>Edit my reflection</Action>}</div></>}
        <details className="tara-why"><summary>Why this helps</summary><p>Writing down a prediction and a small plan can make a difficult moment easier to approach. Rehearsal lets you try a first move. Comparing your prediction with what you actually observed gives you information for next time; it does not guarantee a particular outcome.</p><p>Tara uses built-in guidance, not a live AI chat. Choose only actions that fit your situation.</p></details>
      </div>
      <footer className="tara-footer"><p role="status" aria-live="polite">{reviewOnly ? 'Viewing a saved recap.' : saveStatus === 'saved' ? 'Draft saved on this device.' : saveStatus === 'error' ? 'Changes are not confirmed saved.' : 'No draft saved yet.'}</p>{saveStatus === 'error' && <div className="tara-error" role="alert"><p>{error}</p>{state.phase !== 'entry' && <button className="tara-text-button" onClick={() => { try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); } catch (error) { setError(error.message); } }}>Try saving again</button>}</div>}<button ref={deleteButtonRef} className="tara-text-button" onClick={() => setDeleting(true)}>Clear Tara data</button></footer>
    </main>
    {deleting && <div className="tara-overlay" onKeyDown={event => { if (event.key === 'Escape') { setDeleting(false); deleteButtonRef.current?.focus(); } if (event.key === 'Tab') { const buttons = Array.from(event.currentTarget.querySelectorAll('button')); if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); } } }}><section className="tara-card tara-dialog" role="dialog" aria-modal="true" aria-labelledby="tara-delete-title"><h2 id="tara-delete-title">Clear Tara data?</h2><p>This deletes your Tara draft and saved recaps from this device.</p><div className="tara-stack"><Action secondary onClick={() => { setDeleting(false); deleteButtonRef.current?.focus(); }}>Keep my data</Action><button ref={deleteRef} className="tara-action" onClick={remove}>Delete Tara data</button></div>{saveStatus === 'error' && <p role="alert">{error}</p>}</section></div>}
  </div>;
}
