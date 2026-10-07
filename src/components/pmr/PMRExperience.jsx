import PMRRoute, { PMRGuideChoice } from './PMRRoute';
import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import PMRV2Stage from '@/components/PMRV2Stage';
import { HELPFULNESS } from '@/lib/attemptFeedback';
import { createPMRSteps, nextPMRArea, PMR_OUTCOMES } from '@/lib/pmrSession';
import { usePMRPlayback } from '@/hooks/usePMRPlayback';
import { usePMRSoundscape } from '@/hooks/usePMRSoundscape';
import { interventionThemeStyle, paletteForIntervention } from '@/lib/mentationThemes';
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
  const completionSent = useRef(false);
  const startedAt = useRef(null);
  const [phase, setPhase] = useState('setup');
  const [mode, setMode] = useState('release');
  const [length, setLength] = useState('short');
  const [guideView, setGuideView] = useState('body');
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [audio, setAudio] = useState(!answers?.noAudio && !answers?.discreet && answers?.audio === 'yes');
  const [released, setReleased] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [helpfulness, setHelpfulness] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [stopped, setStopped] = useState(false);
  const steps = useMemo(() => createPMRSteps(intervention.steps, { mode, length }), [intervention.steps, mode, length]);
  const step = steps[index];
  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);
  const finish = useCallback(() => { setRunning(false); setPhase('outcome'); }, []);
  const advance = () => {
    setCompletedSteps(value => value + 1);
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
    completionSent.current = true;
    // Mechanism-specific report is distinct from the shared before/after scale.
    onAttemptEvent?.({ interventionId: intervention.id, mechanism: intervention.mechanism,
      action: 'completed', exitReason: stopped ? 'exited' : released.length === 0 && skipped.length > 0 ? 'skipped' : 'completed', startedAt: startedAt.current,
      completedPercentage: completedSteps / steps.length, helpfulness, timestamp: Date.now() });
    onComplete({ requireGoalReassessment: true, helpfulness, navigateTo,
      outcome: { type: 'pmr', tensionResponse: outcome, mode, length, skippedRegions: skipped, stopped } });
  };
  const palette = paletteForIntervention(intervention, answers?.direction);
  return <div className="intervention-theme pmr-session" data-guide-view={guideView} data-intervention-theme={palette.id} style={interventionThemeStyle(palette)}>
    <div className="pmr-v2-player-ambient" aria-hidden="true" />
    <header className="pmr-session-header"><button onClick={onExit} aria-label="Exit Progressive Muscle Relaxation">Exit</button><span>Progressive Muscle Relaxation</span></header>
    {phase === 'setup' ? <main className="pmr-session-panel">
      <h1>Choose a comfortable way</h1>
      <p>Is any area painful, injured or unsafe to tense today? If yes or unsure, choose release only, skip that area, or stop.</p>
      <fieldset><legend>How would you like to practise?</legend>
        <button aria-pressed={mode === 'release'} onClick={() => setMode('release')}>Release only<span>Notice and soften, without tensing.</span></button>
        <button aria-pressed={mode === 'contrast'} onClick={() => setMode('contrast')}>Gentle tense and release<span>Only where tensing feels comfortable and safe.</span></button>
      </fieldset>
      <fieldset><legend>Session length</legend>
        <button aria-pressed={length === 'short'} onClick={() => setLength('short')}>Short · three areas<span>Hands, shoulders, calves and feet.</span></button>
        <button aria-pressed={length === 'full'} onClick={() => setLength('full')}>Full · seven areas<span>The complete body sequence.</span></button>
      </fieldset>
      <PMRRoute steps={steps} preview />
      <PMRGuideChoice value={guideView} onChange={setGuideView} />
      <p>About {Math.ceil(steps.reduce((sum, item) => sum + item.holdSec, 0) / 60)} minutes. Breathe normally. Relax, skip or stop whenever you need. Total relaxation is not required.</p>
      <button className="pmr-session-primary" onClick={() => { startedAt.current = Date.now(); setPhase('practice'); }}>Begin {mode === 'release' ? 'release only' : 'gentle tense and release'}</button>
    </main> : phase === 'practice' ? <>
      <PMRRoute steps={steps} index={index} skipped={skipped} />
      <main className="pmr-session-stage"><Playback step={step} index={index} running={running} audio={audio} onPause={pause} onResume={resume} onNext={advance} released={released} onSkip={skip} /></main>
      <footer className="pmr-session-controls">
        <PMRGuideChoice value={guideView} onChange={setGuideView} />
        {!running && <p role="status">Paused. Let go of any tension. Continue only if comfortable.</p>}
        <button onClick={() => setRunning(value => !value)} aria-label={running ? 'Pause PMR' : 'Resume PMR'}>{running ? 'Pause' : 'Resume'}</button>
        <button aria-pressed={audio} onClick={() => setAudio(value => !value)} disabled={answers?.noAudio || answers?.discreet}>Audio {audio ? 'on' : 'off'}</button>
        <button onClick={() => { setStopped(true); finish(); }}>Stop and check in</button>
      </footer>
    </> : <main className="pmr-session-panel">
      <h1>Where is tension now?</h1>
      <p>Any answer is valid. This is separate from your starting check-in.</p>
      <fieldset><legend>Optional tension check</legend>{PMR_OUTCOMES.map(([value, label]) => <button key={value} aria-pressed={outcome === value} onClick={() => setOutcome(value)}>{label}</button>)}</fieldset>
      {outcome && <p role="status">{PMR_OUTCOMES.find(([value]) => value === outcome)[2]}</p>}
      <fieldset className="pmr-helpfulness"><legend>Was this practice helpful? (optional)</legend>{HELPFULNESS.map(item => <button key={item.id} aria-pressed={helpfulness === item.id} onClick={() => setHelpfulness(item.id)}>{item.label}</button>)}</fieldset>
      <p>{stopped ? 'You stopped the practice.' : 'You reached the end of your chosen route.'}{skipped.length > 0 ? ` You skipped ${skipped.length} ${skipped.length === 1 ? 'area' : 'areas'}.` : ''} The illustration guides attention; it does not measure relaxation.</p>
      <button className="pmr-session-primary" onClick={() => complete()}>{outcome ? 'Continue to check-in' : 'Skip tension check'}</button>
      {outcome === 'more_uncomfortable' && <button onClick={() => complete('/library')}>Check in, then open Library</button>}
    </main>}
    <div className="relative z-10 px-5"><JourneyOptions id={intervention.id} onOpen={pause} /></div>
  </div>;
}
