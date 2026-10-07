import IntensityDial from "@/components/IntensityDial";
import { GOAL_ASSESSMENTS, goalPointChange } from "@/lib/goalAssessment";
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import FlowHomeButton from '@/components/FlowHomeButton';
import { Button } from '@/components/ui/button';
import { liftJourneyOptions, withLiftCheckin, isAnsweredRating } from '@/lib/liftFollowup';
import { sessionStore } from '@/lib/localData';
import { useJourneyScreenHistory } from '@/hooks/useJourneyScreenHistory';

const SCREENS = ['mood', 'distress', 'complete', 'journeys'];
export default function LiftFollowup() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const session = state?.completedSession;
  const [draft] = useState(() => {
    const saved = window.history.state?.lift_checkin;
    return saved?.sessionId === session?.id ? saved : {};
  });
  const [phase, setPhase] = useState(SCREENS.includes(draft.phase) ? draft.phase : 'mood');
  const [mood, setMood] = useState(isAnsweredRating(draft.mood) ? draft.mood : null);
  const [distress, setDistress] = useState(isAnsweredRating(draft.distress) ? draft.distress : null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(draft.confirmed === true);
  const heading = useRef(null);
  useJourneyScreenHistory('lift-followup', phase, next => { if (SCREENS.includes(next)) setPhase(next); });
  useEffect(() => {
    try { window.history.replaceState({...window.history.state,lift_checkin:{sessionId:session?.id,phase,mood,distress,confirmed}},''); } catch { /* The live answers remain usable when navigation storage is blocked. */ }
  }, [session?.id,phase,mood,distress,confirmed]);
  useEffect(() => { heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'}); }, [phase]);
  const completedHappyBump = session?.direction === 'lift' && session?.completed_pathway?.includes('happyBump');
  if (!completedHappyBump) return <Navigate to="/" replace />;
  const options = liftJourneyOptions({ completedHappyBump, mood, distress, confirmed, hasMoreTime:true, answers:session.context_snapshot });
  const confirm = async (rating = distress) => {
    if (saving) return;
    const updated = withLiftCheckin(session, mood, rating);
    setDistress(rating);
    if (updated) {
      setSaving(true);setSaveError('');
      try { await sessionStore.create(updated); }
      catch { setSaveError('This check-in was not saved on this device. Your answers still guide the choices below.'); }
      finally { setSaving(false); }
    }
    setConfirmed(true);setPhase('complete');
  };
  const finish = () => navigate('/', {replace:true});
  const change = goalPointChange(session.goal_baseline,'lift',mood);
  return <main className="calmbg min-h-[100dvh] px-5 py-6">
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between"><FlowHomeButton />{phase !== 'mood' && <Button variant="ghost" disabled={saving} onClick={() => setPhase(phase === 'distress' ? 'mood' : phase === 'journeys' ? 'complete' : 'distress')}>Back</Button>}</div>
      <h1 ref={heading} tabIndex={-1} className="font-heading text-4xl leading-tight text-primary">{phase === 'mood' ? GOAL_ASSESSMENTS.lift.question : phase === 'distress' ? 'How distressed do you feel now?' : phase === 'journeys' ? 'Would you like a longer journey?' : 'Your check-in is complete.'}</h1>
      {saveError && <p role="alert" className="text-primary">{saveError}</p>}
      {phase === 'mood' ? <>
        <p className="text-muted-foreground">Optional. A fresh read of your mood, separate from energy.</p>
        <IntensityDial value={mood} onChange={setMood} direction="lift" />
        <Button disabled={mood == null} onClick={() => setPhase('distress')} className="min-h-14 w-full rounded-full text-lg">Continue</Button>
        <Button variant="ghost" onClick={() => {setMood(null);setPhase('distress');}}>Skip mood rating</Button>
      </> : phase === 'distress' ? <>
        <p className="text-muted-foreground">Optional. This is separate from mood. The starting position is unanswered.</p>
        <label className="flex flex-col gap-4 text-primary"><span>Distress · {distress ?? 'Not answered'}</span>
          <input aria-label="Distress now" aria-valuetext={distress == null ? 'Not answered yet. Move the slider to choose a rating.' : `${distress} out of 10`} type="range" min="0" max="10" value={distress ?? 5} onChange={event => setDistress(Number(event.target.value))} />
          <span className="flex justify-between text-sm"><span>0 · None</span><span>10 · Extreme</span></span>
        </label>
        <Button disabled={saving || distress == null} onClick={() => confirm()} className="min-h-14 w-full rounded-full text-lg">{saving ? 'Confirming…' : 'Confirm my check-in'}</Button>
        <Button variant="ghost" disabled={saving} onClick={() => confirm(null)}>Skip distress rating</Button>
      </> : phase === 'journeys' ? <>
        <p className="text-muted-foreground">These need more time. Open one only if it suits your setting and you want to continue.</p>
        {options.map(item => <button key={item.id} className="min-h-16 w-full rounded-2xl border border-border bg-card p-5 text-left text-primary" onClick={() => navigate(item.route)}><strong className="block text-lg">{item.name}</strong><span className="text-sm text-muted-foreground">{item.time}</span></button>)}
        <Button variant="ghost" onClick={finish}>Finish here</Button>
      </> : <>
        <p className="text-primary">{change == null ? 'Mood change not measured.' : `Mood: ${session.goal_baseline.value} → ${mood} · ${change > 0 ? '+' : ''}${change} points`}</p>
        <p className="text-muted-foreground">You can finish without feeling better. Rest somewhere comfortable or contact someone you trust if you want support.</p>
        <Button onClick={finish} className="min-h-14 w-full rounded-full text-lg">Finish here</Button>
        {options.length > 0 && <Button variant="ghost" onClick={() => setPhase('journeys')}>Optional: explore a longer journey</Button>}
      </>}
      {['mood','distress'].includes(phase) && <Button variant="ghost" disabled={saving} onClick={finish}>Finish here</Button>}
    </div>
  </main>;
}
