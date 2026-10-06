import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, MessageCircle, MoreHorizontal, Pencil, Shield, X } from 'lucide-react';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { COMPARISONS, EVENTS, PREDICTION_RESULTS, TARA_ID, beginTackle, chooseChallenge, chooseEvent, confirmReflection, newTaraState, preparePlan, returnToEvent, taraCompletion } from '@/lib/taraTacticianState';
import { chooseRehearsalResponse, chooseTaraMove, tacticFor } from '@/lib/taraTactics';
import { clearTara, loadTara, saveTaraDraft, saveTaraRecap } from '@/lib/taraTacticianStorage';
import '@/styles/tara-tactician.css';

const PLAN_LABELS = { mind: 'Mind may say', notice: 'What I might notice', do: 'My next move', spikes: 'If it gets difficult' };
const STAGES = ['Prepare', 'Rehearse', 'Tackle', 'Reflect'];
const stageFor = phase => ['entry', 'prepare', 'plan'].includes(phase) ? 0 : phase === 'rehearse' ? 1 : ['tackle', 'support'].includes(phase) ? 2 : 3;
const TITLES = { prepare: 'What are you facing?', plan: 'Your move, ready.', rehearse: 'Try the moment.', tackle: 'Your next move.', support: 'A cue for right now.', reflect: 'What happened?', recap: 'What you learned.' };
const ACTION_LABELS = { finished: 'Took part in all or some', 'stepped-out': 'Stepped out intentionally', 'not-attempted': 'Did not attempt it', unknown: 'Still unclear' };
const SUPPORT = {
  racing: { title: 'Find my words', cue: '“Give me a moment to find the words.”', purpose: 'A pause gives you room to return to one point. You do not have to fill the silence.' },
  overwhelmed: { title: 'Make it smaller', cue: 'Choose just one thing to deal with next.', purpose: 'Let the other demands wait while you name one manageable action. Asking for practical help is an option.' },
  'step-out': { title: 'Choose my pace', cue: '“I need to pause. I’ll decide when to return.”', purpose: 'Staying with support and stepping out intentionally are both available. Neither is a failure.' },
};
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function Action({ children, onClick, secondary = false, disabled = false }) {
  return <button type="button" className={`tara-action ${secondary ? 'tara-action--secondary' : ''}`} onClick={onClick} disabled={disabled}>{children}{!secondary && <ArrowRight size={18} aria-hidden="true" />}</button>;
}
function Portrait({ className = '' }) {
  return <div className={`tara-character ${className}`}><div className="tara-character-arch" aria-hidden="true" /><img src="/media/brand/tara-tactician.webp" alt="Tara, your spaniel guide in teal tactical gear" /></div>;
}
function Wording({ value, fallback = 'Not recorded.' }) {
  if (!value) return <p className="tara-wording">{fallback}</p>;
  if (value.length <= 220) return <p className="tara-wording">{value}</p>;
  return <div><p className="tara-wording">{value.slice(0, 180)}…</p><details className="tara-long-wording"><summary>Read the full wording</summary><p>{value}</p></details></div>;
}
function EditButton({ label, onClick }) {
  return <button className="tara-edit" type="button" onClick={onClick}><Pencil size={14} aria-hidden="true" />{label}</button>;
}
function Dialog({ title, onClose, children, description }) {
  const root = useRef(null); const previous = useRef(null);
  useEffect(() => {
    previous.current = document.activeElement;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (root.current?.querySelector('textarea, input, select') || root.current?.querySelector('button'))?.focus();
    return () => { document.body.style.overflow = original; previous.current?.focus?.(); };
  }, []);
  return <div className="tara-overlay" onKeyDown={event => {
    if (event.key === 'Escape') onClose();
    if (event.key !== 'Tab') return;
    const items = Array.from(root.current.querySelectorAll('button:not(:disabled), textarea, select, summary, input, [tabindex="0"]'));
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
  }}><section ref={root} className="tara-dialog" role="dialog" aria-modal="true" aria-labelledby="tara-dialog-title"><div className="tara-dialog-header"><h2 id="tara-dialog-title">{title}</h2><button className="tara-icon" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>{description && <p className="tara-muted">{description}</p>}{children}</section></div>;
}
function Editor({ label, value, onSave, onClose }) {
  const [draft, setDraft] = useState(value || '');
  return <Dialog title={label} onClose={onClose} description="Use your own words. A short line is enough."><label htmlFor="tara-edit-field" className="tara-sr-only">{label}</label><textarea id="tara-edit-field" rows={4} maxLength={3000} value={draft} onChange={event => setDraft(event.target.value)} /><div className="tara-stack"><Action onClick={() => onSave(draft)}>Keep this wording</Action><Action secondary onClick={onClose}>Cancel</Action></div></Dialog>;
}
function BackupPlan({ state, edit }) {
  return <details className="tara-details"><summary>My prediction & backup plan</summary><div className="tara-detail-body"><div className="tara-detail-row"><span>My prediction</span><Wording value={state.prediction} fallback="No prediction recorded." /><EditButton label="Edit prediction" onClick={() => edit('prediction', 'My prediction')} /></div>{['mind', 'notice', 'spikes'].map(key => <div className="tara-detail-row" key={key}><span>{PLAN_LABELS[key]}</span><Wording value={state.plan[key]} /><EditButton label={`Edit ${PLAN_LABELS[key].toLowerCase()}`} onClick={() => edit(`plan.${key}`, PLAN_LABELS[key])} /></div>)}</div></details>;
}
function MoveCard({ state, value, label = 'My next move', edit }) {
  return <section className="tara-move-card" aria-label={label}><div className="tara-move-label"><Compass size={19} aria-hidden="true" /><span>{label}</span></div><Wording value={value || state.plan.do} fallback='“Let me take a moment.”' />{edit && <EditButton label="Edit my move" onClick={() => edit('plan.do', 'My next move')} />}</section>;
}
function ResultChoices({ value, onChange }) {
  return <fieldset className="tara-group"><legend>Did this prediction happen?</legend><div className="tara-results">{PREDICTION_RESULTS.map(([key, label]) => <button type="button" key={key} className="tara-choice" aria-pressed={value === key} onClick={() => onChange(key)}>{label}</button>)}</div></fieldset>;
}

export default function TaraTacticianExperience({ intervention, sessionId, answers, onAttemptEvent, onComplete, onExit }) {
  const { prefs, setPref } = useAccessibilityPrefs();
  const [initial] = useState(() => { try { return { ...loadTara(), error: '' }; } catch (error) { return { draft: null, recaps: [], error: error.message || 'Device storage is unavailable.' }; } });
  const [state, setState] = useState(() => initial.draft || newTaraState());
  const [recaps, setRecaps] = useState(initial.recaps);
  const [saveStatus, setSaveStatus] = useState(initial.error ? 'error' : initial.draft ? 'saved' : 'idle');
  const [error, setError] = useState(initial.error);
  const [editor, setEditor] = useState(null); const [options, setOptions] = useState(false); const [deleting, setDeleting] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false); const [changingMove, setChangingMove] = useState(false);
  const headingRef = useRef(null); const revealRef = useRef(null); const currentRef = useRef(state);
  const completedRef = useRef(false); const startedRef = useRef(Date.now());
  const historyKeyRef = useRef(uid()); const snapshotsRef = useRef(new Map()); const historyDepthRef = useRef(0);
  currentRef.current = state;
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, tara: { id: currentRef.current.id, phase: currentRef.current.phase, key: historyKeyRef.current } }, '');
    const pop = event => {
      const marker = event.state?.tara;
      if (marker?.id !== currentRef.current.id) return;
      historyKeyRef.current = marker.key || uid();
      const snapshot = snapshotsRef.current.get(marker.key);
      if (snapshot) setState(snapshot);
      else if (marker.phase !== 'recap' || currentRef.current.comparison || currentRef.current.predictionResult) setState(value => ({ ...value, phase: marker.phase }));
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);
      setEditor(null); setOptions(false); setChangingMove(false);
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
  useEffect(() => {
    const erased = () => {
      try { if (loadTara().draft === null) { setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setReviewOnly(false); setEditor(null); setOptions(false); } } catch { /* Preserve unreadable data. */ }
    };
    window.addEventListener('mentation:sessions-changed', erased);
    return () => window.removeEventListener('mentation:sessions-changed', erased);
  }, []);
  const editState = patch => setState(value => ({ ...value, ...patch, saved: false }));
  const go = next => {
    snapshotsRef.current.set(historyKeyRef.current, currentRef.current);
    historyKeyRef.current = uid(); historyDepthRef.current += 1;
    window.history.pushState({ ...window.history.state, tara: { id: next.id, phase: next.phase, key: historyKeyRef.current } }, '');
    setChangingMove(false); setState(next);
  };
  const exit = () => {
    if (!reviewOnly && !state.completionReported && state.phase !== 'entry') onAttemptEvent?.({ interventionId: TARA_ID, action: 'exited', exitReason: 'exited', completedPercentage: stageFor(state.phase) / 4, startedAt: startedRef.current, timestamp: Date.now() });
    onExit?.();
  };
  const back = () => {
    if (historyDepthRef.current > 0) window.history.back();
    else if (state.phase === 'entry' || reviewOnly || state.completionReported) exit();
    else go({ ...state, phase: ({ prepare: 'entry', plan: 'prepare', rehearse: 'plan', tackle: 'plan', support: 'tackle', reflect: 'tackle', recap: 'reflect' })[state.phase] || 'entry' });
  };
  const reveal = () => requestAnimationFrame(() => revealRef.current?.focus({ preventScroll: false }));
  const openEditor = (key, label) => {
    const value = key.startsWith('plan.') ? editablePlan[key.slice(5)] || (key === 'plan.do' && live ? '“Let me take a moment.”' : '') : state[key];
    setEditor({ key, label, value });
  };
  const keepEdit = value => {
    const key = editor.key;
    if (key.startsWith('plan.')) editState({ plan: { ...editablePlan, [key.slice(5)]: value }, ...(key === 'plan.do' ? { selectedMoveId: 'custom', rehearsalChoice: '', rehearsalResponse: '' } : {}) });
    else editState({ [key]: value, ...(key === 'prediction' ? { predictionEdited: true } : {}), ...(key === 'rehearsal' ? { rehearsalResponse: value } : {}) });
    setEditor(null);
  };
  const ready = () => ({ ...prepared, experienceVersion: 2, selectedMoveId: state.selectedMoveId || 'suggested' });
  const useMove = () => go(beginTackle(ready()));
  const startRehearsal = () => go({ ...ready(), phase: 'rehearse', rehearsalChoice: '', rehearsalResponse: '' });
  const finishEvent = () => go({ ...state, phase: 'reflect', experienceVersion: 2, predictionResult: '', eventStatus: state.eventStatus === 'stepped-out' ? 'stepped-out' : 'unknown', actualActionConfirmed: state.eventStatus === 'stepped-out' });
  const takeRehearsalMove = tried => {
    const response = state.rehearsalResponse || state.plan.do;
    go(beginTackle({ ...state, plan: { ...state.plan, do: response }, rehearsed: tried || state.rehearsed }));
  };
  const saveRecap = () => {
    try { const saved = saveTaraRecap(state); setRecaps(saved.recaps); setState(saved.draft); setSaveStatus('saved'); setError(''); }
    catch (error) { setSaveStatus('error'); setError(error.message || 'Your recap could not be saved.'); }
  };
  const finish = () => {
    if (reviewOnly || state.completionReported) { onExit?.(); return; }
    if (completedRef.current) return;
    completedRef.current = true;
    try { saveTaraDraft({ ...state, completionReported: true }); } catch { /* Host session remains authoritative. */ }
    onAttemptEvent?.({ interventionId: TARA_ID, action: 'completed', exitReason: 'completed', completedPercentage: 1, startedAt: startedRef.current, timestamp: Date.now() });
    onComplete?.({ interventionId: TARA_ID, skipReflection: true, outcome: taraCompletion(state) });
  };
  const remove = () => {
    try { clearTara(); setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setError(''); setReviewOnly(false); completedRef.current = false; snapshotsRef.current.clear(); historyDepthRef.current = 0; setDeleting(false); }
    catch (error) { setError(error.message); setSaveStatus('error'); }
  };
  const live = ['tackle', 'support'].includes(state.phase); const stage = stageFor(state.phase);
  const event = EVENTS.find(item => item.id === state.event); const tactic = tacticFor(state);
  const prepared = preparePlan(state);
  if (!state.plan.do) prepared.plan.do = tactic.moves[0][2];
  const editablePlan = ['prepare', 'plan'].includes(state.phase) ? prepared.plan : state.plan;
  const hasPreparation = state.phase === 'plan' || Boolean(state.event && state.challenge);
  const recapResult = state.predictionResult ? PREDICTION_RESULTS.find(([value]) => value === state.predictionResult)?.[1] : null;

  const moveChoices = <div className="tara-move-choices"><p className="tara-small-label">Another first move</p>{tactic.moves.map(([id, label, wording]) => <button key={id} className="tara-choice" onClick={() => { setState(value => chooseTaraMove({ ...preparePlan(value), phase: value.phase }, id)); setChangingMove(false); }}><span>{label}</span><small>{wording}</small></button>)}<EditButton label="Write my own move" onClick={() => openEditor('plan.do', 'My next move')} /></div>;
  const planReady = <section ref={revealRef} tabIndex={-1} className="tara-ready tara-reveal" aria-label="Your suggested move">
    <div className="tara-prediction"><div><span className="tara-small-label">My mind predicts</span><Wording value={state.prediction} /><EditButton label="Edit prediction" onClick={() => openEditor('prediction', 'My prediction')} /></div><Portrait className="tara-character--brief" /></div>
    <MoveCard state={prepared} label={state.selectedMoveId ? 'My chosen move' : 'A move to try'} edit={openEditor} />
    <div className="tara-ready-tools"><EditButton label={changingMove ? 'Keep my current move' : 'Choose another move'} onClick={() => setChangingMove(value => !value)} /></div>
    {changingMove && moveChoices}
    <div className="tara-stack"><Action onClick={useMove} disabled={!prepared.plan.do.trim()}>Use this move</Action><Action secondary onClick={startRehearsal} disabled={!prepared.plan.do.trim()}>Rehearse this move (optional)</Action></div>
    <BackupPlan state={prepared} edit={openEditor} />
  </section>;

  return <div className={`tara tara-v2 ${live ? 'tara--live' : ''}`} data-reduced-motion={prefs.reducedMotion || undefined} data-intervention={TARA_ID}>
    <header className="tara-header"><button className="tara-icon" onClick={back} aria-label="Go back"><ArrowLeft size={20} /></button><div><span>Mentication</span><p>Tara Tactician</p></div><div className="tara-header-actions"><button className="tara-icon" onClick={exit} aria-label="Exit Tara"><X size={20} /></button></div></header>
    {state.phase !== 'entry' && <nav className="tara-stages" aria-label="Intervention progress">{STAGES.map((name, index) => <span key={name} aria-current={stage === index ? 'step' : undefined}>{name}</span>)}</nav>}
    <main className={`tara-main ${state.phase === 'entry' ? 'tara-main--welcome' : ''}`}>
      {state.phase === 'entry' ? <>
        <div className="tara-welcome"><div><p className="tara-eyebrow">Your tactical sidekick</p><h1 ref={headingRef} tabIndex={-1}>One small step into something difficult.</h1><p className="tara-lead">Find your first move. Keep support close when the moment comes.</p></div><Portrait className="tara-character--welcome" /></div>
        <div className="tara-stack"><Action onClick={() => { setReviewOnly(false); go({ ...newTaraState(), phase: 'prepare', entryMode: 'prepare' }); }}>Prepare for something</Action><Action secondary onClick={() => { setReviewOnly(false); go({ ...newTaraState(), phase: 'tackle', entryMode: 'live', eventStatus: 'in-progress' }); }}>I’m in it now</Action></div>
        <p className="tara-note">Drafts stay on this device. Saved recaps are your choice.</p>
        {recaps.length > 0 && <details className="tara-details"><summary>Your saved recaps</summary><div className="tara-stack tara-detail-body">{recaps.map(record => <button key={record.id} className="tara-choice" onClick={() => { setReviewOnly(true); go(record); }}>{record.situation || EVENTS.find(item => item.id === record.event)?.label || 'A difficult moment'}<small>{record.predictionResult ? PREDICTION_RESULTS.find(([value]) => value === record.predictionResult)?.[1] : COMPARISONS.find(([value]) => value === record.comparison)?.[1]}</small></button>)}</div></details>}
      </> : <>
        <div className="tara-heading"><p className="tara-eyebrow">{live ? 'In the moment' : state.phase === 'rehearse' ? 'One practice moment' : state.phase === 'recap' ? 'Your own evidence' : event?.label || STAGES[stage]}</p><h1 ref={headingRef} tabIndex={-1}>{hasPreparation && state.phase === 'prepare' ? 'One move is enough.' : TITLES[state.phase]}</h1></div>
        {state.phase === 'prepare' && <>
          {!state.event && <fieldset className="tara-group"><legend className="tara-sr-only">The situation</legend><div className="tara-choice-grid">{EVENTS.map(item => <button key={item.id} className="tara-choice tara-event-choice" onClick={() => { setState(value => chooseEvent(value, item.id)); reveal(); }}><MessageCircle size={21} aria-hidden="true" /><span>{item.label}</span></button>)}</div></fieldset>}
          {state.event && !state.challenge && <section ref={revealRef} tabIndex={-1} className="tara-reveal"><div className="tara-context"><span>{event.label}</span><EditButton label="Change situation" onClick={() => editState({ event: '', challenge: '' })} /></div><fieldset className="tara-group"><legend>What feels difficult?</legend><div className="tara-stack">{event.challenges.map(challenge => <button key={challenge} className="tara-choice" onClick={() => { setState(value => chooseChallenge(value, challenge)); reveal(); }}>{challenge}<ArrowRight size={17} aria-hidden="true" /></button>)}</div></fieldset></section>}
          {hasPreparation && planReady}
        </>}
        {state.phase === 'plan' && planReady}
        {state.phase === 'rehearse' && <section className="tara-rehearsal">
          <div className="tara-scenario"><span className="tara-small-label">Practice cue · imagined, not the real event</span><h2>{tactic.cue}</h2><p>What could you do at this point?</p><Portrait className="tara-character--scenario" /></div>
          {!state.rehearsalChoice ? <div className="tara-stack"><button className="tara-response" onClick={() => { setState(value => chooseRehearsalResponse(value, 'my-move')); reveal(); }}><span>Use my move</span><Wording value={state.rehearsal || state.plan.do} /></button><button className="tara-response" onClick={() => { setState(value => chooseRehearsalResponse(value, 'pause')); reveal(); }}><span>Give myself a pause</span><Wording value={tactic.pause} /></button><Action secondary onClick={() => go(beginTackle(state))}>Skip rehearsal</Action></div> : <section ref={revealRef} tabIndex={-1} className="tara-reveal tara-stack"><MoveCard state={state} value={state.rehearsalResponse} label="The response I chose" /><p className="tara-purpose">{state.rehearsalChoice === 'pause' ? 'A pause creates room to decide your next step.' : tactic.purpose} Try it aloud, silently, or as a small action. No one is grading it.</p><Action onClick={() => takeRehearsalMove(true)}>I tried it — take this move</Action><Action secondary onClick={() => takeRehearsalMove(false)}>Take this move without practising</Action><EditButton label="Choose a different response" onClick={() => editState({ rehearsalChoice: '', rehearsalResponse: '' })} /><EditButton label="Use my own practice words" onClick={() => openEditor('rehearsal', 'My practice words')} /></section>}
        </section>}
        {state.phase === 'tackle' && <section className="tara-live-hub">
          <MoveCard state={state} label={state.plan.do ? 'My next move' : 'A simple move to try'} edit={openEditor} />
          <fieldset className="tara-group"><legend>A little support</legend><div className="tara-support-choices">{Object.entries(SUPPORT).map(([support, content]) => <button key={support} className="tara-support-choice" onClick={() => go({ ...state, phase: 'support', support })}>{support === 'step-out' ? <Shield size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}<span>{content.title}</span></button>)}</div></fieldset>
          <Action secondary onClick={finishEvent}>Event finished</Action>
          <BackupPlan state={state} edit={openEditor} />
          {!state.event && <EditButton label="Choose a more specific move" onClick={() => go({ ...state, phase: 'prepare' })} />}
        </section>}
        {state.phase === 'support' && <section className="tara-support-screen">
          <MoveCard state={state} value={SUPPORT[state.support || 'overwhelmed'].cue} label={SUPPORT[state.support || 'overwhelmed'].title} />
          <p className="tara-purpose">{SUPPORT[state.support || 'overwhelmed'].purpose}</p>
          <div className="tara-stack">{state.support === 'step-out' ? <><Action secondary onClick={() => go({ ...state, support: 'overwhelmed' })}>Stay with support</Action><Action secondary onClick={() => go({ ...state, phase: 'tackle', support: '', eventStatus: 'stepped-out' })}>Step out intentionally</Action></> : <Action onClick={() => go(returnToEvent(state))}>Back to event</Action>}<Action secondary onClick={finishEvent}>Event finished</Action></div>
        </section>}
        {state.phase === 'reflect' && <section className="tara-reflection">
          <div className="tara-evidence"><div><span className="tara-small-label">I predicted</span><Wording value={state.prediction} fallback="No prediction recorded." /></div><div><span className="tara-small-label">I observed</span><Wording value={state.actual} fallback="What did you notice in the real situation?" /><EditButton label={state.actual ? 'Edit what happened' : 'Add what happened (optional)'} onClick={() => openEditor('actual', 'What actually happened?')} /></div></div>
          <div className="tara-action-status"><label htmlFor="tara-event-status">What did I do?</label><select id="tara-event-status" value={state.actualActionConfirmed ? state.eventStatus : ''} onChange={event => editState({ eventStatus: event.target.value, actualActionConfirmed: true })}><option value="" disabled>Choose an answer</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <ResultChoices value={state.predictionResult} onChange={predictionResult => editState({ experienceVersion: 2, predictionResult })} />
          <Action disabled={!state.predictionResult || !state.actualActionConfirmed} onClick={() => go(confirmReflection({ ...state, experienceVersion: 2 }))}>Keep this reflection</Action>
          <p className="tara-note">Whether the prediction happened is separate from how difficult the moment felt.</p>
        </section>}
        {state.phase === 'recap' && <section className="tara-recap">
          <div className="tara-evidence"><div><span className="tara-small-label">I predicted</span><Wording value={state.prediction} /></div><div><span className="tara-small-label">I observed</span><Wording value={state.actual} /></div></div>
          <div className="tara-result"><Check size={20} aria-hidden="true" /><div><span className="tara-small-label">{recapResult ? 'What I reported' : 'Earlier difficulty comparison'}</span><p>{recapResult || COMPARISONS.find(([value]) => value === state.comparison)?.[1]}</p><small>{ACTION_LABELS[state.eventStatus]}</small></div></div>
          <details className="tara-details"><summary>What I want to carry forward</summary><div className="tara-detail-body"><Wording value={state.learning} fallback="One thing I might keep or change." />{!reviewOnly && <EditButton label="Add or edit my learning" onClick={() => openEditor('learning', 'What I want to keep or change')} />}<Wording value={state.nextStep} fallback="My next step can stay undecided." />{!reviewOnly && <EditButton label="Add or edit my next step" onClick={() => openEditor('nextStep', 'My next small step')} />}</div></details>
          <div className="tara-stack">{!reviewOnly && <Action secondary disabled={state.saved} onClick={saveRecap}>{state.saved ? 'Recap saved on this device' : 'Save recap on this device (optional)'}</Action>}<Action onClick={finish}>{reviewOnly || state.completionReported ? 'Close recap' : 'Finish'}</Action>{!reviewOnly && !state.completionReported && <EditButton label="Edit my reflection" onClick={() => go({ ...state, phase: 'reflect', experienceVersion: 2 })} />}</div>
        </section>}
      </>}
      <footer className="tara-footer"><p role="status" aria-live="polite">{reviewOnly ? 'Viewing a saved recap.' : saveStatus === 'saved' ? 'Draft saved on this device.' : saveStatus === 'error' ? 'Changes are not confirmed saved.' : 'Your pace. One move at a time.'}</p>{saveStatus === 'error' && <div className="tara-error" role="alert"><p>{error}</p>{state.phase !== 'entry' && <button className="tara-text-button" onClick={() => { try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); } catch (error) { setError(error.message); } }}>Try saving again</button>}</div>}<button className="tara-icon" onClick={() => setOptions(true)} aria-label="Tara options"><MoreHorizontal size={20} /></button></footer>
    </main>
    {editor && <Editor key={editor.key} {...editor} onSave={keepEdit} onClose={() => setEditor(null)} />}
    {options && <Dialog title="Your pace, your choices" onClose={() => setOptions(false)}><details className="tara-details"><summary>Why this helps</summary><div className="tara-detail-body"><p>A specific first move gives you something practical to return to. A short rehearsal lets you try that move before the real moment.</p><p>Afterwards, compare your prediction with your own observations. Neither a difficult outcome nor stepping out is a failure.</p><p>These are built-in practice cues, not a live AI conversation or an assessment of your performance.</p></div></details><button className="tara-choice" aria-pressed={prefs.reducedMotion} onClick={() => setPref('reducedMotion', !prefs.reducedMotion)}>Reduce motion: {prefs.reducedMotion ? 'on' : 'off'}</button><button className="tara-choice" onClick={() => { setOptions(false); setDeleting(true); }}>Clear Tara data</button><Action secondary onClick={() => { setOptions(false); exit(); }}>Leave and return later</Action></Dialog>}
    {deleting && <Dialog title="Clear Tara data?" onClose={() => setDeleting(false)} description="This deletes your Tara draft and saved recaps from this device."><div className="tara-stack"><Action secondary onClick={() => setDeleting(false)}>Keep my data</Action><Action onClick={remove}>Delete Tara data</Action></div>{saveStatus === 'error' && <p role="alert">{error}</p>}</Dialog>}
  </div>;
}
