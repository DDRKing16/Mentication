import JourneyOptions from '@/components/journey/JourneyOptions';
import JourneyTakeaway from '@/components/journey/JourneyTakeaway';
import { readTappingDraft, writeTappingDraft, deleteTappingDraft } from './tappingDraft';
import { useEffect, useRef, useState } from 'react';
import TappingSilhouette from './TappingSilhouette';
import { CONCERNS, TAPPING_POINTS, RATING_QUESTION, makeTappingResult, outcomeText } from './tappingProtocol';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { createTappingCues } from './tappingCues';
import { suspendFeedback, resumeFeedback } from '@/lib/feedback';
import './tapping.css';

export default function TappingExperience({ onComplete, onExit, onChangeCourse, initialConcern, silent = false }) {
  const [draft] = useState(() => { try { return { saved: readTappingDraft(), error: '' }; } catch { return { saved: null, error: 'Your saved tapping draft could not be read. It has not been changed.' }; } });
  const restored = draft.saved;
  const [draftStatus, setDraftStatus] = useState(draft.error);
  const [stage, setStage] = useState(restored?.stage || 'choose');
  const [concern, setConcern] = useState(CONCERNS.find(c => c.id === (restored?.concern || initialConcern)) || CONCERNS[0]);
  const [before, setBefore] = useState(restored?.before ?? null);
  const [after, setAfter] = useState(restored?.after ?? null);
  const [index, setIndex] = useState(restored?.index || 0);
  const [second, setSecond] = useState(restored?.second || 0);
  const [paused, setPaused] = useState(restored?.stage === 'round');
  const [slow, setSlow] = useState(restored?.slow === true);
  const { prefs } = useAccessibilityPrefs();
  const [stillLight, setStillLight] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const quiet = stillLight || systemReduced || prefs.reducedMotion;
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState('');
  const [haptic, setHaptic] = useState(false);
  const [hapticError, setHapticError] = useState('');
  const [rounds, setRounds] = useState(restored?.rounds || 0);
  const [stopped, setStopped] = useState(restored?.stopped === true);
  const [skipped, setSkipped] = useState(restored?.skipped || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cues = useRef(null);
  const cueTick = useRef('');
  const roundSerial = useRef(0);
  const currentTick = useRef('');
  const blockedVisualTick = useRef('');
  const duration = useRef(restored?.duration || 0);
  const finished = useRef(false);
  const roundSkipped = useRef(restored?.roundSkipped === true);
  const heading = useRef(null);
  const point = TAPPING_POINTS[index];
  const grounding = concern.id === 'grounding';
  const contactGate = point.id === 'sideEye';
  const secondsPerPoint = index === 0 ? (grounding ? 12 : 30) : slow ? 16 : 12;
  const locating = second < (index === 0 ? 3 : slow ? 6 : 4);
  const tapping = stage === 'round' && !paused && !locating;
  currentTick.current = `${roundSerial.current}:${index}:${second}`;
  const visualTapping = tapping && blockedVisualTick.current !== currentTick.current;

  useEffect(() => {
    if (draft.error || finished.current) return;
    try { writeTappingDraft({ stage, concern: concern.id, before, after, index, second, slow, rounds, stopped, skipped, duration: duration.current, roundSkipped: roundSkipped.current }); setDraftStatus('Draft saved on this device. If interrupted, the round returns paused.'); }
    catch { setDraftStatus('Your draft could not be saved. It is available for this visit only.'); }
  }, [stage, concern, before, after, index, second, slow, rounds, stopped, skipped, draft.error]);
  useEffect(() => { heading.current?.focus(); }, [stage]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) { blockedVisualTick.current = currentTick.current; cues.current?.cancel(); setPaused(true); } };
    const deleted = event => { if (event.storageArea === localStorage && event.newValue === null && (event.key === null || event.key === 'mentation.eftTapping.draft.v1')) { finished.current = true; cues.current?.cancel(); setPaused(true); onExit?.(); } };
    window.addEventListener('storage', deleted);
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('storage', deleted); };
  }, [onExit]);
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
    if (stage !== 'round' || paused || document.hidden) { cues.current?.cancel(); return; }
    if (second >= secondsPerPoint) return;
    const tick = `${roundSerial.current}:${index}:${second}`;
    if (cueTick.current === tick) return;
    cueTick.current = tick;
    // Point-change cues happen during placement, rhythm cues after placement.
    if (second === 0) cues.current?.emit('point', { sound: sound && !silent, haptic: haptic && !systemReduced && !prefs.reducedMotion });
    else if (tapping) cues.current?.emit('beat', { sound: sound && !silent, haptic: haptic && !systemReduced && !prefs.reducedMotion });
  }, [stage, paused, index, second, tapping, sound, haptic, systemReduced, prefs.reducedMotion, secondsPerPoint, silent]);
  useEffect(() => {
    if (systemReduced || prefs.reducedMotion) { cues.current?.stopHaptics(); setHaptic(false); }
  }, [systemReduced, prefs.reducedMotion]);
  useEffect(() => {
    if (silent) suspendFeedback();
    return () => { if (silent) resumeFeedback(); };
  }, [silent]);
  useEffect(() => {
    if (silent) { cues.current?.stopSound(); if (sound) setSound(false); }
  }, [silent, sound]);
  useEffect(() => () => { cues.current?.dispose(); cues.current = null; }, []);

  function cueController() {
    if (!cues.current) cues.current = createTappingCues({ onError: kind => {
      if (kind === 'sound') { setSound(false); setSoundError('Sound is unavailable. The light and placement guide are still here.'); }
      else { setHaptic(false); setHapticError('Touch cues are unavailable. The light and placement guide are still here.'); }
    } });
    return cues.current;
  }
  async function toggleSound() {
    if (silent) return;
    if (sound) { cues.current?.stopSound(); setSound(false); return; }
    try { if (await cueController().enableSound()) { setSound(true); setSoundError(''); } }
    catch { setSoundError('Sound is unavailable. Follow the light or your own rhythm.'); }
  }
  async function toggleHaptic() {
    if (haptic) { cues.current?.stopHaptics(); setHaptic(false); return; }
    try { if (await cueController().enableHaptics()) { setHaptic(true); setHapticError(''); } }
    catch { setHapticError('Touch cues are unavailable on this device. Follow the light or your own rhythm.'); }
  }
  function begin() { cues.current?.cancel(); blockedVisualTick.current = ''; roundSerial.current += 1; roundSkipped.current = false; setIndex(0); setSecond(0); setPaused(false); setStopped(false); setAfter(null); setStage('round'); }
  function pausePractice() { blockedVisualTick.current = currentTick.current; cues.current?.cancel(); setPaused(true); }
  function pauseRound() { if (paused) setPaused(false); else pausePractice(); }
  function exit() { cues.current?.cancel(); onExit?.(); }
  function stop() { cues.current?.cancel(); setStopped(true); setPaused(false); setStage('after'); }
  function skipPoint() {
    cues.current?.cancel();
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
      deleteTappingDraft(); finished.current = true;
      await callback(makeTappingResult({ concern: concern.id, before, after, roundsCompleted: rounds, stopped, skippedPoints: skipped, durationSeconds: duration.current }));
    } catch {
      finished.current = false;
      try { writeTappingDraft({ stage, concern: concern.id, before, after, index, second, slow, rounds, stopped, skipped, duration: duration.current, roundSkipped: roundSkipped.current }); }
      catch { setDraftStatus('Your draft could not be saved. It is available for this visit only.'); }
      setError('That didn’t finish. Your check-in is still here. Please try again.'); setBusy(false);
    }
  }
  function rate(value) {
    if (stage === 'before') { setBefore(value); setStage('ready'); }
    else { setAfter(value); setStage('result'); }
  }
  const isRating = stage === 'before' || stage === 'after';
  const draftError = draftStatus.includes('could not') || draftStatus.includes('visit only');
  const phrase = grounding ? 'My feet. The room. This moment.' : index === 0
    ? `“Even with ${concern.phrase}, I can be kind to myself right now.”`
    : `“${concern.phrase[0].toUpperCase() + concern.phrase.slice(1)}.”`;
  const resultTitle = before == null || after == null ? <>A moment<br/>to notice.</> : after < before
    ? <>A little less<br/>intense.</> : after > before ? <>Let’s leave<br/>it here.</> : <>Same feeling.<br/>Your next choice.</>;
  const storageNote = <details className="tap-storage"><summary>{draftError ? 'Your place may not be saved' : 'Your place is kept on this device'}</summary>
    <p>{draftStatus}</p><p>Return here after an interruption. Tapping stays paused until you resume.</p>
    <button data-sfx="none" onClick={() => { try { deleteTappingDraft(); window.location.reload(); } catch { setError('The draft could not be deleted. Your current practice is still here.'); } }}>Delete draft and start fresh</button>
  </details>;
  return <section className={`tapping-experience tap-stage-${stage} ${quiet ? 'tap-reduced' : ''}`} aria-label="Gentle Tapping">
    <div className="tap-wrap">
      <header className="tap-header"><span className="tap-wordmark">mentication</span><div className="tap-header-tools"><JourneyOptions id="eftTapping" label="Another way" onOpen={pausePractice} /><button data-sfx="none" className="tap-exit" aria-label="Exit tapping" onClick={exit}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7L17 17M17 7L7 17"/></svg></button></div></header>
      {draftError && <p className="tap-error-note" role="status">{draftStatus}</p>}
      {stage === 'choose' && <main className="tap-entry">
        <div className="tap-eyebrow">GENTLE TAPPING <span> / </span> CALM + GROUND</div>
        <h1 ref={heading} tabIndex={-1}>Come back<br/>to yourself.</h1>
        <p className="tap-lead">Two fingertips. One gentle round.</p>
        <div className="tap-intro-art" aria-hidden="true"><TappingSilhouette overview quiet/></div>
        <div className="tap-choice-area"><p className="tap-choice-label">WHAT FEELS PRESENT?</p>
          <div className="tap-choices">{CONCERNS.map(c => <button data-sfx="none" key={c.id} onClick={() => { setConcern(c); setStage('before'); }}><span>{c.label}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12H18M13 7L18 12L13 17"/></svg></button>)}</div>
          <p className="tap-small">Stay with something manageable. No memory to revisit.</p>
        </div>
        <footer className="tap-entry-footer"><span>~2 minutes</span><span>EFT-style · gentle touch</span></footer>
        {(restored || draft.error) && storageNote}
      </main>}
      {isRating && <main className="tap-checkin">
        <p className="tap-eyebrow">{stage === 'before' ? 'A STARTING POINT' : stopped ? 'HANDS AT REST' : 'A MOMENT TO NOTICE'}</p>
        <h1 ref={heading} tabIndex={-1}>{RATING_QUESTION}</h1>
        <p className="tap-lead">{stage === 'after' ? 'The same feeling. The same scale.' : grounding ? 'Notice what’s here. Nothing to bring back.' : `Just notice ${concern.phrase}, as it is.`}</p>
        <div className="tap-rating-visual" aria-hidden="true"><span/><span/><span/></div>
        <div className="tap-rating" role="group" aria-label={`${RATING_QUESTION} 0 means none; 10 means as intense as it gets.`}>{Array.from({ length: 11 }, (_, n) => <button data-sfx="none" key={n} onClick={() => rate(n)} aria-label={`${n} out of 10`}>{n}</button>)}</div>
        <div className="tap-scale"><span>0 · None</span><span>10 · As intense as it gets</span></div>
        <p className="tap-small">Pick what feels true. An estimate is enough.</p>
        <button data-sfx="none" className="tap-text-button" onClick={() => rate(null)}>Skip this rating <span aria-hidden="true">→</span></button>
      </main>}
      {stage === 'ready' && <main className="tap-ready">
        <div className="tap-eyebrow">{concern.label.toUpperCase()} <span> / </span> YOUR ROUND</div>
        <h1 ref={heading} tabIndex={-1}>You set the pace.<br/>We’ll guide the way.</h1>
        <div className="tap-reveal-art" aria-hidden="true"><TappingSilhouette overview quiet/><div className="tap-reveal-light"/></div>
        <div className="tap-ready-instruction"><span className="tap-instruction-number">01</span><p>Set your phone down.<br/><strong>Two fingertips. A light touch.</strong></p></div>
        <p className="tap-small tap-ready-note">Either side is fine. The light moves for you. Skip tender spots; stop if this feels worse.</p>
        {grounding && <p className="tap-small">Grounding with EFT points, without focusing on a concern.</p>}
        <div className="tap-settings-summary"><button data-sfx="none" className="tap-text-button" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>Adjust your round <span aria-hidden="true">{settingsOpen ? '−' : '+'}</span></button><span>{slow ? 'Spacious' : 'Gentle'} · {sound ? 'soft beat' : 'quiet'}{haptic ? ' · touch cues' : ''}</span></div>
        {settingsOpen && <div className="tap-settings">
          <button data-sfx="none" aria-pressed={slow} onClick={() => setSlow(!slow)}>Pace: {slow ? 'Spacious' : 'Gentle'}</button>
          <button data-sfx="none" aria-pressed={quiet} disabled={systemReduced || prefs.reducedMotion} onClick={() => setStillLight(!stillLight)}>Still light: {quiet ? 'On' : 'Off'}</button>
          <button data-sfx="none" aria-pressed={sound} disabled={silent} onClick={toggleSound}>Soft beat: {sound ? 'On' : 'Off'}</button>
          <button data-sfx="none" aria-pressed={haptic} disabled={systemReduced || prefs.reducedMotion} onClick={toggleHaptic}>Touch cues: {haptic ? 'On' : 'Off'}</button>
          <p className="tap-small">A single beat follows the light. Two gentle cues mean a new point. Your own rhythm is welcome.{silent && ' Sound stays off for this reset.'}{(systemReduced || prefs.reducedMotion) && ' Touch cues stay off with reduced motion.'}</p>
        </div>}
        {soundError && <p role="status" className="tap-error-note">{soundError}</p>}
        {hapticError && <p role="status" className="tap-error-note">{hapticError}</p>}
        <button data-sfx="none" className="tap-primary" onClick={begin}>Begin my round <span aria-hidden="true">→</span></button>
      </main>}
      {stage === 'round' && <main className={`tap-round ${contactGate ? 'tap-contact-round' : ''} ${paused ? 'is-paused' : ''}`}>
        <div className="tap-round-meta"><span>{index === 0 ? 'THE SETUP' : `POINT ${String(index).padStart(2, '0')} / 08`}</span><span>{contactGate ? 'EITHER SIDE' : paused ? 'PAUSED' : locating ? 'FIND YOUR PLACE' : 'A GENTLE RHYTHM'}</span></div>
        <div className="tap-round-title" aria-live="polite" aria-atomic="true"><h1 ref={heading} tabIndex={-1}>{point.name}</h1>{!contactGate && <p>{point.instruction}</p>}</div>
        <div className={`tap-main-art tap-frame-${point.id}`} key={point.id}><TappingSilhouette point={point} paused={!visualTapping} quiet={quiet} beat={second}/>{!contactGate && <div className="tap-art-caption">MIRROR VIEW <span>·</span> EITHER SIDE</div>}
          {contactGate ? <div className="tap-contact-action" aria-live="polite" aria-atomic="true"><h2>{paused ? 'Rest here.' : locating ? 'Place two fingertips here' : 'Tap gently'}</h2><div className="tap-contact-rhythm" aria-hidden="true"><span key={second} className={visualTapping ? 'tap-beating' : ''}/><span/><span/></div>{locating && !paused && <p>On the bone beside your eye.</p>}</div> : <div className="tap-rhythm" aria-hidden="true"><span key={second} className={visualTapping ? 'tap-beating' : ''}/><span>{paused ? 'Rest' : locating ? 'Place your fingertips' : 'Light touch · your rhythm'}</span></div>}
        </div>
        <div className="tap-cue">{contactGate ? (!locating && !paused && <><div className="tap-cue-label">YOUR REMINDER</div><p>{phrase}</p></>) : <><div className="tap-cue-label">{paused ? 'TAKE ALL THE TIME YOU NEED' : locating ? 'LET YOUR HAND SETTLE HERE' : grounding ? 'GENTLY NOTICE' : index === 0 ? `SAY GENTLY · ${Math.min(3, Math.floor(second / 10) + 1)} OF 3` : 'SAY OR THINK'}</div><p>{paused ? 'Pick up here when you’re ready.' : phrase}</p></>}</div>
        <div className="tap-round-bottom"><div className="tap-progress" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={9} aria-valuenow={index}>{TAPPING_POINTS.map((p, i) => <span key={p.id} className={i < index ? 'done' : i === index ? 'current' : ''}/>)}</div>
          <div className="tap-controls"><button data-sfx="none" className={paused ? "tap-primary" : "tap-pause"} onClick={pauseRound}><span>{paused ? 'Resume my round' : 'Pause'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused ? 'M9 6L18 12L9 18Z' : 'M9 6V18M15 6V18'}/></svg></button><button data-sfx="none" className="tap-stop" onClick={stop}>Stop round</button></div>
          <button data-sfx="none" className="tap-text-button tap-skip" onClick={skipPoint}>Skip this point</button>
        </div>
      </main>}
      {stage === 'result' && <main className="tap-result">
        <p className="tap-eyebrow">{stopped ? 'YOU LEFT THE ROUND HERE' : rounds > 0 ? 'YOUR ROUND IS COMPLETE' : 'HANDS AT REST'}</p>
        <h1 ref={heading} tabIndex={-1}>{resultTitle}</h1>
        <div className="tap-comparison"><div><span>Before</span><strong>{before ?? '—'}</strong></div><svg viewBox="0 0 80 20" aria-hidden="true"><path d="M4 10H72M66 4L72 10L66 16"/></svg><div><span>Now</span><strong>{after ?? '—'}</strong></div></div>
        <p>{outcomeText(before, after)}</p><p className="tap-small">{before == null || after == null ? 'A dash means you skipped that rating.' : 'Your check-in on the same 0–10 scale.'}</p>
        <div className="tap-result-actions"><button data-sfx="none" disabled={busy} className="tap-primary" onClick={() => deliver()}>{busy ? 'Finishing…' : 'Finish'} <span aria-hidden="true">→</span></button>
          {!(before != null && after != null && after > before) && <button data-sfx="none" disabled={busy} className="tap-text-button" onClick={begin}>Try another gentle round <span aria-hidden="true">↻</span></button>}
          {onChangeCourse && <button data-sfx="none" disabled={busy} className="tap-text-button" onClick={() => deliver(true)}>Try a different approach</button>}
        </div>
        <JourneyTakeaway id="eftTapping" />
        {storageNote}
      </main>}
      {stage === 'round' && (soundError || hapticError) && <p role="status" className="tap-error-note">{soundError || hapticError}</p>}
      {error && <p className="tap-error-note" role="alert">{error}</p>}
    </div>
  </section>;
}
