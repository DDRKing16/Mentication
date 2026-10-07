import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, MoreHorizontal, Pencil, X } from 'lucide-react';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { COMPARISONS, EVENTS, PHASES, PREDICTION_RESULTS, TARA_ID, beginTackle, chooseChallenge, chooseEvent, confirmReflection, newTaraState, returnToEvent, taraCompletion } from '@/lib/taraTacticianState';
import { chooseTaraMove, tacticFor } from '@/lib/taraTactics';
import { choosePracticeResponse, chooseTaraNextStep, confirmPracticeTry, guidanceFor, keepUnpractisedPlan, practiceOptions, startTaraPractice } from '@/lib/taraGuidance';
import { clearTara, loadTara, saveTaraDraft, saveTaraRecap } from '@/lib/taraTacticianStorage';
import { atScreen, GET_THROUGH_TITLE, previousScreen, resumeFromEntry, screenFor } from '@/lib/getThroughFlow';
import '@/styles/tara-tactician.css';

const STAGES = ['Prepare', 'Practise', 'Get through', 'Reflect'];
const stageFor = phase => ['entry', 'prepare', 'plan'].includes(phase) ? 0 : ['rehearse', 'ready'].includes(phase) ? 1 : ['tackle', 'support'].includes(phase) ? 2 : 3;
const ACTION_LABELS = { finished: 'Took part in all or some', 'stepped-out': 'Stepped out intentionally', 'not-attempted': 'Did not attempt it', unknown: 'I’m not sure yet' };
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const USABILITY = [['usable', 'I can use this'], ['adjust', 'I want to adjust it'], ['unsure', 'I’m not sure yet']];
function Action({ children, onClick, secondary = false, disabled = false }) {
  return <button type="button" data-primary-action={!secondary || undefined} className={`tara-action ${secondary ? 'tara-action--secondary' : ''}`} onClick={onClick} disabled={disabled}>{children}{!secondary && <ArrowRight size={18} aria-hidden="true" />}</button>;
}
function Portrait({ className = '', decorative = false }) {
  return <div className={`tara-character ${className}`} aria-hidden={decorative || undefined}><div className="tara-character-orbit" /><img src="/media/brand/tara-tactician.webp" alt={decorative ? '' : 'Tara, your spaniel guide in teal tactical gear'} /></div>;
}
function Wording({ value, fallback = 'No wording added.' }) {
  if (!value) return <p className="tara-wording tara-muted">{fallback}</p>;
  if (value.length <= 220) return <p className="tara-wording">{value}</p>;
  return <div><p className="tara-wording">{value.slice(0, 180)}…</p><details className="tara-long-wording"><summary>Read the full wording</summary><p>{value}</p></details></div>;
}
function EditButton({ label, onClick }) { return <button className="tara-edit" type="button" onClick={onClick}><Pencil size={14} aria-hidden="true" />{label}</button>; }
function Dialog({ title, onClose, children, description }) {
  const root = useRef(null); const previous = useRef(null);
  useEffect(() => {
    previous.current = document.activeElement; const original = document.body.style.overflow; document.body.style.overflow = 'hidden';
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
  return <Dialog title={label} onClose={onClose} description="A short line is enough. Keep the words that sound like you."><label htmlFor="tara-edit-field" className="tara-sr-only">{label}</label><textarea id="tara-edit-field" rows={4} maxLength={3000} value={draft} onChange={event => setDraft(event.target.value)} /><div className="tara-stack"><Action onClick={() => onSave(draft)}>Keep this wording</Action><Action secondary onClick={onClose}>Cancel</Action></div></Dialog>;
}
function Coach({ label = 'Tara’s cue', children, scene = false }) {
  return scene ? <section className="tara-coach tara-coach--scene"><div className="tara-scene-header"><span className="tara-small-label">{label}</span><Portrait decorative className="tara-character--scene" /></div><div className="tara-scene-cue">{children}</div></section> : <section className="tara-coach"><div className="tara-coach-copy"><span className="tara-small-label">{label}</span>{children}</div><Portrait decorative className="tara-character--coach" /></section>;
}
function MoveCard({ value, label, edit, editLabel = 'Edit my move', fallback = 'No wording recorded.' }) {
  return <section className="tara-move-card" aria-label={label}><div className="tara-move-label"><Compass size={18} aria-hidden="true" /><span>{label}</span></div><Wording value={value} fallback={fallback} />{edit && <EditButton label={editLabel} onClick={edit} />}</section>;
}

function Link({ children, onClick }) { return <button type="button" className="tara-text-button" onClick={onClick}>{children}</button>; }
function Answers({ items, value, onChange, name }) {
  return <fieldset className="tara-group"><legend className="tara-sr-only">Choose an answer</legend><div className="tara-stack">{items.map(([id, label, detail]) => <label className={'tara-choice tara-answer-choice' + (value === id ? ' is-selected' : '')} key={id}><input type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} /><span className="tara-choice-copy"><span>{label}</span>{detail && <small>{detail}</small>}</span></label>)}</div></fieldset>;
}

export default function TaraTacticianExperience({ intervention, sessionId, answers, onAttemptEvent, onComplete, onExit }) {
  const { prefs, setPref } = useAccessibilityPrefs();
  const [initial] = useState(() => { try { return { ...loadTara(), error: '' }; } catch (error) { return { draft: null, recaps: [], error: error.message || 'Device storage is unavailable.' }; } });
  const [state, setState] = useState(() => initial.draft || newTaraState()); const [recaps, setRecaps] = useState(initial.recaps);
  const [saveStatus, setSaveStatus] = useState(initial.error ? 'error' : initial.draft ? 'saved' : 'idle'); const [error, setError] = useState(initial.error);
  const [editor, setEditor] = useState(null); const [options, setOptions] = useState(false); const [deleting, setDeleting] = useState(false); const [newPlanMode, setNewPlanMode] = useState(null);
  const [reviewOnly, setReviewOnly] = useState(false);
  const headingRef = useRef(null); const currentRef = useRef(state); const completedRef = useRef(false); const startedRef = useRef(Date.now());
  const historyKeyRef = useRef(uid()); const snapshotsRef = useRef(new Map()); const historyDepthRef = useRef(0);
  currentRef.current = state;
  const screen = screenFor(state);
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, tara: { id: currentRef.current.id, phase: currentRef.current.phase, screen: screenFor(currentRef.current), key: historyKeyRef.current } }, '');
    const pop = event => {
      if (currentRef.current.completionReported) return;
      const marker = event.state?.tara; if (marker?.id !== currentRef.current.id || !PHASES.includes(marker.phase)) return;
      historyKeyRef.current = marker.key || uid(); const snapshot = snapshotsRef.current.get(marker.key);
      // Back changes navigation, not the latest authored words or confirmed tries.
      setState(value => {
        if (marker.phase === 'recap' && !(value.comparison || value.predictionResult)) return value;
        const restored = { ...value, phase: marker.phase, ...(snapshot ? { prepareView: snapshot.prepareView, support: snapshot.support,
          practice: { ...value.practice, round: snapshot.practice.round, step: snapshot.practice.step } } : {}) };
        return atScreen(restored, snapshot?.screen || marker.screen || screenFor(restored));
      });
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1); setEditor(null); setOptions(false); setNewPlanMode(null);
    };
    window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    if (state.phase === 'entry' || reviewOnly) return;
    try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); } catch (error) { setSaveStatus('error'); setError(error.message || 'This draft could not be saved.'); }
  }, [state, reviewOnly]);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [screen, state.practice.round]);
  useEffect(() => {
    const erased = () => {
      try { if (loadTara().draft === null) { setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setReviewOnly(false); setEditor(null); setOptions(false); completedRef.current = false; snapshotsRef.current.clear(); historyDepthRef.current = 0; setError(''); setNewPlanMode(null); } } catch { /* Preserve unreadable data. */ }
    };
    const changed = event => { if (event.storageArea === window.localStorage && event.newValue === null && (event.key === null || event.key === 'mentation.tara-tactician.v1')) erased(); };
    window.addEventListener('mentation:sessions-changed', erased); window.addEventListener('mentation:tara-cleared', erased); window.addEventListener('storage', changed);
    return () => { window.removeEventListener('mentation:sessions-changed', erased); window.removeEventListener('mentation:tara-cleared', erased); window.removeEventListener('storage', changed); };
  }, []);
  const editState = patch => setState(value => ({ ...value, ...patch, saved: false }));
  const go = next => {
    const previous = currentRef.current;
    snapshotsRef.current.set(historyKeyRef.current, { screen: screenFor(previous), prepareView: previous.prepareView, support: previous.support, practice: { round: previous.practice.round, step: previous.practice.step } });
    historyKeyRef.current = uid(); historyDepthRef.current += 1;
    window.history.pushState({ ...window.history.state, ...(Number.isInteger(window.history.state?.idx) ? { idx: window.history.state.idx + 1 } : {}), tara: { id: next.id, phase: next.phase, screen: screenFor(next), key: historyKeyRef.current } }, '');
    setState(next);
  };
  const nextScreen = (target, patch = {}) => go(atScreen({ ...state, ...patch }, target));
  const exit = () => {
    if (!reviewOnly && !state.completionReported && state.phase !== 'entry') onAttemptEvent?.({ interventionId: TARA_ID, action: 'exited', exitReason: 'exited', completedPercentage: stageFor(state.phase) / 4, startedAt: startedRef.current, timestamp: Date.now() });
    onExit?.();
  };
  const beginNew = () => {
    const fresh = newTaraState(); completedRef.current = false; startedRef.current = Date.now(); setReviewOnly(false); snapshotsRef.current.clear(); historyDepthRef.current = 0; historyKeyRef.current = uid();
    currentRef.current = fresh;
    window.history.replaceState({ ...window.history.state, tara: { id: fresh.id, phase: 'entry', key: historyKeyRef.current } }, '');
    setNewPlanMode(null); go(atScreen(fresh, 'timing'));
  };
  const start = () => { if (state.event || state.situation || state.plan.do || state.actual) setNewPlanMode('prepare'); else beginNew(); };
  const back = () => {
    if (reviewOnly || state.completionReported) exit();
    else if (historyDepthRef.current > 0) window.history.back();
    else if (state.phase === 'entry') exit();
    else go(previousScreen(state));
  };
  const openEditor = (key, label) => {
    const value = key.startsWith('plan.') ? state.plan[key.slice(5)] || (key === 'plan.do' ? '“Let me take a moment.”' : '')
      : key === 'practice' ? state.practice.wordings[state.practice.round] : state[key];
    setEditor({ key, label, value });
  };
  const keepEdit = value => {
    const key = editor.key;
    if (key.startsWith('plan.')) editState({ plan: { ...state.plan, [key.slice(5)]: value }, ...(key === 'plan.do' ? { selectedMoveId: 'custom' } : {}) });
    else if (key === 'practice') {
      const wordings = [...state.practice.wordings]; wordings[state.practice.round] = value;
      editState({ practice: { ...state.practice, wordings }, rehearsalResponse: value, ...(state.practice.round === 0 ? { rehearsal: value } : { plan: { ...state.plan, spikes: value } }) });
    } else editState({ [key]: value, ...(key === 'prediction' ? { predictionEdited: true } : {}), ...(key === 'nextStep' ? { carryChoice: '' } : {}) });
    setEditor(null);
  };
  const selectMove = id => setState(value => ({ ...chooseTaraMove(value, id), experienceVersion: 3 }));
  const pocket = () => go(atScreen(keepUnpractisedPlan({ ...state, plan: { ...state.plan, do: state.plan.do || '“Let me take a moment.”', spikes: state.plan.spikes || guidanceFor(state).backups[0][2] } }), 'ready'));
  const practise = () => go(atScreen(startTaraPractice({ ...state, plan: { ...state.plan, do: state.plan.do || '“Let me take a moment.”', spikes: state.plan.spikes || guidanceFor(state).backups[0][2] } }), 'practice-choose'));
  const finishEvent = () => nextScreen('reflect-action', { experienceVersion: 3, predictionResult: '', actionChoice: '', eventStatus: state.eventStatus === 'stepped-out' ? 'stepped-out' : 'unknown', actualActionConfirmed: false });
  const saveAndLeave = () => { try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); exit(); } catch (error) { setSaveStatus('error'); setError(error.message); } };
  const finish = () => {
    if (reviewOnly || state.completionReported) { onExit?.(); return; } if (completedRef.current) return;
    let record = state;
    if (state.savePreference === 'save') { try { const saved = saveTaraRecap(state); setRecaps(saved.recaps); record = saved.draft; } catch (error) { setSaveStatus('error'); setError(error.message); return; } }
    completedRef.current = true; record = { ...record, completionReported: true }; setState(record);
    try { saveTaraDraft(record); } catch { /* Host session is authoritative if local storage fails. */ }
    onAttemptEvent?.({ interventionId: TARA_ID, action: 'completed', exitReason: 'completed', completedPercentage: 1, startedAt: startedRef.current, timestamp: Date.now() });
    onComplete?.({ interventionId: TARA_ID, skipReflection: true, outcome: taraCompletion(record) });
  };
  const remove = () => { try { clearTara(); setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setError(''); setReviewOnly(false); completedRef.current = false; snapshotsRef.current.clear(); historyDepthRef.current = 0; setDeleting(false); setNewPlanMode(null); } catch (error) { setError(error.message); setSaveStatus('error'); } };
  const live = ['tackle', 'support'].includes(state.phase); const stage = stageFor(state.phase); const event = EVENTS.find(item => item.id === state.event); const tactic = tacticFor(state); const guidance = guidanceFor(state);
  const move = state.plan.do || '“Let me take a moment.”'; const hasDraft = Boolean(state.event || state.plan.do || state.situation || state.prediction || state.actual || state.nextStep || state.rehearsal || state.practice.tried.some(Boolean)); const practice = state.practice;
  const recapResult = state.predictionResult ? PREDICTION_RESULTS.find(([value]) => value === state.predictionResult)?.[1] : COMPARISONS.find(([value]) => value === state.comparison)?.[1];

  const titles = { entry: GET_THROUGH_TITLE, timing: 'When do you need this?', event: 'What are you facing?', challenge: 'What feels difficult?', prediction: 'What are you worried might happen?', move: 'What will you try first?', 'move-confirm': 'Your first move.', 'practice-choose': practice.round === 0 ? 'What will you try here?' : 'What will be your way back?', 'practice-try': 'Try it once.', usability: 'How usable does your plan feel?', ready: 'Your plan is ready.', live: 'What do you need right now?', support: 'Use this next.', pace: 'Would you like to pause the situation?', 'reflect-action': 'What did you actually do?', 'reflect-prediction': 'Did your prediction happen?', 'reflect-observation': 'What happened?', 'next-step': 'What would help next time?', recap: reviewOnly || state.completionReported ? 'Your reflection.' : 'Keep a saved reflection?' };
  const modal = Boolean(editor || options || deleting || newPlanMode);
  const actualChoices = Object.entries(ACTION_LABELS);
  return <div className={'tara tara-one-question' + (live ? ' tara--live' : '')} data-flow-screen={screen} data-reduced-motion={prefs.reducedMotion || undefined} data-intervention={TARA_ID}>
    <header className="tara-header" aria-hidden={modal || undefined}><button className="tara-icon" onClick={back} aria-label="Go back"><ArrowLeft size={20} /></button><div><span>Mentication</span>{screen !== 'entry' && <p>{GET_THROUGH_TITLE}</p>}</div><button className="tara-icon" onClick={exit} aria-label="Exit practice"><X size={20} /></button></header>
    {screen !== 'entry' && <nav className="tara-stages" aria-label="Intervention progress" aria-hidden={modal || undefined}>{STAGES.map((name, index) => <span key={name} aria-current={stage === index ? 'step' : undefined}>{name}</span>)}</nav>}
    <main className="tara-main" aria-hidden={modal || undefined}>
      <div className="tara-heading"><p className="tara-eyebrow">{screen === 'entry' ? 'Difficult situations' : screen.startsWith('practice') ? 'Imagined practice · ' + (practice.round + 1) + ' of 2' : STAGES[stage]}</p><h1 id="tara-question" ref={headingRef} tabIndex={-1}>{titles[screen]}</h1></div>
      <section className="tara-step" aria-labelledby="tara-question">
        {screen === 'entry' && <><p className="tara-lead">Make a small plan for a difficult situation. Keep support close while you get through it.</p><Action onClick={() => hasDraft ? go(resumeFromEntry(state)) : start()}>{hasDraft ? 'Resume my plan' : 'Get started'}</Action>{hasDraft && <Link onClick={() => setNewPlanMode('prepare')}>Start a new plan</Link>}<p className="tara-note">Your words stay on this device.</p>{recaps.length > 0 && <details className="tara-details"><summary>Saved reflections</summary><div className="tara-stack tara-detail-body">{recaps.map(record => <Link key={record.id} onClick={() => { setReviewOnly(true); go(atScreen(record, 'recap')); }}>{record.situation || EVENTS.find(item => item.id === record.event)?.label || 'A difficult situation'}</Link>)}</div></details>}</>}
        {screen === 'timing' && <><Answers name="timing" items={[[ 'prepare', 'Before the situation' ], [ 'live', 'I’m in it now' ]]} value={state.entryMode} onChange={entryMode => editState({ entryMode })} /><Action disabled={!state.entryMode} onClick={() => state.entryMode === 'live' ? go(atScreen(beginTackle(state), 'live')) : nextScreen('event')}>Continue</Action></>}
        {screen === 'event' && <><Answers name="event" items={EVENTS.map(item => [item.id, item.label])} value={state.event} onChange={value => setState(chooseEvent(state, value))} /><Action disabled={!state.event} onClick={() => nextScreen('challenge', { prepareView: 'challenge' })}>Continue</Action><EditButton label="Name this moment (optional)" onClick={() => openEditor('situation', 'Name this moment')} /></>}
        {screen === 'challenge' && <><p className="tara-context">{state.situation || event?.label}</p><Answers name="challenge" items={(event?.challenges || EVENTS[3].challenges).map(value => [value, value])} value={state.challenge} onChange={value => setState({ ...chooseChallenge(state, value), prediction: state.predictionEdited ? state.prediction : '' })} /><Action disabled={!state.challenge} onClick={() => nextScreen('prediction')}>Continue</Action></>}
        {screen === 'prediction' && <><p className="tara-lead">A few words are enough. This is optional.</p><label htmlFor="tara-prediction" className="tara-sr-only">My prediction</label><textarea id="tara-prediction" rows={3} maxLength={3000} placeholder={chooseChallenge({ ...state, predictionEdited: false }, state.challenge).prediction || 'What might happen?'} value={state.prediction} onChange={event => editState({ prediction: event.target.value, predictionEdited: true })} /><Action onClick={() => nextScreen('move', { predictionEdited: true })}>Continue</Action></>}
        {screen === 'move' && <><Answers name="move" items={tactic.moves} value={state.selectedMoveId} onChange={selectMove} />{state.plan.do && state.selectedMoveId === 'custom' && <MoveCard value={move} label="My own move" />}<Action disabled={!state.plan.do} onClick={() => nextScreen('move-confirm')}>Continue</Action><EditButton label="Write my own move" onClick={() => openEditor('plan.do', 'My first move')} /></>}
        {screen === 'move-confirm' && <><MoveCard value={move} label="My first move" edit={() => openEditor('plan.do', 'My first move')} /><Action onClick={practise}>Practise this move</Action><Link onClick={pocket}>Use my plan without practising</Link><Coach><p>{guidance.insight}</p></Coach></>}
        {screen === 'practice-choose' && <><p className="tara-practice-cue">{practice.round === 0 ? tactic.cue : guidance.recovery}</p><Answers name="practice" items={practiceOptions(state).slice(0, practice.round === 0 ? 2 : 3).map(([id, label, wording]) => [id, label, wording])} value={practice.responses[practice.round]} onChange={id => setState(atScreen(choosePracticeResponse(state, id), 'practice-choose'))} /><Action disabled={!practice.responses[practice.round] || !practice.wordings[practice.round].trim()} onClick={() => nextScreen('practice-try', { practice: { ...practice, step: 'try' } })}>Continue</Action><Link onClick={pocket}>Keep my plan without this practice</Link></>}
        {screen === 'practice-try' && <><MoveCard value={practice.wordings[practice.round]} label="Try these words or this action" edit={() => openEditor('practice', 'My practice words')} editLabel="Use my own practice words" /><p className="tara-lead">Try it once, aloud or silently.</p><Action disabled={!practice.wordings[practice.round].trim()} onClick={() => { const tried = confirmPracticeTry(state); go(atScreen(tried, tried.phase === 'ready' ? 'usability' : 'practice-choose')); }}>I tried this</Action><Link onClick={pocket}>Continue without recording a try</Link><Coach><p>{practiceOptions(state).find(([id]) => id === practice.responses[practice.round])?.[3]}</p></Coach></>}
        {screen === 'usability' && <><Answers name="usability" items={USABILITY} value={practice.usability} onChange={usability => editState({ practice: { ...practice, usability } })} /><Action onClick={() => nextScreen('ready')}>Continue</Action><p className="tara-note">You can continue without choosing an answer.</p></>}
        {screen === 'ready' && <><MoveCard value={move} label="My way in" edit={() => openEditor('plan.do', 'My first move')} /><MoveCard value={state.plan.spikes || tactic.pause} label="My way back" edit={() => openEditor('plan.spikes', 'My backup')} editLabel="Edit my backup" /><Action onClick={() => go(atScreen(beginTackle(state), 'live'))}>Use my plan</Action><Link onClick={saveAndLeave}>Save plan & leave for now</Link><p className="tara-note">{practice.tried.every(Boolean) ? 'You confirmed trying both practice moments.' : state.rehearsed ? 'Earlier practice is recorded; these words remain editable.' : 'No practice try is recorded.'}</p></>}
        {screen === 'live' && <><Answers name="support" items={[[ 'racing', 'Find my words' ], [ 'overwhelmed', 'Make it smaller' ], [ 'step-out', 'Choose my pace' ]]} value={state.support} onChange={support => editState({ support })} /><Action disabled={!state.support} onClick={() => nextScreen(state.support === 'step-out' ? 'pace' : 'support')}>Show support</Action><Link onClick={finishEvent}>I’m finished or paused — reflect</Link><MoveCard value={move} label="My first move" /></>}
        {screen === 'support' && <><MoveCard value={state.support === 'racing' ? state.plan.spikes || tactic.pause : guidance.smaller} label={state.support === 'racing' ? 'Find my words' : 'Make it smaller'} /><Action onClick={() => go(atScreen(returnToEvent(state), 'live'))}>Back to my situation</Action><Coach><p>Use this step, then return to your situation when you choose.</p></Coach></>}
        {screen === 'pace' && <><Answers name="pace" items={[[ 'stay', 'Stay with my plan' ], [ 'pause', 'Step out intentionally' ]]} value={state.paceChoice} onChange={paceChoice => editState({ paceChoice })} /><Action disabled={!state.paceChoice} onClick={() => go(atScreen({ ...returnToEvent(state), ...(state.paceChoice === 'pause' ? { eventStatus: 'stepped-out' } : {}) }, 'live'))}>Continue</Action><Coach><p>You can change the pace without losing your plan.</p></Coach></>}
        {screen === 'reflect-action' && <><Answers name="actual-action" items={actualChoices} value={state.actionChoice || (state.actualActionConfirmed ? state.eventStatus : '')} onChange={actionChoice => editState({ actionChoice })} /><Action disabled={!(state.actionChoice || state.actualActionConfirmed)} onClick={() => nextScreen('reflect-prediction', { eventStatus: state.actionChoice || state.eventStatus, actualActionConfirmed: true })}>Continue</Action></>}
        {screen === 'reflect-prediction' && <><MoveCard value={state.prediction} label="My prediction" fallback="No prediction recorded." /><Answers name="prediction-result" items={state.prediction ? PREDICTION_RESULTS : PREDICTION_RESULTS.filter(([value]) => ['not-tested', 'unsure'].includes(value))} value={state.predictionResult} onChange={predictionResult => editState({ predictionResult })} /><Action disabled={!state.predictionResult} onClick={() => nextScreen('reflect-observation', { experienceVersion: 3 })}>Continue</Action></>}
        {screen === 'reflect-observation' && <><p className="tara-lead">An observation is optional. Nothing will be filled in for you.</p><label htmlFor="tara-actual" className="tara-sr-only">What actually happened?</label><textarea id="tara-actual" rows={3} maxLength={3000} value={state.actual} onChange={event => editState({ actual: event.target.value })} /><Action onClick={() => go(atScreen(confirmReflection({ ...state, experienceVersion: 3 }), 'next-step'))}>Continue</Action></>}
        {screen === 'next-step' && <><Answers name="next-step" items={[[ 'keep', 'Keep my first move' ], [ 'adjust', 'Make the next attempt smaller' ], [ 'later', 'Leave it for now' ]]} value={state.carryChoice} onChange={choice => setState(chooseTaraNextStep(state, choice))} /><Action onClick={() => nextScreen('recap')}>Continue</Action><p className="tara-note">{state.nextStep ? 'Your existing next-use wording stays available.' : 'Optional. Continue without adding a next-use plan.'}</p></>}
        {screen === 'recap' && <>{(reviewOnly || state.completionReported) && <><div className="tara-result"><span className="tara-small-label">{state.predictionResult ? 'My prediction result' : 'My earlier difficulty comparison'}</span><Wording value={recapResult} /><p>{ACTION_LABELS[state.eventStatus]}</p></div>{state.nextStep && <MoveCard value={state.nextStep} label="My next-use plan" edit={!reviewOnly && !state.completionReported ? () => openEditor('nextStep', 'My next small step') : null} editLabel="Edit my next step" />}</>}{!reviewOnly && !state.completionReported && <><Answers name="save-reflection" items={[[ 'save', 'Save a separate reflection' ], [ 'skip', 'Finish without a separate saved reflection' ]]} value={state.savePreference} onChange={savePreference => editState({ savePreference })} /></>}<Action disabled={!reviewOnly && !state.completionReported && !state.savePreference} onClick={finish}>{reviewOnly || state.completionReported ? 'Close reflection' : 'Finish'}</Action>{!reviewOnly && !state.completionReported && <><p className="tara-note">Your current draft already stays on this device.</p><div className="tara-result"><span className="tara-small-label">{state.predictionResult ? 'My prediction result' : 'My earlier difficulty comparison'}</span><Wording value={recapResult} /><p>{ACTION_LABELS[state.eventStatus]}</p></div>{state.nextStep && <MoveCard value={state.nextStep} label="My next-use plan" edit={!reviewOnly && !state.completionReported ? () => openEditor('nextStep', 'My next small step') : null} editLabel="Edit my next step" />}</>}<details className="tara-details"><summary>My original words</summary><div className="tara-detail-body"><span className="tara-small-label">My situation</span><Wording value={state.situation || event?.label} /><span className="tara-small-label">I predicted</span><Wording value={state.prediction} /><span className="tara-small-label">I observed</span><Wording value={state.actual} /><span className="tara-small-label">My earlier learning</span><Wording value={state.learning} /></div></details></>}
      </section>
      <footer className="tara-footer"><p role="status" aria-live="polite">{reviewOnly ? 'Viewing a saved reflection.' : saveStatus === 'saved' ? 'Draft saved on this device.' : saveStatus === 'error' ? 'Changes are not confirmed saved.' : 'Your pace. Your words.'}</p>{saveStatus === 'error' && <div className="tara-error" role="alert"><p>{error}</p>{state.phase !== 'entry' && <Link onClick={() => { try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); } catch (error) { setError(error.message); } }}>Try saving again</Link>}</div>}<div className="tara-footer-tools"><JourneyOptions id={TARA_ID} /><button className="tara-icon" onClick={() => setOptions(true)} aria-label="Practice options"><MoreHorizontal size={20} /></button></div></footer>
    </main>
    {editor && <Editor key={editor.key} {...editor} onSave={keepEdit} onClose={() => setEditor(null)} />}
    {options && <Dialog title="Practice options" onClose={() => setOptions(false)}><p className="tara-muted">Tara provides built-in guidance during practice and support. Only your own confirmations record practice or outcomes.</p><label className="tara-setting"><input type="checkbox" checked={prefs.reducedMotion} onChange={event => setPref('reducedMotion', event.target.checked)} />Reduce motion</label><Link onClick={() => { setOptions(false); saveAndLeave(); }}>Save plan and leave</Link><Link onClick={() => { setOptions(false); setDeleting(true); }}>Clear saved practice</Link><Link onClick={() => { setOptions(false); exit(); }}>Leave and return later</Link></Dialog>}
    {deleting && <Dialog title="Clear this practice?" onClose={() => setDeleting(false)} description="This deletes the draft and saved reflections for this practice from this device."><Action onClick={remove}>Delete practice data</Action><Link onClick={() => setDeleting(false)}>Keep my data</Link>{saveStatus === 'error' && <p role="alert">{error}</p>}</Dialog>}
    {newPlanMode && <Dialog title="Start a new plan?" onClose={() => setNewPlanMode(null)} description="This replaces your unfinished draft. Your explicitly saved reflections stay on this device."><Action onClick={() => beginNew()}>Start a new plan</Action><Link onClick={() => setNewPlanMode(null)}>Keep my current plan</Link></Dialog>}
  </div>;
}
