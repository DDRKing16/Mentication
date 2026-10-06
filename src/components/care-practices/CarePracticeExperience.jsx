import JourneyOptions from '@/components/journey/JourneyOptions';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { CARE_PRACTICES, CARE_STAGES, careClick, careOutcome, freshCareState } from '@/lib/carePractices';
import { deleteCareDraft, deleteCareSaved, readCareDraft, readCareSaved, writeCareDraft, writeCareSaved } from '@/lib/carePracticeStorage';
import '@/styles/care-practices.css';

function Field({ label, value, suggestions, onChange, onChoose }) {
  return <div className="care-field"><label>{label}<textarea rows={2} maxLength={300} value={value} onChange={event => onChange(event.target.value)} /></label><div className="care-choices" aria-label={`${label} suggestions`}>{suggestions.map(text => <button key={text} aria-pressed={value === text} onClick={() => onChoose(text)}>{text}{value === text && <Check size={17} aria-hidden="true" />}</button>)}</div></div>;
}
function Rating({ config, value, onChange }) {
  return <fieldset className="care-rating"><legend>{config.question}</legend><div>{Array.from({ length: 11 }, (_, n) => <button key={n} aria-label={`${n} of 10`} aria-pressed={value === n} onClick={() => onChange(n)}>{n}</button>)}</div><p><span>0 · {config.left}</span><span>10 · {config.right}</span></p></fieldset>;
}
function Artwork({ motif, level, practice }) {
  return <div className={`care-art care-art--${motif} ${practice ? 'care-art--practice' : ''}`} data-level={level} aria-hidden="true"><svg viewBox="0 0 360 145"><ellipse className="care-halo" cx="180" cy="88" rx={70 + Math.min(level, 10) * 5} ry="48" />{motif === 'shelter' ? <><path d="M85 108 Q100 36 180 29 Q260 36 275 108" /><path d="M106 110 Q115 59 180 53 Q245 59 254 110" /><path className="care-solid" d="M148 106 Q143 79 164 77 Q179 77 180 90 Q188 72 204 80 Q223 95 180 122 Z" /></> : motif === 'thread' ? <><path d="M15 98 C75 25 125 134 175 85 S210 35 187 45 S159 103 216 105 S285 41 345 69" /><path className="care-fine" d="M18 119 Q150 152 340 113" /><circle className="care-solid" cx={225 + Math.min(level, 8) * 8} cy="96" r="6" /></> : <><ellipse cx="180" cy="86" rx="114" ry="47" /><ellipse cx="180" cy="86" rx="85" ry="34" /><path className="care-solid" d="M157 73 Q185 49 202 74 Q224 100 190 109 Q150 117 157 73Z" /></>}</svg><span>{motif === 'shelter' ? 'A little care' : motif === 'thread' ? 'A little distance' : 'A little room'}</span></div>;
}

/** Host contract: docs/handoffs/care-practices.md. No route or catalogue ownership here. */
export default function CarePracticeExperience({ id, intervention, onComplete, onAttemptEvent, onExit, persistence = { readDraft: readCareDraft, writeDraft: writeCareDraft, deleteDraft: deleteCareDraft, readSaved: readCareSaved, writeSaved: writeCareSaved, deleteSaved: deleteCareSaved } }) {
  const config = CARE_PRACTICES[id];
  const { prefs } = useAccessibilityPrefs();
  const [s, set] = useState(() => persistence.readDraft(id) || freshCareState());
  const [saved, setSaved] = useState(() => persistence.readSaved(id));
  const [draftOk, setDraftOk] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewingSaved, setViewingSaved] = useState(false);
  const [returning, setReturning] = useState(() => !!persistence.readDraft(id));
  const heading = useRef(null);
  const finished = useRef(false);
  const adapter = useRef(persistence);
  const patch = values => set(current => ({ ...current, ...values }));
  const go = (stage, values = {}) => { setError(''); setMessage(''); patch({ ...values, stage }); };
  useEffect(() => {
    if (returning || viewingSaved || finished.current) return;
    const persist = () => setDraftOk(adapter.current.writeDraft(id, s));
    persist();
    window.addEventListener('pagehide', persist);
    return () => window.removeEventListener('pagehide', persist);
  }, [id, s, returning, viewingSaved]);
  useEffect(() => { heading.current?.focus(); }, [s.stage, returning, viewingSaved]);
  const countClick = event => {
    const button = event.target.closest('button');
    if (button && !button.disabled) set(current => careClick(current, id));
  };
  const discard = () => {
    if (!adapter.current.deleteDraft(id)) { setError('The draft could not be deleted. Please try again.'); return; }
    finished.current = true;
    onExit?.();
  };
  const finish = () => {
    if (finished.current) return;
    if (!adapter.current.deleteDraft(id)) { setError('The draft could not be cleared. Try Finish again.'); return; }
    finished.current = true;
    if (!viewingSaved) {
      onAttemptEvent?.({ interventionId: id, mechanism: intervention?.mechanism, action: 'completed', completedPercentage: 1, timestamp: Date.now() });
      onComplete?.({ requireGoalReassessment: true, outcome: careOutcome(id, s) });
    } else onExit?.();
  };
  const save = () => {
    if (adapter.current.writeSaved(id, s)) { setSaved(s); setError(''); setMessage('Saved on this device. Find this card here next time.'); }
    else { setMessage(''); setError('Saving did not work. Your card has not been saved. Try again.'); }
  };
  const removeSaved = () => {
    if (adapter.current.deleteSaved(id)) { setSaved(null); setMessage('Saved card deleted from this device.'); setError(''); if (viewingSaved) { setViewingSaved(false); set(freshCareState()); } }
    else setError('The saved card could not be deleted. Please try again.');
  };
  const restart = () => { finished.current = false; setViewingSaved(false); setReturning(false); set(freshCareState()); setError(''); setMessage(''); };
  const primary = (label, handler, disabled = false) => <button className="care-primary" disabled={disabled} onClick={handler}>{label}<ArrowRight size={18} aria-hidden="true" /></button>;
  const text = (label, handler) => <button className="care-text" onClick={handler}>{label}</button>;
  const copy = (title, body) => <><h1 ref={heading} tabIndex={-1}>{title}</h1>{body && <p className="care-body">{body}</p>}</>;
  const back = () => {
    if (returning || s.stage === 'arrival' || viewingSaved) { onExit?.(); return; }
    if (s.stage === 'orient') { go('action'); return; }
    go(CARE_STAGES[Math.max(0, CARE_STAGES.indexOf(s.stage) - 1)]);
  };
  const currentStage = Math.max(0, CARE_STAGES.indexOf(s.stage));
  const outcome = careOutcome(id, s);
  return <div className="care-practice" data-care={id} data-reduced-motion={prefs.reducedMotion || undefined} style={{ '--care-accent': config.accent }} onClick={countClick}>
    <header className="care-header"><button aria-label="Go back" onClick={back}><ArrowLeft size={20} /></button><div><span>MENTICATION</span><p>{config.title}</p></div><button aria-label="Exit and keep draft" onClick={() => onExit?.()}><X size={20} /></button></header>
    <div className="care-progress" role="progressbar" aria-label="Practice progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={currentStage}><i style={{ width: `${currentStage / 7 * 100}%` }} /></div>
    <main className="care-main">
      <JourneyOptions id={id} />
      <Artwork motif={config.motif} level={Math.floor(s.clicks / 2)} practice={s.stage === 'practice'} />
      <section className="care-card">
        <p className="care-eyebrow">{returning ? 'Welcome back' : viewingSaved ? 'Your saved card' : s.stage === 'practice' ? 'Take your time' : `${config.goal === 'reset' ? 'Thoughts' : 'Care'} · ${currentStage + 1} / 8`}</p>
        {returning ? <>{copy('Pick up where you left off.', 'Your unfinished practice is stored on this device.')}{primary('Resume practice', () => setReturning(false))}{text('Start a fresh practice', restart)}{text('Delete draft and leave', discard)}</> : <>
          {s.stage === 'arrival' && <>{copy(config.title, config.intro)}<p className="care-small">About 2–4 minutes · No audio needed</p>{primary('Begin', () => go('baseline'))}{saved && text('Open my saved card', () => { setViewingSaved(true); set({ ...saved, stage: 'complete' }); })}<p className="care-privacy">Your words stay on this device. An automatic draft lasts 24 hours after your last change. Finish clears it; Save keeps a separate card.</p></>}
          {(s.stage === 'baseline' || s.stage === 'rerate') && <>{copy(s.stage === 'baseline' ? 'Before you begin.' : 'Check in with yourself.', s.stage === 'rerate' ? 'Choose what is true now. A feeling does not have to improve for a useful step to count.' : 'Choose a number, or leave this blank.')}<Rating config={config} value={s.stage === 'baseline' ? s.before : s.after} onChange={value => patch(s.stage === 'baseline' ? { before: value } : { after: value })} />{primary('Continue', () => go(s.stage === 'baseline' ? 'notice' : 'complete'))}{text('Skip rating', () => go(s.stage === 'baseline' ? 'notice' : 'complete', s.stage === 'baseline' ? { before: null } : { after: null }))}</>}
          {s.stage === 'notice' && <>{copy(config.noticeTitle, config.noticeBody)}<Field label={config.noticeLabel} value={s.notice} suggestions={config.notices} onChange={notice => patch({ notice })} onChoose={notice => patch({ notice })} />{primary('Continue', () => go('perspective'), !s.notice.trim())}{text('Keep the words in my mind', () => go('perspective', { notice: '' }))}</>}
          {s.stage === 'perspective' && <>{copy(config.perspectiveTitle, config.perspectiveBody)}{s.notice && <blockquote>{s.notice}</blockquote>}<Field label={config.perspectiveLabel} value={s.perspective} suggestions={config.perspectives} onChange={perspective => patch({ perspective })} onChoose={perspective => patch({ perspective })} />{primary(id === 'makeRoom' ? 'Try a little room' : 'Try this response', () => go('practice', { practiceTaken: true }), !s.perspective.trim())}{text(id === 'makeRoom' ? 'Not now — stay with the room' : 'Go straight to a useful action', () => go(id === 'makeRoom' ? 'orient' : 'action'))}</>}
          {s.stage === 'practice' && <>{copy(config.practiceTitle, config.practiceBody)}{s.perspective && <blockquote className="care-response">{s.perspective}</blockquote>}<p className="care-small">Stay for a few moments, or move on when you want.</p>{primary('Choose my next step', () => go('action'))}{text('Stop practice and look around', () => go('orient'))}</>}
          {s.stage === 'orient' && <>{copy('Come back to the room.', 'Look at an ordinary object nearby. Notice its edges or colour. Let your attention stay outside for a moment.')}<p className="care-small">You can end here or choose a simple next step.</p>{primary('Choose a next step', () => go('action'))}{text('End practice', () => go('rerate'))}</>}
          {s.stage === 'action' && <>{copy(config.actionTitle, 'Pick something small enough for right now. You can do it before moving on, or leave it as a plan.')}<Field label="My next step" value={s.action} suggestions={config.actions} onChange={action => patch({ action })} onChoose={action => patch({ action })} />{primary('I did this step', () => go('rerate', { actionStatus: 'done' }), !s.action.trim())}{primary('Keep it as my next step', () => go('rerate', { actionStatus: 'planned' }), !s.action.trim())}{text('No next step for now', () => go('rerate', { actionStatus: 'not-now', action: '' }))}</>}
          {s.stage === 'complete' && <>{copy(viewingSaved ? 'A response to return to.' : 'Take this with you.', config.returnLine)}{s.perspective && <blockquote className="care-response">{s.perspective}</blockquote>}{s.action && <div className="care-takeaway"><span>{s.actionStatus === 'done' ? 'You did' : 'Your next step'}</span><p>{s.action}</p></div>}<p className="care-small">{outcome.change === null ? 'No before-and-after comparison: one or both ratings were left blank.' : `Your ratings: ${s.before} → ${s.after} / 10. ${outcome.change === 0 ? 'You reported no change.' : outcome.change < 0 ? 'You reported less difficulty.' : 'You reported more difficulty.'}`}</p>{primary(viewingSaved ? 'Close card' : 'Finish', finish)}{!viewingSaved && text('Save my card on this device', save)}{saved && text('Delete saved card', removeSaved)}{text('Practise again', restart)}</>}
        </>}
        {error && <p role="alert" className="care-error">{error}</p>}{message && <p role="status" className="care-small">{message}</p>}
      </section>
      <div className="care-milestone" role="status" aria-live="polite" aria-atomic="true" key={`milestone-${Math.floor(s.clicks / 2)}`}><span aria-hidden="true">✧</span><p>{s.milestone || 'One small moment of attention.'}</p></div>
      {!draftOk && <p role="alert" className="care-error">This device could not save your draft. You can continue here, but progress may be lost when you leave.</p>}
      {!viewingSaved && !returning && <button className="care-text care-delete" onClick={discard}>Delete draft and leave</button>}
    </main>
  </div>;
}
