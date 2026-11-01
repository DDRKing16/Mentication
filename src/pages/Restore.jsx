import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { restoreActivity, RESTORE_ACTIVITIES, RESTORE_DRAFT_KEY, readRestoreDraft, readRestorePlans, readRestoreOutcome, writeRestoreDraft, saveRestoreOutcome, restoreClock } from '@/lib/restore';
import '@/styles/discovery.css';
import '@/styles/restore.css';

const storage = () => { try { return window.localStorage; } catch { return null; } };
export default function Restore() {
  const [params, setParams] = useSearchParams();
  const heading = useRef(null);
  const initial = useRef(readRestoreDraft(storage()));
  const activity = restoreActivity(params.get('activity'));
  const stage = params.get('stage') || 'prepare';
  const parsedStep = Number(params.get('step') || 0);
  const step = Number.isInteger(parsedStep) && parsedStep >= 0 && parsedStep <= 2 ? parsedStep : 0;
  const previousOutcome = useRef(readRestoreOutcome(storage(), params.get('attempt')));
  const matchingDraft = initial.current?.id === activity?.id ? initial.current : null;
  const [elapsed, setElapsed] = useState(matchingDraft?.elapsed || previousOutcome.current?.elapsed || 0);
  const [target, setTarget] = useState(matchingDraft?.target || (activity?.minutes || 5) * 60);
  const [plan, setPlan] = useState(matchingDraft?.plan || previousOutcome.current?.plan || '');
  const [attemptId, setAttemptId] = useState(matchingDraft?.attemptId || (/^[a-zA-Z0-9-]{8,80}$/.test(params.get('attempt') || '') ? params.get('attempt') : crypto.randomUUID()));
  const [running, setRunning] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const outcome = ['completed', 'stopped', 'planned'].includes(params.get('outcome')) ? params.get('outcome') : 'stopped';
  const [feedback, setFeedback] = useState(previousOutcome.current?.feedback || null);
  const [saved, setSaved] = useState(Boolean(previousOutcome.current));
  const [draft, setDraft] = useState(initial.current);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    setRunning(false);
  }, [params]);
  useEffect(() => {
    if (!running) return undefined;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(); const seconds = Math.min(2, (now - previous) / 1000); previous = now;
      setElapsed(value => value + seconds);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (!activity || stage !== 'practice') return;
    const value = { id: activity.id, step, elapsed, target, attemptId, plan };
    setSaveError(!writeRestoreDraft(storage(), value));
    setDraft(value);
  }, [activity, step, elapsed, target, attemptId, plan, stage]);
  const choose = item => {
    setAttemptId(crypto.randomUUID()); setElapsed(0); setTarget(item.minutes * 60); setPlan(''); setFeedback(null); setSaved(false); setSaveError(false);
    setParams({ activity: item.id });
  };
  const begin = () => { setParams({ activity: activity.id, stage: 'practice', step: '0' }); };
  const move = next => setParams({ activity: activity.id, stage: 'practice', step: String(next) });
  const finish = value => {
    setRunning(false); setFeedback(null); setSaved(false);
    setParams({ activity: activity.id, stage: 'reflection', outcome: value, attempt: attemptId });
  };
  const save = value => {
    if (saved) return;
    setFeedback(value);
    const ok = saveRestoreOutcome(storage(), { id: activity.id, outcome, elapsed, attemptId, plan, feedback: value });
    setSaved(ok); setSaveError(!ok); if (ok) { setDraft(null); initial.current = null; }
  };
  const resume = () => {
    const latest = readRestoreDraft(storage()); if (!latest) return;
    setElapsed(latest.elapsed); setTarget(latest.target); setPlan(latest.plan || ''); setAttemptId(latest.attemptId || crypto.randomUUID()); setSaved(false);
    setParams({ activity: latest.id, stage: 'practice', step: String(latest.step) });
  };
  const clear = () => {
    try { storage()?.removeItem(RESTORE_DRAFT_KEY); setDraft(null); } catch { setSaveError(true); }
  };
  const recentPlans = readRestorePlans(storage());
  const active = Boolean(activity && stage === 'practice');
  const reflection = Boolean(activity && stage === 'reflection');
  const title = !activity ? 'What would feel restful?' : reflection ? 'How was that pause?' : active ? activity.steps[step][0] : activity.title;
  return <main className="discovery-page restore-page"><div className="discovery-shell">
    <nav className="discovery-topline" aria-label="Page navigation">
      {active && step > 0 ? <button type="button" className="discovery-text-button" onClick={() => move(step - 1)}><ArrowLeft size={17} aria-hidden="true" />Back</button> : activity ? <button type="button" className="discovery-text-button" onClick={() => setParams({})}><ArrowLeft size={17} aria-hidden="true" />Restoring options</button> : <Link to="/" className="discovery-text-button"><ArrowLeft size={17} aria-hidden="true" />Home</Link>}
      {activity ? <Link to="/" className="discovery-text-button">Exit to Home</Link> : <span className="discovery-eyebrow">Restore</span>}
    </nav>
    <header className="discovery-header"><p className="discovery-eyebrow">{active ? `Restore · ${step + 1} of 3` : 'Space to replenish'}</p>
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      <p>{!activity ? 'For when you feel depleted or need a gentler moment. Choose one restful activity, without a performance target.' : reflection ? `${outcome === 'planned' ? 'Plan prepared' : outcome === 'stopped' ? 'Stopped early' : 'Break finished'} · ${restoreClock(elapsed)} of active timer time. Only you decide whether it helped.` : active ? activity.steps[step][1] : activity.detail}</p>
    </header>
    {!activity ? <>
      {draft && <section className="discovery-reason"><h2>Continue your break</h2><p>{restoreActivity(draft.id)?.title} · step {draft.step + 1} of 3 · {restoreClock(draft.elapsed)}</p><button type="button" className="discovery-choice" onClick={resume}>Resume <ArrowRight size={19} aria-hidden="true" /></button><button type="button" className="discovery-text-button" onClick={clear}>Discard saved progress</button></section>}
      {recentPlans.length > 0 && <section className="discovery-reason"><h2>Your saved plans</h2>{recentPlans.map((item,index) => <div key={`${item.id}-${index}`}><strong>{restoreActivity(item.id)?.title}</strong><p>{item.plan}</p></div>)}<p className="restore-note">Saved only on this device. Settings → delete local app data removes these plans.</p></section>}
      <div className="discovery-choices" aria-label="Ten restoring activities">{RESTORE_ACTIVITIES.map(item => <button type="button" className="discovery-choice" key={item.id} onClick={() => choose(item)}><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight size={19} aria-hidden="true" /></button>)}</div>
      <details className="restore-sources"><summary>About these activity ideas</summary><p>General ideas from Oura’s public guidance, written here in Mentication’s own words. No ranking, partnership or personal advice from your ring is implied.</p><a href="https://ouraring.com/blog/how-to-increase-restorative-time/" target="_blank" rel="noopener noreferrer">Restorative time</a><a href="https://ouraring.com/blog/ouras-new-rest-mode-helps-optimize-your-recovery/" target="_blank" rel="noopener noreferrer">Recovery days</a><a href="https://ouraring.com/blog/guide-to-better-sleep-with-oura/" target="_blank" rel="noopener noreferrer">Sleep routines</a></details>
      <div className="discovery-footer-links"><Link to="/start">Not sure what you need? Guide me <ArrowRight size={17} aria-hidden="true" /></Link></div>
    </> : reflection ? <section className="discovery-reason">
      <p>Optional: do you feel more rested, about the same, or less rested?</p>
      <div className="restore-feedback" aria-label="Optional rest feedback">{[['more-rested','More rested'],['same','About the same'],['less-rested','Less rested']].map(([value,label]) => <button key={value} type="button" disabled={saved} aria-pressed={feedback === value} onClick={() => setFeedback(value)}>{label}</button>)}</div>
      <button type="button" disabled={saved || !feedback} className="discovery-choice" onClick={() => save(feedback)}>Save check-in <ArrowRight size={19} aria-hidden="true" /></button>
      <button type="button" disabled={saved} className="discovery-text-button" onClick={() => save(null)}>Save without feedback</button>
      {saved && <p role="status">Saved on this device as {outcome === 'planned' ? 'a plan, not a completed activity' : outcome === 'stopped' ? 'stopped early' : 'a completed break'}.</p>}
      <Link className="discovery-choice" to="/">Back to Home <ArrowRight size={19} aria-hidden="true" /></Link>
    </section> : active ? <section className="discovery-reason">
      {activity.planning && step === 1 && <label className="restore-plan">{activity.planLabel}<textarea maxLength={300} value={plan} onChange={event => setPlan(event.target.value)} placeholder={activity.placeholder} /><small>Optional · saved only on this device with your plan. Delete local app data in Settings to remove it.</small></label>}
      <div className="restore-timer"><span aria-label="Elapsed active practice time">{restoreClock(elapsed)}</span><small>{elapsed >= target ? 'Your chosen pause time has passed. Continue or finish when you choose.' : `Optional pause target ${restoreClock(target)} · no automatic completion`}</small><button type="button" className="restore-timer-toggle" onClick={() => setRunning(value => !value)}>{running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{running ? 'Pause timer' : 'Start timer'}</button></div>
      <p className="restore-note">Timer pauses when this app is hidden. For music, reading, viewing or walking, use your own materials and return when ready. Time alone never marks an activity complete.</p>
      <button type="button" className="discovery-choice" onClick={() => step < 2 ? move(step + 1) : finish(activity.planning ? 'planned' : 'completed')}>{step < 2 ? 'Continue' : activity.planning ? 'Finish planning' : 'Finish this break'}<ArrowRight size={19} aria-hidden="true" /></button>
      <button type="button" className="discovery-text-button" onClick={() => finish('stopped')}>Stop here</button>
    </section> : <section className="discovery-reason">
      <p>{activity.steps[0][1]}</p>{activity.note && <p>{activity.note}</p>}
      <label className="restore-duration">Optional pause target<select value={target} onChange={event => setTarget(Number(event.target.value))}>{[120,180,300,600].map(seconds => <option key={seconds} value={seconds}>{seconds / 60} minutes</option>)}</select></label>
      <p>No media or narration starts automatically. You can pause, stop or leave at any time.</p>
      <button type="button" className="discovery-choice" onClick={begin}>Begin <ArrowRight size={19} aria-hidden="true" /></button>
    </section>}
    {saveError && <p role="alert" className="restore-note">Device storage is unavailable. Progress or feedback could not be saved; keep this screen open if you want to continue.</p>}
  </div></main>;
}
