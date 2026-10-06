import IntensityDial from "@/components/IntensityDial";
import { GOAL_ASSESSMENTS, goalPointChange } from "@/lib/goalAssessment";
import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import FlowHomeButton from '@/components/FlowHomeButton';
import { Button } from '@/components/ui/button';
import { liftJourneyOptions, withLiftCheckin } from '@/lib/liftFollowup';
import { sessionStore } from '@/lib/localData';

export default function LiftFollowup() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [mood, setMood] = useState(null);
  const [distress, setDistress] = useState(null);
  const [saveError,setSaveError]=useState('');
  const [saving,setSaving]=useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [hasMoreTime, setHasMoreTime] = useState(false);
  const session = state?.completedSession;
  const completedHappyBump = session?.direction === 'lift' && session?.completed_pathway?.includes('happyBump');
  if (!completedHappyBump) return <Navigate to="/" replace />;
  const options = liftJourneyOptions({ completedHappyBump, mood, distress, confirmed, hasMoreTime, answers: session.context_snapshot });
  const confirm = async () => {
    const updated = withLiftCheckin(session, mood, distress);
    if (!updated) return;
    setSaving(true);setSaveError('');
    try { await sessionStore.create(updated); }
    catch { setSaveError("This check-in was not saved on this device. Your answers still guide the choices below."); }
    finally { setSaving(false);setConfirmed(true); }
  };
  return (
    <main className="calmbg min-h-[100dvh] px-5 py-6">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <FlowHomeButton />
        <h1 className="font-heading text-3xl text-primary">{GOAL_ASSESSMENTS.lift.question}</h1>
        <p className="text-muted-foreground">Your Happy Bump is complete. Take a fresh read of your mood and distress before choosing what comes next.</p>
        {saveError && <p role="alert" className="text-primary">{saveError}</p>}
        {!confirmed ? <>
          <p className="text-primary">Mood · {mood ?? 'Choose a rating'}</p>
          <IntensityDial value={mood} onChange={setMood} direction="lift" />
          <label className="flex flex-col gap-3 text-primary">Distress · {distress ?? 'Choose a rating'}
            <input aria-label="Distress now" aria-valuetext={distress==null?"Not answered yet. Move the slider to choose a rating.":`${distress} out of 10`} type="range" min="0" max="10" value={distress ?? 5} onChange={(event) => setDistress(Number(event.target.value))} />
            <span className="flex justify-between text-sm"><span>0 · None</span><span>10 · Extreme</span></span>
          </label>
          <p className="text-sm text-muted-foreground">Choose a mood rating and move the distress slider to answer. The starting positions are not saved answers.</p>
          <Button disabled={saving || mood == null || distress == null} onClick={confirm} className="rounded-full">{saving?"Confirming…":"Confirm my check-in"}</Button>
          <Button variant="outline" onClick={() => navigate('/', { replace: true })} className="rounded-full">Finish here</Button>
        </> : <>
          <p className="text-primary">{goalPointChange(session.goal_baseline, 'lift', mood) == null ? 'Mood change not measured: no confirmed starting rating.' : `Mood: ${session.goal_baseline.value} → ${mood} · ${goalPointChange(session.goal_baseline, 'lift', mood) > 0 ? '+' : ''}${goalPointChange(session.goal_baseline, 'lift', mood)} points`}</p>
          {mood >= 5 && distress <= 5 && liftJourneyOptions({ completedHappyBump, mood, distress, confirmed, hasMoreTime: true, answers: session.context_snapshot }).length > 0 ? <>
            <p className="text-muted-foreground">If you want to continue, these are separate, longer journeys. They open only when you choose one.</p>
            <label className="flex min-h-12 items-center gap-3 text-primary"><input type="checkbox" checked={hasMoreTime} onChange={(event) => setHasMoreTime(event.target.checked)} />I have time for a longer journey</label>
            {options.map((item) => <button key={item.id} className="rounded-2xl border border-border bg-card p-5 text-left text-primary" onClick={() => navigate(item.route)}><strong className="block text-lg">{item.name}</strong><span className="text-sm text-muted-foreground">{item.time}</span></button>)}
          </> : <p className="text-muted-foreground">You can finish here without feeling better. Rest somewhere comfortable, choose one small comfort, or contact someone you trust if you want support. A longer reflection is not suggested from this check-in and setting.</p>}
          <Button onClick={() => navigate('/', { replace: true })} className="rounded-full">Finish here</Button>
        </>}
      </div>
    </main>
  );
}
