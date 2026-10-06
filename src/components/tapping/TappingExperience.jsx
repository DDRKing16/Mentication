import { useEffect, useRef, useState } from 'react';
import TappingSilhouette from './TappingSilhouette';
import { CONCERNS, TAPPING_POINTS, RATING_QUESTION, makeTappingResult, outcomeText } from './tappingProtocol';
import './tapping.css';

export default function TappingExperience({ onComplete, onExit, onChangeCourse, initialConcern }) {
  const [stage, setStage] = useState('choose');
  const [concern, setConcern] = useState(CONCERNS.find(c => c.id === initialConcern) || CONCERNS[0]);
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [index, setIndex] = useState(0);
  const [second, setSecond] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState('');
  const [rounds, setRounds] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef(null);
  const duration = useRef(0);
  const roundSkipped = useRef(false);
  const heading = useRef(null);
  const point = TAPPING_POINTS[index];
  const grounding = concern.id === 'grounding';
  const secondsPerPoint = index === 0 ? (grounding ? 12 : 30) : slow ? 16 : 12;
  const locating = index !== 0 && second < (slow ? 6 : 4);
  const tapping = stage === 'round' && !paused && !locating;

  useEffect(() => { heading.current?.focus(); }, [stage]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setQuiet(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => {
    if (stage !== 'round' || paused) return;
    const timer = window.setInterval(() => {
      duration.current += 1;
      setSecond(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, paused]);
  useEffect(() => {
    if (stage !== 'round' || second < secondsPerPoint) return;
    setSecond(0);
    if (index === TAPPING_POINTS.length - 1) { if (!roundSkipped.current) setRounds(r => r + 1); setStage('after'); }
    else setIndex(i => i + 1);
  }, [stage, second, secondsPerPoint, index]);
  useEffect(() => {
    if (!sound || !tapping || !audio.current) return;
    const ctx = audio.current;
    if (ctx.state !== 'running') return;
    try {
      const tone = ctx.createOscillator(); const gain = ctx.createGain();
      tone.frequency.value = 440; gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      tone.connect(gain); gain.connect(ctx.destination); tone.start(); tone.stop(ctx.currentTime + 0.12);
    } catch { setSound(false); setSoundError('Sound is unavailable. Follow the light or your own rhythm.'); }
  }, [second, sound, tapping]);
  useEffect(() => () => { audio.current?.close().catch(() => {}); }, []);

  async function toggleSound() {
    if (sound) { setSound(false); return; }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Unavailable');
      if (!audio.current) audio.current = new AudioContextClass();
      await audio.current.resume();
      if (audio.current.state !== 'running') throw new Error('Unavailable');
      setSound(true); setSoundError('');
    } catch { setSoundError('Sound is unavailable. Follow the light or your own rhythm.'); }
  }
  function begin() { roundSkipped.current = false; setIndex(0); setSecond(0); setPaused(false); setStopped(false); setAfter(null); setStage('round'); }
  function stop() { setStopped(true); setPaused(false); setStage('after'); }
  function skipPoint() {
    roundSkipped.current = true; setSkipped(n => n + 1); setSecond(0);
    if (index === TAPPING_POINTS.length - 1) { if (!roundSkipped.current) setRounds(r => r + 1); setStage('after'); }
    else setIndex(i => i + 1);
  }
  async function deliver(change = false) {
    if (busy) return;
    const callback = change ? onChangeCourse : onComplete;
    if (!callback) { if (onExit) onExit(); return; }
    setBusy(true); setError('');
    try {
      await callback(makeTappingResult({ concern: concern.id, before, after, roundsCompleted: rounds, stopped, skippedPoints: skipped, durationSeconds: duration.current }));
    } catch { setError('That didn’t finish. Your check-in is still here. Please try again.'); setBusy(false); }
  }
  function rate(value) {
    if (stage === 'before') { setBefore(value); setStage('ready'); }
    else { setAfter(value); setStage('result'); }
  }
  const isRating = stage === 'before' || stage === 'after';
  return <section className={`tapping-experience ${quiet ? 'tap-reduced' : ''}`} aria-label="Gentle Tapping">
    <div className="tap-wrap">
      <header className="tap-header"><span className="tap-wordmark">mentication</span><button className="tap-exit" aria-label="Exit tapping" onClick={onExit}>×</button></header>
      <div className="tap-eyebrow">CALM <span>·</span> GROUNDING</div>
      {stage === 'choose' && <>
        <h1 ref={heading} tabIndex={-1}>A softer place<br/>to land.</h1>
        <p className="tap-lead">Gentle tapping, one point at a time.</p>
        <div className="tap-intro-art"><TappingSilhouette point={TAPPING_POINTS[2]} quiet/></div>
        <div className="tap-choice-area"><h2>What’s here right now?</h2><p>Choose a manageable feeling. No need to revisit a memory.</p>
          <div className="tap-choices">{CONCERNS.map(c => <button key={c.id} onClick={() => { setConcern(c); setStage('before'); }}>{c.label}<span aria-hidden="true">→</span></button>)}</div>
          <p className="tap-small">EFT-style tapping · around 2 minutes</p>
        </div>
      </>}
      {isRating && <div className="tap-checkin">
        <p className="tap-kicker">{stage === 'before' ? 'BEFORE WE BEGIN' : stopped ? 'YOU STOPPED THE ROUND' : 'A MOMENT TO NOTICE'}</p>
        <h1 ref={heading} tabIndex={-1}>{RATING_QUESTION}</h1>
        <p>{stage === 'after' ? 'Hands at rest. Check in with the same feeling.' : grounding ? 'Notice how you feel now. Nothing to bring back.' : `Gently notice ${concern.phrase}. Stay with what feels manageable.`}</p>
        <div className="tap-rating" role="group" aria-label={`${RATING_QUESTION} 0 means none; 10 means as intense as it gets.`}>{Array.from({ length: 11 }, (_, n) => <button key={n} onClick={() => rate(n)} aria-label={`${n} out of 10`}>{n}</button>)}</div>
        <div className="tap-scale"><span>0 · None</span><span>10 · As intense as it gets</span></div>
        <button className="tap-secondary" onClick={() => rate(null)}>Skip this rating</button>
      </div>}
      {stage === 'ready' && <>
        <div className="tap-reveal"><p className="tap-kicker">{concern.label.toUpperCase()} · YOUR ROUND IS READY</p><h1 ref={heading} tabIndex={-1}>Follow the light.<br/>Keep your own rhythm.</h1><div className="tap-ready-art"><TappingSilhouette point={TAPPING_POINTS[0]} quiet/></div></div>
        <div className="tap-ready-copy"><p>Set your phone down. Use two fingertips to tap lightly on your body. Either side is fine.</p><p className="tap-small">The figure mirrors you. The light moves automatically. Skip any tender spot; stop if this feels worse.</p>
        {grounding ? <p className="tap-small">A grounding adaptation using EFT points, without focusing on a concern.</p> : <p className="tap-small">We’ll begin with a kind phrase, then a short reminder of the feeling.</p>}
        <div className="tap-settings"><button aria-pressed={slow} onClick={() => setSlow(!slow)}>Pace: {slow ? 'Spacious' : 'Gentle'}</button><button aria-pressed={quiet} onClick={() => setQuiet(!quiet)}>Still light: {quiet ? 'On' : 'Off'}</button><button aria-pressed={sound} onClick={toggleSound}>Soft beat: {sound ? 'On' : 'Off'}</button></div>
        {soundError && <p role="status" className="tap-small">{soundError}</p>}
        <button className="tap-primary" onClick={begin}>Begin my round <span aria-hidden="true">→</span></button></div>
      </>}
      {stage === 'round' && <>
        <div className="tap-round-meta"><span>{index === 0 ? 'SETTLE IN' : `POINT ${index} OF 8`}</span><span>{paused ? 'PAUSED' : locating ? 'FIND THE POINT' : 'TAP LIGHTLY'}</span></div>
        <div className="tap-round-title" aria-live="polite" aria-atomic="true"><h1 ref={heading} tabIndex={-1}>{point.name}</h1><p>{point.instruction}</p></div>
        <div className="tap-main-art"><TappingSilhouette point={point} paused={!tapping} quiet={quiet}/><div className="tap-art-caption">MIRROR VIEW <span>·</span> EITHER SIDE</div></div>
        <div className="tap-cue"><div className="tap-cue-label">{paused ? 'TAKE YOUR TIME' : locating ? 'LET YOUR HAND FIND ITS PLACE' : grounding ? 'NOTICE' : index === 0 ? `SAY GENTLY · ${Math.min(3, Math.floor(second / 10) + 1)} OF 3` : 'SAY OR THINK'}</div>
        <p>{paused ? 'Everything can wait.' : grounding ? 'My feet. The room. This moment.' : index === 0 ? `“Even with ${concern.phrase}, I can be kind to myself right now.”` : `“${concern.phrase[0].toUpperCase() + concern.phrase.slice(1)}.”`}</p></div>
        <div className="tap-progress" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={9} aria-valuenow={index}><span style={{ width: `${((index + second / secondsPerPoint) / 9) * 100}%` }}/></div>
        <div className="tap-controls"><button className="tap-secondary" onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button><button className="tap-secondary" onClick={stop}>Stop round</button></div>
        <button className="tap-skip" onClick={skipPoint}>Skip this point</button>
      </>}
      {stage === 'result' && <div className="tap-result">
        <div className="tap-result-orbit" aria-hidden="true"><span>✧</span></div><p className="tap-kicker">{stopped ? 'A PAUSE COUNTS TOO' : 'YOUR CHECK-IN'}</p><h1 ref={heading} tabIndex={-1}>A little space<br/>to notice.</h1>
        <div className="tap-comparison"><div><span>Before</span><strong>{before ?? '—'}</strong></div><span aria-hidden="true">→</span><div><span>Now</span><strong>{after ?? '—'}</strong></div></div>
        <p>{outcomeText(before, after)}</p>
        <p className="tap-small">{before == null || after == null ? 'A dash means you skipped that rating.' : 'Your ratings on the same 0–10 scale.'}</p>
        <button disabled={busy} className="tap-primary" onClick={() => deliver()}>Finish <span aria-hidden="true">→</span></button>
        {!(before != null && after != null && after > before) && <button disabled={busy} className="tap-secondary" onClick={begin}>Try another gentle round</button>}
        {onChangeCourse && <button disabled={busy} className="tap-secondary" onClick={() => deliver(true)}>Try a different approach</button>}
        {error && <p role="alert">{error}</p>}
      </div>}
    </div>
  </section>;
}
