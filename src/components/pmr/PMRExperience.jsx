import { clearPracticeDraft } from '@/lib/practiceInteraction';
import PracticeIllustration from '@/components/journey/PracticeIllustration';
import '@/styles/practice-editorial.css';
import PracticeCheckpoint from '@/components/journey/PracticeCheckpoint';
import { practiceEvent as earned } from '@/lib/practiceCheckpoints';
import { useJourneyScreenHistory } from '@/hooks/useJourneyScreenHistory';
import PMRRoute, { PMRGuideChoice } from './PMRRoute';
import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PMRV2Stage from '@/components/PMRV2Stage';
import { HELPFULNESS } from '@/lib/attemptFeedback';
import { createPMRSteps, nextPMRArea, PMR_OUTCOMES, restorePMRSession } from '@/lib/pmrSession';
import { usePMRPlayback } from '@/hooks/usePMRPlayback';
import { usePMRSoundscape } from '@/hooks/usePMRSoundscape';
import { interventionThemeStyle, paletteForIntervention } from '@/lib/mentationThemes';
import { getActiveFlagship, saveActiveFlagship } from '@/lib/flagshipMemory';
import '@/styles/pmr-session.css';

function Playback({ step, index, running, audio, onPause, onResume, onNext, released, onSkip }) {
  const elapsed = usePMRPlayback({ step, stepIndex: index, running, audioEnabled: audio, onPause, onResume, onComplete: onNext });
  usePMRSoundscape({ active: audio, running, narrationActive: audio && running });
  return <>
    <PMRV2Stage step={step} stepIndex={index} elapsed={elapsed} running={running} released={released}
      onNextBodyPart={onSkip} nextBodyPartLabel={step.region === 'whole' ? 'Continue' : 'Skip this area'} />
    <p className="pmr-session-time" aria-label="Time remaining in this stage">{Math.ceil(Math.max(0, step.holdSec - elapsed))}s</p>
  </>;
}

export default function PMRExperience({ intervention, answers, onComplete, onExit, onAttemptEvent }) {
  const [restored] = useState(() => {const active=getActiveFlagship();return active?.interventionId === intervention.id ? restorePMRSession(active.experience, intervention.steps) : {};});
  const [finishError,setFinishError] = useState(false);
  const [resumeError,setResumeError] = useState(false);
  const completionSent = useRef(false);
  const startedAt = useRef(restored.startedAt || null);
  const completedIds = useRef(new Set(restored.completedIds || []));
  const [phase, setPhase] = useState(restored.phase ?? 'setup');
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); document.querySelector('.pmr-session')?.scrollTo({ top: 0 }); }, [phase]);
  const [mode, setMode] = useState(restored.mode ?? 'release');
  const [length, setLength] = useState(restored.length ?? 'short');
  const [modeChosen,setModeChosen] = useState(restored.modeChosen === true);
  const [lengthChosen,setLengthChosen] = useState(restored.lengthChosen === true);
  const [guideView, setGuideView] = useState(restored.guideView ?? 'body');
  const [index, setIndex] = useState(restored.index ?? 0);
  const [running, setRunning] = useState(!restored.phase);
  const [audio, setAudio] = useState(!restored.phase && !answers?.noAudio && !answers?.discreet && answers?.audio === 'yes');
  const [released, setReleased] = useState(restored.released ?? []);
  const [skipped, setSkipped] = useState(restored.skipped ?? []);
  const [outcome, setOutcome] = useState(restored.outcome ?? null);
  const [helpfulness, setHelpfulness] = useState(restored.helpfulness ?? null);
  const [completedSteps, setCompletedSteps] = useState(restored.completedSteps ?? 0);
  const [stopped, setStopped] = useState(restored.stopped ?? false);
  const steps = useMemo(() => createPMRSteps(intervention.steps, { mode, length }), [intervention.steps, mode, length]);
  useJourneyScreenHistory(intervention.id, phase, next => { if (['setup','length','practice','outcome','helpfulness'].includes(next)) { setRunning(false);setPhase(next); } });
  const routeEvents = [earned('mode','Your approach',mode === 'release' ? 'Release without tensing' : 'Gentle tense and release',modeChosen),earned('length','Your route',length === 'short' ? 'Hands → shoulders → calves & feet' : 'Seven areas, at your pace',lengthChosen)];
  const practiceEvents = [...routeEvents,...released.map(region => earned(region,'Release guidance completed', {hands:'Hands & forearms',shoulders:'Arms & shoulders',face:'Jaw & face',torso:'Chest & abdomen',hips:'Glutes & hips',thighs:'Thighs',lowerLegs:'Calves & feet'}[region] || region)), earned('outcome','Your tension check',PMR_OUTCOMES.find(([id])=>id===outcome)?.[1]), earned('helpfulness','Your assessment',HELPFULNESS.find(item=>item.id===helpfulness)?.label)];
  const step = steps[index];
  const chooseRoute = (nextMode, nextLength) => {
    const route=createPMRSteps(intervention.steps,{mode:nextMode,length:nextLength});
    let next=route.findIndex(item=>item.region===step.region && item.phase===step.phase);
    if(next<0) next=route.findIndex(item=>item.region===step.region);
    if(next<0) next=route.findIndex(item=>!completedIds.current.has(`${item.region}:${item.phase}`));
    setMode(nextMode);setLength(nextLength);setIndex(next<0 ? route.length-1 : next);
  };
  useEffect(() => { if (!completionSent.current) setResumeError(!saveActiveFlagship({interventionId:intervention.id,experience:{phase,mode,length,modeChosen,lengthChosen,guideView,index,released,skipped,outcome,helpfulness,completedSteps,stopped,completedIds:[...completedIds.current],startedAt:startedAt.current}})); }, [intervention.id,phase,mode,length,modeChosen,lengthChosen,guideView,index,released,skipped,outcome,helpfulness,completedSteps,stopped]);
  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);
  const finish = useCallback(() => { setRunning(false); setPhase('outcome'); }, []);
  const advance = () => {
    const key = `${step.region}:${step.phase}`;
    if (!completedIds.current.has(key)) { completedIds.current.add(key);setCompletedSteps(value => Math.min(steps.length, value + 1)); }
    if (step.phase === 'release' && step.region !== 'whole') setReleased(prev => [...new Set([...prev, step.region])]);
    if (index + 1 >= steps.length) finish(); else setIndex(index + 1);
  };
  const skip = () => {
    if (step.region !== 'whole') {
      setSkipped(prev => [...new Set([...prev, step.region])]);
      setReleased(prev => prev.filter(region => region !== step.region));
    }
    const next = nextPMRArea(steps, index);
    if (next >= steps.length) finish(); else setIndex(next);
  };
  const complete = (navigateTo) => {
    if (completionSent.current) return;
    if (!clearPracticeDraft(undefined,intervention.id)) {setFinishError(true);return;}
    completionSent.current = true;

    // Mechanism-specific report is distinct from the shared before/after scale.
    onAttemptEvent?.({ interventionId: intervention.id, mechanism: intervention.mechanism,
      action: 'completed', exitReason: stopped ? 'exited' : released.length === 0 && skipped.length > 0 ? 'skipped' : 'completed', startedAt: startedAt.current,
      completedPercentage: steps.filter(item => completedIds.current.has(`${item.region}:${item.phase}`)).length / steps.length, helpfulness, timestamp: Date.now() });
    onComplete({ requireGoalReassessment: true, helpfulness, navigateTo,
      outcome: { type: 'pmr', tensionResponse: outcome, mode, length, skippedRegions: skipped, stopped } });
  };
  const palette = paletteForIntervention(intervention, answers?.direction);
  return <div className="intervention-theme pmr-session" data-guide-view={guideView} data-intervention-theme={palette.id} style={interventionThemeStyle(palette)}>
    <div className="pmr-v2-player-ambient" aria-hidden="true" />
    {finishError && <p role="alert" className="pmr-session-error">Your draft could not be cleared. Try Finish again.</p>}
    <header className="pmr-session-header">{['length', 'outcome', 'helpfulness'].includes(phase) && <button onClick={() => setPhase(phase === 'length' ? 'setup' : phase === 'helpfulness' ? 'outcome' : 'practice')}>Back</button>}<button onClick={onExit} aria-label="Exit Progressive Muscle Relaxation">Exit</button><span>Progressive Muscle Relaxation</span></header>
    {phase === 'setup' ? <main className="pmr-session-panel">
      <PracticeIllustration kind="body"/><h1 ref={heading} tabIndex={-1}>How would you like to practise?</h1>
      <p>If an area is painful, injured or unsafe to tense, choose release only. You can skip any area or stop.</p>
      <fieldset><legend className="sr-only">Practice style</legend>
        <button aria-pressed={mode === 'release'} onClick={() => {chooseRoute('release', length);setModeChosen(true);setPhase('length');}}>Release only<span>Notice and soften, without tensing.</span></button>
        <button aria-pressed={mode === 'contrast'} onClick={() => {chooseRoute('contrast', length);setModeChosen(true);setPhase('length');}}>Gentle tense and release<span>Only where tensing feels comfortable and safe.</span></button>
      </fieldset>

    </main> : phase === 'length' ? <main className="pmr-session-panel">
      <h1 ref={heading} tabIndex={-1}>How long feels comfortable?</h1>
      <fieldset><legend className="sr-only">Session length</legend>
        <button aria-pressed={length === 'short'} onClick={() => {chooseRoute(mode, 'short');setLengthChosen(true);}}>Short · three areas<span>Hands, shoulders, calves and feet.</span></button>
        <button aria-pressed={length === 'full'} onClick={() => {chooseRoute(mode, 'full');setLengthChosen(true);}}>Full · seven areas<span>The complete body sequence.</span></button>
      </fieldset>
      {lengthChosen && <PracticeCheckpoint compact variant="body" title="Your route, ready" events={routeEvents}/>}
      <PMRRoute steps={steps} preview />
      <p>About {Math.ceil(steps.reduce((sum, item) => sum + item.holdSec, 0) / 60)} minutes. Breathe normally. Relax, skip or stop whenever you need.</p>
      <button className="pmr-session-primary" onClick={() => { startedAt.current ||= Date.now(); setRunning(true); setStopped(false); setPhase('practice'); }}>Begin {mode === 'release' ? 'release only' : 'gentle tense and release'}</button>
    </main> : phase === 'practice' ? <>
      <PMRRoute steps={steps} index={index} skipped={skipped} />
      <main className="pmr-session-stage"><Playback step={step} index={index} running={running} audio={audio} onPause={pause} onResume={resume} onNext={advance} released={released} onSkip={skip} /></main>
      <PracticeCheckpoint compact variant="body" title="Your guided route" events={practiceEvents}/>
      <footer className="pmr-session-controls">
        <button onClick={() => setRunning(value => !value)} aria-label={running ? 'Pause PMR' : 'Resume PMR'}>{running ? 'Pause' : 'Resume'}</button>
        <button aria-pressed={audio} onClick={() => setAudio(value => !value)} disabled={answers?.noAudio || answers?.discreet}>Audio {audio ? 'on' : 'off'}</button>
        <button onClick={() => { setStopped(true); finish(); }}>Stop and check in</button>
        {!running && <p role="status">Paused. Let go of any tension. Continue only if comfortable.</p>}
        <details className="pmr-view-tools"><summary>Guide view</summary><PMRGuideChoice value={guideView} onChange={setGuideView} /></details>
      </footer>
    </> : phase === 'outcome' ? <main className="pmr-session-panel">
      <h1 ref={heading} tabIndex={-1}>Where is tension now?</h1>
      <p>Optional. An unchanged feeling is okay.</p>
      <fieldset><legend className="sr-only">Optional tension check</legend>{PMR_OUTCOMES.map(([value, label]) => <button key={value} aria-pressed={outcome === value} onClick={() => setOutcome(value)}>{label}</button>)}</fieldset>
      {outcome && <p role="status">{PMR_OUTCOMES.find(([value]) => value === outcome)[2]}</p>}
      <button className="pmr-session-primary" onClick={() => complete()}>{outcome ? 'Continue to check-in' : 'Skip tension check'}</button>
      <button className="pmr-session-quiet" onClick={() => setPhase('helpfulness')}>Optional: rate helpfulness</button>
    </main> : <main className="pmr-session-panel">
      <h1 ref={heading} tabIndex={-1}>Was this practice helpful?</h1>
      <p>Optional. Choose what fits, or continue without answering.</p>
      <fieldset className="pmr-helpfulness"><legend className="sr-only">Practice helpfulness</legend>{HELPFULNESS.map(item => <button key={item.id} aria-pressed={helpfulness === item.id} onClick={() => setHelpfulness(item.id)}>{item.label}</button>)}</fieldset>
      <p>{stopped ? 'You stopped the practice.' : 'You reached the end of your chosen route.'}{skipped.length > 0 ? ` You skipped ${skipped.length} ${skipped.length === 1 ? 'area' : 'areas'}.` : ''} The illustration guides attention; it does not measure relaxation.</p>
      <button className="pmr-session-primary" onClick={() => complete()}>{helpfulness ? 'Continue to check-in' : 'Skip and continue'}</button>
      {outcome === 'more_uncomfortable' && <button onClick={() => complete('/library')}>Check in, then open Library</button>}
    </main>}
    {['outcome','helpfulness'].includes(phase) && <PracticeCheckpoint compact variant="body" title="Your practice and your own check-in" events={practiceEvents}/>}
    {resumeError && <p className="relative z-10 px-5" role="alert">Progress could not be saved on this device. You can continue here, but it may be lost if you leave.</p>}
    <div className="relative z-10 px-5"><JourneyOptions id={intervention.id} onOpen={pause} /></div>
  </div>;
}
