import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Pause, Pencil, CornerDownLeft } from 'lucide-react';
import { HELPFULNESS } from '@/lib/attemptFeedback';
import '@/styles/next-step-practice.css';

function TaskTrail({ steps, currentIndex, review = false }) {
  return <ol className={`nes-task-trail${review ? ' nes-task-trail--review' : ''}`} aria-label="Your task steps">
    {steps.map((step, index) => <li key={step.id || index} aria-current={!review && index === currentIndex ? 'step' : undefined} data-state={step.status || (index === currentIndex && !review ? 'current' : 'pending')}>
      <span className="nes-task-marker" aria-hidden="true">{step.status === 'done' ? <Check size={15} /> : step.status === 'skipped' ? <Minus size={15} /> : index + 1}</span>
      <span><strong>{step.title}</strong><small>{step.status === 'done' ? 'Marked done' : step.status === 'skipped' ? 'Skipped' : index === currentIndex && !review ? 'Your current step' : 'Not done yet'}</small></span>
    </li>)}
  </ol>;
}

export function NextStepActive({ state, onDone, onSkip, onUndo, onReplace, onPause, onReview, onChoices, canvasRef }) {
  const step = state.ladder[state.currentStepIndex];
  const heading = useRef(null);
  const [adapting, setAdapting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); setAdapting(false); setEditing(false); }, [state.currentStepIndex]);
  const edit = () => { setDraft(step?.title || ''); setEditing(true); setAdapting(true); };
  return <main className="nes-practice nes-practice--active">
    <canvas ref={canvasRef} className="nes-practice-confetti" aria-hidden="true" />
    <nav className="nes-practice-nav" aria-label="Practice controls"><button type="button" onClick={onChoices}><ArrowLeft size={17} aria-hidden="true" />Task choices</button><button type="button" onClick={onPause}><Pause size={16} aria-hidden="true" />Pause</button></nav>
    <header className="nes-practice-heading"><p className="nes-practice-eyebrow">Next Easiest Step</p><p className="nes-task-name">{state.task}</p></header>
    <section className="nes-action-card" aria-labelledby="nes-current-action">
      <div className="nes-action-position"><span>Step {state.currentStepIndex + 1} of {state.ladder.length}</span><span>Only this step</span></div>
      <div className="nes-action-arch" aria-hidden="true"><span>{String(state.currentStepIndex + 1).padStart(2, '0')}</span></div>
      <h1 id="nes-current-action" ref={heading} tabIndex={-1}>{step?.title || 'Choose a small action'}</h1>
      <p className="nes-action-instruction">{step?.micro}</p>
      <button type="button" className="nes-action-done" onClick={onDone}>Done ✓<ArrowRight size={19} aria-hidden="true" /></button>
      <p className="nes-action-footnote">Mark done only after trying this action.</p>
    </section>
    <section className="nes-adapt" aria-label="Make this step fit">
      <div className="nes-adapt-controls"><button type="button" aria-expanded={adapting} onClick={() => setAdapting(value => !value)}>Too hard? Make it easier<span aria-hidden="true">{adapting ? '−' : '+'}</span></button><button type="button" onClick={edit}><Pencil size={15} aria-hidden="true" />Edit step</button></div>
      {adapting && <div className="nes-adapt-content"><p>Choose a smaller version, or write one action you could actually try.</p>
        <div className="nes-smaller-options">{step?.easier.map((title, index) => <button type="button" key={`${title}-${index}`} onClick={() => { onReplace(title); setAdapting(false); heading.current?.focus(); }}>{title}<ArrowRight size={16} aria-hidden="true" /></button>)}</div>
        {editing ? <form onSubmit={event => { event.preventDefault(); if (draft.trim()) { onReplace(draft.trim()); setEditing(false); setAdapting(false); heading.current?.focus(); } }}><label htmlFor="nes-action-edit">Your small action</label><input id="nes-action-edit" autoFocus maxLength={200} value={draft} onChange={event => setDraft(event.target.value)} /><div><button type="submit" disabled={!draft.trim()}>Use this step</button><button type="button" onClick={() => setEditing(false)}>Cancel edit</button></div></form> : <button type="button" className="nes-practice-text" onClick={edit}>Write my own smaller step</button>}
      </div>}
    </section>
    <div className="nes-practice-quiet-actions"><button type="button" onClick={onSkip}>Skip this step</button><button type="button" disabled={!state.currentStepIndex} onClick={onUndo}><CornerDownLeft size={15} aria-hidden="true" />Undo previous</button></div>
    {state.ladder.length > 1 && <details className="nes-task-outline"><summary>Your task at a glance</summary><TaskTrail steps={state.ladder} currentIndex={state.currentStepIndex} /></details>}
    <button type="button" className="nes-practice-finish" onClick={onReview}>Finish for now<ArrowRight size={17} aria-hidden="true" /></button>
  </main>;
}

export function NextStepReview({ state, onGettingStarted, onHelpfulness, onContinue, onUndo, onResume, onNewTask, canContinue }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const done = state.ladder.filter(step => step.status === 'done').length;
  const skipped = state.ladder.filter(step => step.status === 'skipped').length;
  const unfinished = state.ladder.length - done - skipped;
  return <main className="nes-practice nes-practice--review">
    <header className="nes-practice-heading"><p className="nes-practice-eyebrow">Next Easiest Step · Your review</p><h1 ref={heading} tabIndex={-1}>Your task,<br />as it stands.</h1><p>{state.task}</p></header>
    <section className="nes-task-receipt" aria-label="What you recorded"><div className="nes-receipt-summary"><span><strong>{done}</strong>marked done</span><span><strong>{skipped}</strong>skipped</span>{unfinished > 0 && <span><strong>{unfinished}</strong>not done yet</span>}</div><TaskTrail steps={state.ladder} currentIndex={state.currentStepIndex} review />
      {unfinished > 0 && !state.submitted && <button type="button" className="nes-review-resume" onClick={onResume}>Return to the current step<ArrowRight size={17} aria-hidden="true" /></button>}
      <button type="button" className="nes-practice-text" disabled={!state.currentStepIndex || state.submitted} onClick={onUndo}><CornerDownLeft size={15} aria-hidden="true" />Undo previous</button>
    </section>
    <section className="nes-review-feedback"><fieldset><legend>Did getting started become easier?<small>Optional · any answer is useful</small></legend><div>{[['easier', 'Easier'], ['same', 'No change'], ['harder', 'Harder'], ['unsure', 'Not sure']].map(([id, label]) => <button type="button" key={id} aria-pressed={state.gettingStarted === id} onClick={() => onGettingStarted(id)}>{label}</button>)}</div></fieldset>
      <details><summary>Was this practice helpful? · optional</summary><fieldset><legend className="sr-only">Practice helpfulness</legend><div>{HELPFULNESS.map(item => <button type="button" key={item.id} aria-pressed={state.helpfulness === item.id} onClick={() => onHelpfulness(item.id)}>{item.label}</button>)}</div></fieldset></details>
      <p>You can leave both questions unanswered. Your task does not have to be finished.</p>
    </section>
    <button type="button" className="nes-review-continue" disabled={!canContinue || state.submitted} onClick={onContinue}>Continue to final rating<ArrowRight size={18} aria-hidden="true" /></button>
    <button type="button" className="nes-practice-text nes-review-new" onClick={onNewTask}>Back to tasks</button>
  </main>;
}
