import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, MoreHorizontal, Pencil, X } from 'lucide-react';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { COMPARISONS, EVENTS, PHASES, PREDICTION_RESULTS, TARA_ID, beginTackle, chooseChallenge, chooseEvent, confirmReflection, newTaraState, preparePlan, returnToEvent, taraCompletion } from '@/lib/taraTacticianState';
import { chooseTaraMove, tacticFor } from '@/lib/taraTactics';
import { choosePracticeResponse, chooseTaraNextStep, confirmPracticeTry, guidanceFor, keepUnpractisedPlan, newTaraPractice, practiceOptions, startTaraPractice } from '@/lib/taraGuidance';
import { clearTara, loadTara, saveTaraDraft, saveTaraRecap } from '@/lib/taraTacticianStorage';
import '@/styles/tara-tactician.css';

const STAGES = ['Prepare', 'Rehearse', 'Tackle', 'Reflect'];
const stageFor = phase => ['entry', 'prepare', 'plan'].includes(phase) ? 0 : ['rehearse', 'ready'].includes(phase) ? 1 : ['tackle', 'support'].includes(phase) ? 2 : 3;
const ACTION_LABELS = { finished: 'Took part in all or some', 'stepped-out': 'Stepped out intentionally', 'not-attempted': 'Did not attempt it', unknown: 'I’m not sure yet' };
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const TITLES = { prepare: 'What’s coming up?', plan: 'Choose your way in.', rehearse: 'Try the moment.', ready: 'Your pocket plan.', tackle: 'Right now.', support: 'Find your way back.', reflect: 'How did it go?', recap: 'What comes next.' };
const USABILITY = [['usable', 'I can use this'], ['adjust', 'I want to adjust it'], ['unsure', 'I’m not sure yet']];
function Action({ children, onClick, secondary = false, disabled = false }) {
  return <button type="button" className={`tara-action ${secondary ? 'tara-action--secondary' : ''}`} onClick={onClick} disabled={disabled}>{children}{!secondary && <ArrowRight size={18} aria-hidden="true" />}</button>;
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
function MoveCard({ value, label, edit, editLabel = 'Edit my move' }) {
  return <section className="tara-move-card" aria-label={label}><div className="tara-move-label"><Compass size={18} aria-hidden="true" /><span>{label}</span></div><Wording value={value} fallback='“Let me take a moment.”' />{edit && <EditButton label={editLabel} onClick={edit} />}</section>;
}
function Choice({ label, detail, onClick, selected = false, number }) {
  return <button type="button" className="tara-choice" aria-pressed={selected} onClick={onClick}>{number && <span className="tara-choice-number" aria-hidden="true">{number}</span>}<span className="tara-choice-copy"><span>{label}</span>{detail && <small>{detail}</small>}</span>{selected ? <Check size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}</button>;
}

export default function TaraTacticianExperience({ intervention, sessionId, answers, onAttemptEvent, onComplete, onExit }) {
  const { prefs, setPref } = useAccessibilityPrefs();
  const [initial] = useState(() => { try { return { ...loadTara(), error: '' }; } catch (error) { return { draft: null, recaps: [], error: error.message || 'Device storage is unavailable.' }; } });
  const [state, setState] = useState(() => initial.draft || newTaraState()); const [recaps, setRecaps] = useState(initial.recaps);
  const [saveStatus, setSaveStatus] = useState(initial.error ? 'error' : initial.draft ? 'saved' : 'idle'); const [error, setError] = useState(initial.error);
  const [editor, setEditor] = useState(null); const [options, setOptions] = useState(false); const [deleting, setDeleting] = useState(false); const [newPlanMode, setNewPlanMode] = useState(null);
  const [reviewOnly, setReviewOnly] = useState(false); const [changingMove, setChangingMove] = useState(false);
  const headingRef = useRef(null); const revealRef = useRef(null); const currentRef = useRef(state); const completedRef = useRef(false); const startedRef = useRef(Date.now());
  const historyKeyRef = useRef(uid()); const snapshotsRef = useRef(new Map()); const historyDepthRef = useRef(0);
  currentRef.current = state;
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, tara: { id: currentRef.current.id, phase: currentRef.current.phase, key: historyKeyRef.current } }, '');
    const pop = event => {
      if (currentRef.current.completionReported) return;
      const marker = event.state?.tara; if (marker?.id !== currentRef.current.id || !PHASES.includes(marker.phase)) return;
      historyKeyRef.current = marker.key || uid(); const snapshot = snapshotsRef.current.get(marker.key);
      // Back changes navigation, not the latest authored words or confirmed tries.
      setState(value => {
        if (marker.phase === 'recap' && !(value.comparison || value.predictionResult)) return value;
        return { ...value, phase: marker.phase, ...(snapshot ? { prepareView: snapshot.prepareView, support: snapshot.support,
          practice: { ...value.practice, round: snapshot.practice.round, step: snapshot.practice.step } } : {}) };
      });
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1); setEditor(null); setOptions(false); setChangingMove(false); setNewPlanMode(null);
    };
    window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    if (state.phase === 'entry' || reviewOnly) return;
    try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); } catch (error) { setSaveStatus('error'); setError(error.message || 'This draft could not be saved.'); }
  }, [state, reviewOnly]);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [state.phase, state.event, state.challenge, state.practice.round]);
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
    snapshotsRef.current.set(historyKeyRef.current, { prepareView: previous.prepareView, support: previous.support, practice: { round: previous.practice.round, step: previous.practice.step } });
    historyKeyRef.current = uid(); historyDepthRef.current += 1;
    window.history.pushState({ ...window.history.state, ...(Number.isInteger(window.history.state?.idx) ? { idx: window.history.state.idx + 1 } : {}), tara: { id: next.id, phase: next.phase, key: historyKeyRef.current } }, '');
    setChangingMove(false); setState(next);
  };
  const exit = () => {
    if (!reviewOnly && !state.completionReported && state.phase !== 'entry') onAttemptEvent?.({ interventionId: TARA_ID, action: 'exited', exitReason: 'exited', completedPercentage: stageFor(state.phase) / 4, startedAt: startedRef.current, timestamp: Date.now() });
    onExit?.();
  };
  const beginNew = mode => {
    const fresh = newTaraState(); completedRef.current = false; startedRef.current = Date.now(); setReviewOnly(false); snapshotsRef.current.clear(); historyDepthRef.current = 0; historyKeyRef.current = uid();
    currentRef.current = fresh;
    window.history.replaceState({ ...window.history.state, tara: { id: fresh.id, phase: 'entry', key: historyKeyRef.current } }, '');
    setNewPlanMode(null); go({ ...fresh, phase: mode === 'live' ? 'tackle' : 'prepare', entryMode: mode, eventStatus: mode === 'live' ? 'in-progress' : 'not-started' });
  };
  const start = mode => {
    if (mode === 'live' && !state.completionReported && (state.event || state.plan.do || state.situation)) go(beginTackle(state));
    else if (state.event || state.situation || state.plan.do || state.actual) setNewPlanMode(mode);
    else beginNew(mode);
  };
  const back = () => {
    if (reviewOnly || state.completionReported) exit();
    else if (historyDepthRef.current > 0) window.history.back();
    else if (state.phase === 'entry') exit();
    else go({ ...state, phase: ({ prepare: 'entry', plan: 'prepare', rehearse: 'plan', ready: 'plan', tackle: state.entryMode === 'live' ? 'entry' : 'ready', support: 'tackle', reflect: 'tackle', recap: 'reflect' })[state.phase] || 'entry' });
  };
  const reveal = () => requestAnimationFrame(() => revealRef.current?.focus({ preventScroll: false }));
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
  const selectMove = id => { setState(value => ({ ...chooseTaraMove(value, id), experienceVersion: 3, practice: newTaraPractice() })); setChangingMove(false); reveal(); };
  const pocket = () => go(keepUnpractisedPlan({ ...state, plan: { ...preparePlan(state).plan, do: state.plan.do || '“Let me take a moment.”', spikes: state.plan.spikes || guidanceFor(state).backups[0][2] } }));
  const practise = () => go(startTaraPractice({ ...state, plan: { ...preparePlan(state).plan, do: state.plan.do || '“Let me take a moment.”', spikes: state.plan.spikes || guidanceFor(state).backups[0][2] } }));
  const finishEvent = () => go({ ...state, phase: 'reflect', experienceVersion: 3, predictionResult: '', eventStatus: state.eventStatus === 'stepped-out' ? 'stepped-out' : 'unknown', actualActionConfirmed: state.eventStatus === 'stepped-out' });
  const saveAndLeave = () => { try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); exit(); } catch (error) { setSaveStatus('error'); setError(error.message); } };
  const saveRecap = () => { try { const saved = saveTaraRecap(state); setRecaps(saved.recaps); setState(saved.draft); setSaveStatus('saved'); setError(''); } catch (error) { setSaveStatus('error'); setError(error.message); } };
  const finish = () => {
    if (reviewOnly || state.completionReported) { onExit?.(); return; } if (completedRef.current) return; completedRef.current = true;
    try { saveTaraDraft({ ...state, completionReported: true }); } catch { /* Host session is authoritative if local storage fails. */ }
    onAttemptEvent?.({ interventionId: TARA_ID, action: 'completed', exitReason: 'completed', completedPercentage: 1, startedAt: startedRef.current, timestamp: Date.now() });
    onComplete?.({ interventionId: TARA_ID, skipReflection: true, outcome: taraCompletion(state) });
  };
  const remove = () => { try { clearTara(); setState(newTaraState()); setRecaps([]); setSaveStatus('idle'); setError(''); setReviewOnly(false); completedRef.current = false; snapshotsRef.current.clear(); historyDepthRef.current = 0; setDeleting(false); setNewPlanMode(null); } catch (error) { setError(error.message); setSaveStatus('error'); } };
  const live = ['tackle', 'support'].includes(state.phase); const stage = stageFor(state.phase); const event = EVENTS.find(item => item.id === state.event); const tactic = tacticFor(state); const guidance = guidanceFor(state);
  const move = state.plan.do || '“Let me take a moment.”'; const hasDraft = Boolean(state.event || state.plan.do || state.situation); const practice = state.practice;
  const recapResult = state.predictionResult ? PREDICTION_RESULTS.find(([value]) => value === state.predictionResult)?.[1] : COMPARISONS.find(([value]) => value === state.comparison)?.[1];
  const support = state.support === 'racing' ? { title: 'Find my words', cue: state.plan.spikes || tactic.pause, detail: 'Use this pause, then return to your first move when you choose.' }
    : state.support === 'step-out' ? { title: 'Choose my pace', cue: '“I need to pause. I’ll decide when to return.”', detail: 'You can stay with support or step out intentionally.' }
    : { title: 'Make it smaller', cue: guidance.smaller, detail: 'Deal with this one piece first. Then decide what you need next.' };
  const predictionDetails = <details className="tara-details"><summary>My prediction & other notes</summary><div className="tara-detail-body"><span className="tara-small-label">My prediction</span><Wording value={state.prediction} fallback="No prediction recorded." /><EditButton label="Edit prediction" onClick={() => openEditor('prediction', 'My prediction')} />{[['mind', 'A reminder'], ['notice', 'What I might notice']].map(([key, label]) => <div key={key}><span className="tara-small-label">{label}</span><Wording value={state.plan[key]} /><EditButton label={`Edit ${label.toLowerCase()}`} onClick={() => openEditor(`plan.${key}`, label)} /></div>)}</div></details>;
  const moveChoices = <fieldset className="tara-group"><legend>{state.plan.do ? 'Choose a different first move' : 'What will you try first?'}</legend><div className="tara-stack">{tactic.moves.map(([id, label, wording], index) => <Choice key={id} label={label} detail={wording} number={index + 1} selected={state.selectedMoveId === id} onClick={() => selectMove(id)} />)}</div></fieldset>;

  return <div className={`tara tara-guided ${live ? 'tara--live' : ''}`} data-reduced-motion={prefs.reducedMotion || undefined} data-intervention={TARA_ID}>
    <header className="tara-header"><button className="tara-icon" onClick={back} aria-label="Go back"><ArrowLeft size={20} /></button><div><span>Mentication</span><p>Tara Tactician</p></div><button className="tara-icon" onClick={exit} aria-label="Exit Tara"><X size={20} /></button></header>
    {state.phase !== 'entry' && <nav className="tara-stages" aria-label="Intervention progress">{STAGES.map((name, index) => <span key={name} aria-current={stage === index ? 'step' : undefined}>{name}</span>)}</nav>}
    <main className="tara-main">
      {state.phase === 'entry' ? <>
        <section className="tara-welcome"><div className="tara-welcome-copy"><p className="tara-eyebrow">Meet your tactical sidekick</p><h1 ref={headingRef} tabIndex={-1}>Difficult moment.<br />Clear next move.</h1><p>Choose a way in. Try it with Tara. Keep a way back.</p></div><div className="tara-stack tara-welcome-actions">{hasDraft && <Action onClick={() => go({ ...state, phase: state.plan.do ? 'ready' : state.challenge ? 'plan' : 'prepare' })}>Resume my plan</Action>}<Action secondary={hasDraft} onClick={() => start('prepare')}>Plan with Tara</Action><Action secondary onClick={() => start('live')}>I’m in it now</Action></div><Portrait className="tara-character--welcome" /><div className="tara-route-map" aria-hidden="true"><span>01 · Choose</span><span>02 · Try</span><span>03 · Take it with you</span></div></section>

        <p className="tara-note">Built-in guidance. Your words stay on this device.</p>
        {recaps.length > 0 && <details className="tara-details"><summary>Your saved reflections</summary><div className="tara-stack tara-detail-body">{recaps.map(record => <Choice key={record.id} label={record.situation || EVENTS.find(item => item.id === record.event)?.label || 'A difficult moment'} detail={record.predictionResult ? PREDICTION_RESULTS.find(([value]) => value === record.predictionResult)?.[1] : COMPARISONS.find(([value]) => value === record.comparison)?.[1]} onClick={() => { setReviewOnly(true); go(record); }} />)}</div></details>}
      </> : <>
        <div className="tara-heading"><p className="tara-eyebrow">{state.phase === 'rehearse' ? `Practice ${practice.round + 1} of 2 · ${practice.round === 0 ? 'A way in' : 'A way back'}` : live ? 'Support for this moment' : state.phase === 'ready' ? 'Keep this close' : event?.label || 'With Tara'} </p><h1 ref={headingRef} tabIndex={-1}>{state.phase === 'prepare' && state.prepareView === 'challenge' && state.event ? 'What feels difficult?' : TITLES[state.phase]}</h1></div>
        {state.phase === 'prepare' && <section ref={revealRef} tabIndex={-1} className="tara-reveal tara-stack">
          {state.prepareView === 'event' || !state.event ? <><p className="tara-lead">Pick the closest fit. You can make it your own.</p><fieldset className="tara-group"><legend className="tara-sr-only">The situation</legend><div className="tara-stack">{EVENTS.map(item => <Choice key={item.id} label={item.label} selected={state.event === item.id} onClick={() => go({ ...chooseEvent(state, item.id), phase: 'prepare' })} />)}</div></fieldset></> : <><p className="tara-context">{state.situation || event.label}</p><fieldset className="tara-group"><legend className="tara-sr-only">The difficult part</legend><div className="tara-stack">{event.challenges.map(challenge => <Choice key={challenge} label={challenge} selected={state.challenge === challenge} onClick={() => go({ ...chooseChallenge(state, challenge), phase: 'plan' })} />)}</div></fieldset><EditButton label="Change situation" onClick={() => go({ ...state, prepareView: 'event', phase: 'prepare' })} /></>}
        </section>}
        {state.phase === 'plan' && <section className="tara-stack">
          <Coach><p>{guidance.insight}</p></Coach>
          {state.plan.do && !changingMove ? <section ref={revealRef} tabIndex={-1} className="tara-stack tara-reveal"><MoveCard value={move} label={state.selectedMoveId ? 'My first move' : 'Words I kept'} edit={() => openEditor('plan.do', 'My first move')} /><div className="tara-stack"><Action onClick={practise}>Try it with Tara</Action><Action secondary onClick={pocket}>Keep my plan without practising</Action></div><EditButton label="Choose another move" onClick={() => setChangingMove(true)} /></section> : moveChoices}
          {!state.plan.do && <EditButton label="Write my own first move" onClick={() => openEditor('plan.do', 'My first move')} />}
          <details className="tara-details"><summary>Make it about my real situation</summary><div className="tara-detail-body"><Wording value={state.situation} fallback="Name the moment if that helps." /><EditButton label="Name this moment" onClick={() => openEditor('situation', 'Name this moment')} /><Wording value={state.prediction} fallback="No prediction recorded." /><EditButton label="Edit prediction" onClick={() => openEditor('prediction', 'My prediction')} /></div></details>
        </section>}
        {state.phase === 'rehearse' && <section className="tara-stack">
          {practice.step === 'choose' && <>{state.situation && <div className="tara-practice-context"><span className="tara-small-label">Practising for</span><Wording value={state.situation} /></div>}<Coach label="Imagined practice · not the real event" scene><h2>{practice.round === 0 ? tactic.cue : guidance.recovery}</h2></Coach></>}
          {practice.step === 'choose' ? <><fieldset className="tara-group"><legend>{practice.round === 0 ? 'What will you do here?' : 'What will be your backup?'}</legend><div className="tara-stack">{practiceOptions(state).slice(0, practice.round === 0 ? 2 : 3).map(([id, label, wording]) => <Choice key={id} label={label} detail={wording} selected={practice.responses[practice.round] === id} onClick={() => { setState(value => choosePracticeResponse(value, id)); reveal(); }} />)}</div></fieldset><Action secondary onClick={() => go(keepUnpractisedPlan(state))}>Keep my plan without this practice</Action></> : <section ref={revealRef} tabIndex={-1} className="tara-stack tara-reveal"><MoveCard value={practice.wordings[practice.round]} label="Try this now" edit={() => openEditor('practice', 'My practice words')} editLabel="Use my own practice words" /><Coach label="What this move is for"><p>{practiceOptions(state).find(([id]) => id === practice.responses[practice.round])?.[3]}</p></Coach><p className="tara-purpose">Try the words or action once, aloud or silently.</p><Action disabled={!practice.wordings[practice.round].trim()} onClick={() => go(confirmPracticeTry(state))}>{practice.round === 0 ? 'I tried it — practise a way back' : 'I tried it — keep my pocket plan'}</Action><Action secondary onClick={() => go(keepUnpractisedPlan(state))}>Keep the plan without trying this</Action><EditButton label="Choose a different response" onClick={() => editState({ practice: { ...practice, step: 'choose' } })} /></section>}
        </section>}
        {state.phase === 'ready' && <section className="tara-stack">
          <div className="tara-pocket-context"><span className="tara-small-label">For my real moment</span><Wording value={state.situation || event?.label} fallback="A difficult moment" /><EditButton label="Name this moment" onClick={() => openEditor('situation', 'Name this moment')} /></div>
          <MoveCard value={move} label="My way in" edit={() => openEditor('plan.do', 'My first move')} />
          <MoveCard value={state.plan.spikes || tactic.pause} label={practice.responses[1] ? 'My chosen way back' : 'A backup to try'} edit={() => openEditor('plan.spikes', 'My backup')} editLabel="Edit my backup" />
          <p className="tara-practice-record">{practice.tried[0] && practice.tried[1] ? 'You confirmed trying both practice moments.' : state.rehearsed ? 'You confirmed practising. Your plan stays editable.' : 'Plan kept. No practice recorded.'}</p>
          <div className="tara-stack"><Action onClick={() => go(beginTackle(state))}>Open live support</Action><Action secondary onClick={saveAndLeave}>Save plan & leave for now</Action></div>
          <details className="tara-details"><summary>How usable does this feel?</summary><div className="tara-detail-body">{USABILITY.map(([value, label]) => <Choice key={value} label={label} selected={practice.usability === value} onClick={() => editState({ practice: { ...practice, usability: value } })} />)}{practice.usability && <p className="tara-purpose">{practice.usability === 'usable' ? 'Keep these words. You can still change the pace in the real moment.' : practice.usability === 'adjust' ? 'Try a shorter line, or edit your first move and backup above.' : 'You can keep a small plan without deciding that you feel ready.'}</p>}<EditButton label="Practise my plan again" onClick={practise} />{practice.triedWordings.some(Boolean) && <details className="tara-details"><summary>The words I confirmed trying</summary><div className="tara-detail-body">{practice.triedWordings.map((wording, index) => wording && <div key={index}><span className="tara-small-label">{index === 0 ? 'My way in' : 'My way back'}</span><Wording value={wording} /></div>)}</div></details>}</div></details>{predictionDetails}
        </section>}
        {state.phase === 'tackle' && <section className="tara-stack tara-live-hub">
          <MoveCard value={move} label={state.plan.do ? 'My first move' : 'A pause to try'} edit={() => openEditor('plan.do', 'My first move')} />
          <fieldset className="tara-group"><legend>What do I need right now?</legend><div className="tara-stack">{[['racing', 'Find my words'], ['overwhelmed', 'Make it smaller'], ['step-out', 'Choose my pace']].map(([key, label]) => <Choice key={key} label={label} onClick={() => go({ ...state, phase: 'support', support: key })} />)}</div></fieldset>
          <Action onClick={finishEvent}>Return to reflect</Action>
          <p className="tara-note">Reflect when you’re finished or have paused. No outcome is assumed.</p>
          {state.plan.spikes && <details className="tara-details"><summary>My way back</summary><Wording value={state.plan.spikes} /><EditButton label="Edit my backup" onClick={() => openEditor('plan.spikes', 'My backup')} /></details>}{predictionDetails}
          {!state.event && <EditButton label="Make a more specific plan" onClick={() => go({ ...state, phase: 'prepare' })} />}
        </section>}
        {state.phase === 'support' && <section className="tara-stack">
          <MoveCard value={support.cue} label={support.title} />
          <Coach><p>{support.detail}</p></Coach>
          <div className="tara-stack">{state.support === 'step-out' ? <><Action onClick={() => go(returnToEvent(state))}>Stay with my plan</Action><Action secondary onClick={() => go({ ...state, phase: 'tackle', support: '', eventStatus: 'stepped-out' })}>Step out intentionally</Action></> : <Action onClick={() => go(returnToEvent(state))}>Back to my moment</Action>}<Action secondary onClick={finishEvent}>Return to reflect</Action></div>
        </section>}
        {state.phase === 'reflect' && <section className="tara-stack">
          {!state.actualActionConfirmed ? <><Coach><p>Start with what you did. There is no required outcome.</p></Coach><fieldset className="tara-group"><legend>What did I actually do?</legend><div className="tara-stack">{Object.entries(ACTION_LABELS).map(([value, label]) => <Choice key={value} label={label} onClick={() => { editState({ eventStatus: value, actualActionConfirmed: true }); reveal(); }} />)}</div></fieldset></> : <section ref={revealRef} tabIndex={-1} className="tara-stack tara-reveal">
            <div className="tara-answer"><span className="tara-small-label">What I did</span><p>{ACTION_LABELS[state.eventStatus]}</p><EditButton label="Change what I did" onClick={() => editState({ actualActionConfirmed: false })} /></div>
            {!state.predictionResult ? <><div className="tara-prediction-note"><span className="tara-small-label">My prediction</span><Wording value={state.prediction} fallback="No prediction recorded. You can choose not tested or unsure." /></div><fieldset className="tara-group"><legend>Did my prediction happen?</legend><div className="tara-stack">{PREDICTION_RESULTS.map(([value, label]) => <Choice key={value} label={label} onClick={() => { editState({ predictionResult: value, experienceVersion: 3 }); reveal(); }} />)}</div></fieldset></> : <><div className="tara-answer"><span className="tara-small-label">What I reported</span><p>{PREDICTION_RESULTS.find(([value]) => value === state.predictionResult)?.[1]}</p><EditButton label="Change prediction result" onClick={() => editState({ predictionResult: '' })} /></div><Action onClick={() => go(confirmReflection({ ...state, experienceVersion: 3 }))}>Keep my reflection</Action><Wording value={state.actual} fallback="An observation is optional. Nothing will be filled in for you." /><EditButton label={state.actual ? 'Edit what happened' : 'Add what happened (optional)'} onClick={() => openEditor('actual', 'What actually happened?')} /></>}
          </section>}
          <p className="tara-note">Prediction result and difficulty are different. “Not tested” and “unsure” are valid answers.</p>
        </section>}
        {state.phase === 'recap' && <section className="tara-stack">
          {state.situation && <div className="tara-pocket-context"><span className="tara-small-label">My real moment</span><Wording value={state.situation} /></div>}<div className="tara-result"><span className="tara-small-label">{state.predictionResult ? 'My prediction result' : 'My earlier difficulty comparison'}</span><h2>{recapResult}</h2><p>{ACTION_LABELS[state.eventStatus]}</p></div>
          {state.nextStep ? <MoveCard value={state.nextStep} label="My next-use plan" edit={!reviewOnly && !state.completionReported ? () => openEditor('nextStep', 'My next small step') : null} editLabel="Edit my next step" /> : !reviewOnly && !state.completionReported && <><Coach><p>You decide what to take forward. Keep the move, make it smaller, or leave it for later.</p></Coach><fieldset className="tara-group"><legend>What would help next time? (optional)</legend><div className="tara-stack">{[['keep', 'Keep my first move'], ['adjust', 'Make the next attempt smaller'], ['later', 'Leave it for now']].map(([value, label]) => <Choice key={value} label={label} onClick={() => { setState(current => chooseTaraNextStep(current, value)); reveal(); }} />)}</div></fieldset></>}
          <div className="tara-stack"><Action onClick={finish}>{reviewOnly || state.completionReported ? 'Close reflection' : 'Finish'}</Action>{!reviewOnly && <Action secondary disabled={state.saved} onClick={saveRecap}>{state.saved ? 'Reflection saved on this device' : 'Save reflection on this device (optional)'}</Action>}</div>
          <details className="tara-details"><summary>My words & observations</summary><div className="tara-detail-body"><span className="tara-small-label">I predicted</span><Wording value={state.prediction} fallback="No prediction recorded." /><span className="tara-small-label">I observed</span><Wording value={state.actual} fallback="No observation added." /><span className="tara-small-label">My learning</span><Wording value={state.learning} fallback="No learning added." />{!reviewOnly && !state.completionReported && <><EditButton label="Edit my learning" onClick={() => openEditor('learning', 'What I want to keep or change')} /><EditButton label="Edit my reflection" onClick={() => go({ ...state, phase: 'reflect', experienceVersion: 3 })} /></>}</div></details>
        </section>}
      </>}
      <footer className="tara-footer"><p role="status" aria-live="polite">{reviewOnly ? 'Viewing a saved reflection.' : saveStatus === 'saved' ? 'Draft saved on this device.' : saveStatus === 'error' ? 'Changes are not confirmed saved.' : 'Your pace. Your words.'}</p>{saveStatus === 'error' && <div className="tara-error" role="alert"><p>{error}</p>{state.phase !== 'entry' && <button className="tara-text-button" onClick={() => { try { saveTaraDraft(state); setSaveStatus('saved'); setError(''); } catch (error) { setError(error.message); } }}>Try saving again</button>}</div>}<div className="tara-footer-tools"><JourneyOptions id={TARA_ID} /><button className="tara-icon" onClick={() => setOptions(true)} aria-label="Tara options"><MoreHorizontal size={20} /></button></div></footer>
    </main>
    {editor && <Editor key={editor.key} {...editor} onSave={keepEdit} onClose={() => setEditor(null)} />}
    {options && <Dialog title="Your pace, your choices" onClose={() => setOptions(false)}><details className="tara-details"><summary>About Tara’s guidance</summary><div className="tara-detail-body"><p>Tara offers built-in tactical choices and imagined practice cues. This is not a live AI conversation or a performance assessment.</p><p>A practice is recorded only when you confirm trying it. A real outcome is recorded only from your own reflection.</p></div></details><Choice label={`Reduce motion: ${prefs.reducedMotion ? 'on' : 'off'}`} selected={prefs.reducedMotion} onClick={() => setPref('reducedMotion', !prefs.reducedMotion)} /><Choice label="Clear Tara data" onClick={() => { setOptions(false); setDeleting(true); }} /><Action secondary onClick={() => { setOptions(false); exit(); }}>Leave and return later</Action></Dialog>}
    {deleting && <Dialog title="Clear Tara data?" onClose={() => setDeleting(false)} description="This deletes your Tara draft and saved reflections from this device."><div className="tara-stack"><Action secondary onClick={() => setDeleting(false)}>Keep my data</Action><Action onClick={remove}>Delete Tara data</Action></div>{saveStatus === 'error' && <p role="alert">{error}</p>}</Dialog>}
    {newPlanMode && <Dialog title="Start a new plan?" onClose={() => setNewPlanMode(null)} description="This replaces your unfinished draft. Your explicitly saved reflections stay on this device."><Action secondary onClick={() => setNewPlanMode(null)}>Keep my current plan</Action><Action onClick={() => beginNew(newPlanMode)}>Start a new plan</Action></Dialog>}
  </div>;
}
