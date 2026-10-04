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
  const [confirmed, setConfirmed] = useState(false);
  const [hasMoreTime, setHasMoreTime] = useState(false);
  const session = state?.completedSession;
  const completedHappyBump = session?.direction === 'lift' && session?.completed_pathway?.includes('happyBump');
  if (!completedHappyBump) return <Navigate to="/" replace />;
  const options = liftJourneyOptions({ completedHappyBump, mood, distress, confirmed, hasMoreTime, answers: session.context_snapshot });
  const confirm = () => {
    const updated = withLiftCheckin(session, mood, distress);
    if (!updated) return;
    sessionStore.create(updated).catch(() => {});
    setConfirmed(true);
  };
  return (
    <main className="calmbg min-h-[100dvh] px-5 py-6">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <FlowHomeButton />
        <h1 className="font-heading text-3xl text-primary">How is your mood now?</h1>
        <p className="text-muted-foreground">Your Happy Bump is complete. Take a fresh read of your mood and distress before choosing what comes next.</p>
        {!confirmed ? <>
          <label className="flex flex-col gap-3 text-primary">Mood · {mood ?? 'Choose a rating'}
            <input aria-label="Mood now" type="range" min="0" max="10" value={mood ?? 5} onChange={(event) => setMood(Number(event.target.value))} />
            <span className="flex justify-between text-sm"><span>0 · Very low</span><span>10 · Great</span></span>
          </label>
          <label className="flex flex-col gap-3 text-primary">Distress · {distress ?? 'Choose a rating'}
            <input aria-label="Distress now" type="range" min="0" max="10" value={distress ?? 5} onChange={(event) => setDistress(Number(event.target.value))} />
            <span className="flex justify-between text-sm"><span>0 · None</span><span>10 · Extreme</span></span>
          </label>
          <p className="text-sm text-muted-foreground">Move each slider to answer. The starting position is not a saved answer.</p>
          <Button disabled={mood == null || distress == null} onClick={confirm} className="rounded-full">Confirm my check-in</Button>
          <Button variant="outline" onClick={() => navigate('/', { replace: true })} className="rounded-full">Finish here</Button>
        </> : <>
          {mood >= 5 && distress <= 5 && liftJourneyOptions({ completedHappyBump, mood, distress, confirmed, hasMoreTime: true, answers: session.context_snapshot }).length > 0 ? <>
            <p className="text-muted-foreground">If you want to continue, these are separate, longer journeys. They open only when you choose one.</p>
            <label className="flex min-h-12 items-center gap-3 text-primary"><input type="checkbox" checked={hasMoreTime} onChange={(event) => setHasMoreTime(event.target.checked)} />I have time for a longer journey</label>
            {options.map((item) => <button key={item.id} className="rounded-2xl border border-border bg-card p-5 text-left text-primary" onClick={() => navigate(item.route)}><strong className="block text-lg">{item.name}</strong><span className="text-sm text-muted-foreground">{item.time}</span></button>)}
          </> : <p className="text-muted-foreground">You can finish here. A longer reflection is not suggested from this check-in and setting.</p>}
          <Button onClick={() => navigate('/', { replace: true })} className="rounded-full">Finish here</Button>
        </>}
      </div>
    </main>
  );
}
