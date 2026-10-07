import JourneyOptions from '@/components/journey/JourneyOptions';
import JourneyTakeaway from '@/components/journey/JourneyTakeaway';
import { readTappingDraft, writeTappingDraft, deleteTappingDraft } from './tappingDraft';
import { useEffect, useRef, useState } from 'react';
import TappingSilhouette from './TappingSilhouette';
import { TAPPING_ARTWORK } from './tappingArtwork';
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
  const [artworkStatus, setArtworkStatus] = useState({ id: '', status: 'loading' });
  const [paused, setPaused] = useState(restored?.stage === 'round');
  const [slow, setSlow] = useState(restored?.slow === true);
  const { prefs } = useAccessibilityPrefs();
  const [stillLight, setStillLight] = useState(restored?.stillLight === true);
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
  const placement = TAPPING_ARTWORK[point.id].placement;
  const artworkReady = artworkStatus.id === point.id && artworkStatus.status !== 'loading';
  const artworkError = artworkStatus.id === point.id && artworkStatus.status === 'error';
  const secondsPerPoint = index === 0 ? (grounding ? 12 : 30) : slow ? 16 : 12;
  const locating = second < (index === 0 ? 3 : slow ? 6 : 4);
  const tapping = stage === 'round' && !paused && artworkReady && !locating;
  currentTick.current = `${roundSerial.current}:${index}:${second}`;
  const visualTapping = tapping && blockedVisualTick.current !== currentTick.current;

  useEffect(() => {
    if (draft.error || finished.current) return;
    try { writeTappingDraft({ stage, concern: concern.id, before, after, index, second, slow, stillLight, rounds, stopped, skipped, duration: duration.current, roundSkipped: roundSkipped.current }); setDraftStatus('Draft saved on this device. If interrupted, the round returns paused.'); }
    catch { setDraftStatus('Your draft could not be saved. It is available for this visit only.'); }
  }, [stage, concern, before, after, index, second, slow, stillLight, rounds, stopped, skipped, draft.error]);
  useEffect(() => { heading.current?.focus(); }, [stage]);
  useEffect(() => {
    if (stage !== 'round' || index === TAPPING_POINTS.length - 1) return;
    // One point ahead: keep the next contact ready without downloading a whole tour.
    const nextPhoto = new Image();
    nextPhoto.src = `/media/tapping/${TAPPING_ARTWORK[TAPPING_POINTS[index + 1].id].file}`;
  }, [stage, index]);
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
    if (stage !== 'round' || paused || !artworkReady) return;
    const timer = window.setInterval(() => {
      duration.current += 1;
      setSecond(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, paused, artworkReady]);
  useEffect(() => {
    if (stage !== 'round' || second < secondsPerPoint) return;
    setSecond(0);
    if (index === TAPPING_POINTS.length - 1) { if (!roundSkipped.current) setRounds(r => r + 1); setStage('after'); }
    else setIndex(i => i + 1);
  }, [stage, second, secondsPerPoint, index]);
  useEffect(() => {
    if (stage !== 'round' || paused || !artworkReady || document.hidden) { cues.current?.cancel(); return; }
    if (second >= secondsPerPoint) return;
    const tick = `${roundSerial.current}:${index}:${second}`;
    if (cueTick.current === tick) return;
    cueTick.current = tick;
    // Point-change cues happen during placement, rhythm cues after placement.
    if (second === 0) cues.current?.emit('point', { sound: sound && !silent, haptic: haptic && !systemReduced && !prefs.reducedMotion });
    else if (tapping) cues.current?.emit('beat', { sound: sound && !silent, haptic: haptic && !systemReduced && !prefs.reducedMotion });
  }, [stage, paused, index, second, tapping, sound, haptic, systemReduced, prefs.reducedMotion, secondsPerPoint, silent, artworkReady]);
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
  function begin() { cues.current?.cancel(); blockedVisualTick.current = ''; roundSerial.current += 1; roundSkipped.current = false; setIndex(0); setSecond(0); setPaused(false); setStopped(false); setAfter(null); setSettingsOpen(false); setStage('round'); }
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
      try { writeTappingDraft({ stage, concern: concern.id, before, after, index, second, slow, stillLight, rounds, stopped, skipped, duration: duration.current, roundSkipped: roundSkipped.current }); }
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
    ? <>A little less<br/>intense.</> : after > before ? <>Let’s leave<br/><em>it here.</em></> : <>Same feeling.<br/><em>Your choice.</em></>;
  const storageNote = <details className="tap-storage"><summary>{draftError ? 'Your place may not be saved' : 'Your place is kept on this device'}</summary>
    <p>{draftStatus}</p><p>Return here after an interruption. Tapping stays paused until you resume.</p>
    <button data-sfx="none" onClick={() => { try { deleteTappingDraft(); window.location.reload(); } catch { setError('The draft could not be deleted. Your current practice is still here.'); } }}>Delete draft and start fresh</button>
  </details>;
  function openSettings() {
    if (stage === 'round') pausePractice();
    setSettingsOpen(value => !value);
  }
  function changePace() {
    const nextSlow = !slow;
    if (stage === 'round' && index > 0) {
      const nextSecond = Math.min(second, (nextSlow ? 16 : 12) - 1);
      cueTick.current = `${roundSerial.current}:${index}:${nextSecond}`;
      blockedVisualTick.current = cueTick.current;
      setSecond(nextSecond);
    }
    setSlow(nextSlow);
  }
  function back() {
    cues.current?.cancel();
    setSettingsOpen(false);
    if (stage === 'before') setStage('choose');
    else if (stage === 'ready') setStage('before');
    else exit();
  }
  const nextPoint = TAPPING_POINTS[index + 1];
  const movingSoon = !paused && !locating && second >= secondsPerPoint - 3;
  const roundSettings = <div className="tap-settings">
    <button data-sfx="none" aria-pressed={slow} onClick={changePace}>Pace: {slow ? 'Spacious' : 'Gentle'}</button>
    <button data-sfx="none" aria-pressed={quiet} disabled={systemReduced || prefs.reducedMotion} onClick={() => setStillLight(!stillLight)}>Still light: {quiet ? 'On' : 'Off'}</button>
    <button data-sfx="none" aria-pressed={sound} disabled={silent} onClick={toggleSound}>Soft beat: {sound ? 'On' : 'Off'}</button>
    <button data-sfx="none" aria-pressed={haptic} disabled={systemReduced || prefs.reducedMotion} onClick={toggleHaptic}>Touch cues: {haptic ? 'On' : 'Off'}</button>
    <p className="tap-small">{slow ? 'More time at each place. ' : ''}One beat for your rhythm. Two cues for a new place. Your own rhythm is welcome.{silent && ' Sound stays off for this reset.'}{(systemReduced || prefs.reducedMotion) && ' Touch cues stay off with reduced motion.'}</p>
  </div>;
  return <section className={`tapping-experience tap-stage-${stage} ${quiet ? 'tap-reduced' : ''}`} aria-label="Gentle Tapping">
    <div className="tap-wrap">
      <header className="tap-header">
        {['before', 'ready'].includes(stage) ? <button data-sfx="none" className="tap-back" aria-label="Back" onClick={back}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18"/></svg></button> : <span className="tap-header-goal">CALM + GROUND</span>}
        <img className="tap-wordmark" src="/media/brand/logo/jade-champagne/wordmark.png" alt="MentiCation"/>
        <button data-sfx="none" className="tap-exit" aria-label="Exit tapping" onClick={exit}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7L17 17M17 7L7 17"/></svg></button>
      </header>
      {draftError && <p className="tap-error-note" role="status">{draftStatus}</p>}
      {stage === 'choose' && <main className="tap-entry">
        <p className="tap-eyebrow">GENTLE TAPPING · EFT-STYLE</p>
        <h1 ref={heading} tabIndex={-1}>Let’s make<br/><em>a little room.</em></h1>
        <p className="tap-lead">Two fingertips. A gentle way to meet this moment.</p>
        <div className="tap-entry-contact"><div className="tap-portrait"><TappingSilhouette point={TAPPING_POINTS[0]} paused quiet/></div><span className="tap-art-note">A LIGHT TOUCH · EITHER HAND</span></div>
        <button data-sfx="none" className="tap-primary" onClick={() => { setConcern(CONCERNS[3]); setStage('before'); }}>Just help me ground <span aria-hidden="true">→</span></button>
        <div className="tap-choice-area"><p className="tap-choice-label">OR STAY WITH SOMETHING PRESENT</p><div className="tap-choices">{CONCERNS.slice(0,3).map(c => <button data-sfx="none" key={c.id} onClick={() => { setConcern(c); setStage('before'); }}>{c.label}</button>)}</div></div>
        <p className="tap-small tap-entry-note">Something manageable. No memory to revisit.</p>
        <footer className="tap-entry-footer"><span>One guided round</span><span>About 2 minutes</span></footer>
        <details className="tap-about"><summary>About this practice</summary><p>For a concern, EFT-style tapping pairs the standard points with a gentle setup and a short reminder. Grounding uses the same points with your attention on the present.</p></details>
        {(restored || draft.error) && storageNote}
      </main>}
      {isRating && <main className="tap-checkin">
        <p className="tap-eyebrow">{stage === 'before' ? 'BEFORE YOUR ROUND' : 'HANDS AT REST'}</p>
        {stage === 'after' && !stopped && rounds > 0 && !roundSkipped.current && <div className="tap-rest-thread" role="img" aria-label="One full guided round">{TAPPING_POINTS.map(p => <span key={p.id}/>)}</div>}
        <div className="tap-checkin-context"><span>{concern.label}</span><span>{stage === 'before' ? 'A starting point' : 'The same scale'}</span></div>
        <h1 ref={heading} tabIndex={-1}>{RATING_QUESTION}</h1>
        <p className="tap-lead">{stage === 'after' ? 'Let your hands rest. Notice the same feeling.' : grounding ? 'Notice what’s here, without bringing anything back.' : `Just notice ${concern.phrase}, as it is.`}</p>
        <div className="tap-rating" role="group" aria-label={`${RATING_QUESTION} 0 means none; 10 means as intense as it gets.`}>{Array.from({ length: 11 }, (_, n) => <button data-sfx="none" key={n} style={{ '--rating-size': `${5 + n * 2}px` }} onClick={() => rate(n)} aria-pressed={stage === 'before' && before === n} aria-label={`${n} out of 10`}><span>{n}</span><i aria-hidden="true"/></button>)}</div>
        <div className="tap-scale"><span>0 · None</span><span>10 · As intense as it gets</span></div>
        <p className="tap-small">An estimate is enough. You can also leave this blank.</p>
        <button data-sfx="none" className="tap-text-button" onClick={() => rate(null)}>Skip this rating <span aria-hidden="true">→</span></button>
      </main>}
      {stage === 'ready' && <main className="tap-ready">
        <p className="tap-eyebrow">YOUR HANDS TAKE IT FROM HERE</p>
        <h1 ref={heading} tabIndex={-1}>Start here.<br/><em>We’ll move together.</em></h1>
        <div className="tap-ready-contact"><div className="tap-portrait"><TappingSilhouette point={TAPPING_POINTS[0]} paused quiet/></div><div className="tap-first-point"><span>01 / 09</span><strong>Side of hand</strong></div></div>
        <p className="tap-ready-placement">{TAPPING_ARTWORK.hand.placement}</p>
        <p className="tap-ready-instruction">Set your phone where you can see it.<br/>Use two fingertips with a light touch.</p>
        <p className="tap-small tap-ready-note">Skip tender spots; stop if this feels worse.</p>
        <div className="tap-settings-summary"><button data-sfx="none" className="tap-text-button" aria-expanded={settingsOpen} onClick={openSettings}>Adjust your round <span aria-hidden="true">{settingsOpen ? '−' : '+'}</span></button><span>{slow ? 'Spacious' : 'Gentle'} · {sound ? 'soft beat' : 'quiet'}{haptic ? ' · touch' : ''}</span></div>
        {settingsOpen && roundSettings}
        {soundError && <p role="status" className="tap-error-note">{soundError}</p>}
        {hapticError && <p role="status" className="tap-error-note">{hapticError}</p>}
        <button data-sfx="none" className="tap-primary" onClick={begin}>Begin my round <span aria-hidden="true">→</span></button>
        <p className="tap-ready-footnote">{grounding ? 'Grounding with the standard EFT points.' : 'A gentle setup, then one short reminder at each place.'}</p>
      </main>}
      {stage === 'round' && <main className={`tap-round ${paused ? 'is-paused' : ''} ${artworkError ? 'has-art-error' : ''}`}>
        <div className="tap-round-meta"><span>{index === 0 ? 'THE SETUP' : 'FOLLOW THE GUIDE'}</span><span>PLACE {String(index + 1).padStart(2,'0')} / 09</span></div>
        <div className="tap-round-title" aria-live="polite" aria-atomic="true"><h1 ref={heading} tabIndex={-1}>{point.name}</h1><p>{placement}</p></div>
        <div className={`tap-main-art tap-frame-${point.id}`} key={point.id}>
          <div className="tap-portrait"><TappingSilhouette point={point} paused={!visualTapping} quiet={quiet} beat={second} onArtworkStatus={(id, status) => { setArtworkStatus({ id, status }); if (status === 'error') pausePractice(); }}/></div>
          <span className="tap-art-note">EITHER SIDE · A LIGHT TOUCH</span>
          {artworkError && <p className="tap-image-error" role="status">The image couldn’t load. The placement is above. Resume with the text, or skip this point.</p>}
        </div>
        <div className="tap-guidance">
          <div className="tap-contact-action" aria-live="polite" aria-atomic="true"><span key={second} className={`tap-rhythm-light ${visualTapping ? 'tap-beating' : ''}`} aria-hidden="true"/><h2>{paused ? 'Take your time.' : !artworkReady ? 'Getting the guide…' : locating ? 'Place two fingertips' : 'Tap gently'}</h2><span className="tap-phase-note">{paused ? 'The guide is paused' : locating ? 'Let your hand settle' : 'Follow the light, or your rhythm'}</span></div>
          <div className="tap-cue">{!locating && !paused ? <><div className="tap-cue-label">{grounding ? 'GENTLY NOTICE' : index === 0 ? `SAY OR THINK · ${Math.min(3, Math.floor(second / 10) + 1)} OF 3` : 'SAY OR THINK'}</div><p>{phrase}</p></> : <p className="tap-settle-note">{paused ? 'Stay here as long as you need.' : 'The guide moves for you. No screen taps needed.'}</p>}</div>
        </div>
        <div className="tap-round-bottom">
          <div className={`tap-next ${movingSoon ? 'is-next' : ''}`} aria-live="off"><span>{nextPoint ? movingSoon ? 'COMING NEXT' : 'UP NEXT' : 'THEN'}</span><strong>{nextPoint?.name || 'Rest & notice'}</strong><span aria-hidden="true">→</span></div>
          <div className="tap-progress" role="progressbar" aria-label="Guided point progress" aria-valuemin={0} aria-valuemax={9} aria-valuenow={index} aria-valuetext={`Place ${index+1} of 9: ${point.name}${roundSkipped.current ? '. Some points skipped.' : ''}`}>{TAPPING_POINTS.map((p, i) => <span key={p.id} className={i < index ? 'done' : i === index ? 'current' : ''}><i style={{width: i < index ? '100%' : i === index ? `${Math.min(100, second / secondsPerPoint * 100)}%` : '0%'}}/></span>)}</div>
          <div className="tap-controls"><button data-sfx="none" className={paused ? 'tap-primary' : 'tap-pause'} onClick={pauseRound}><span>{paused ? 'Resume my round' : 'Pause'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused ? 'M9 6L18 12L9 18Z' : 'M9 6V18M15 6V18'}/></svg></button><button data-sfx="none" className="tap-stop" onClick={stop}>Stop round</button></div>
          <div className="tap-practice-tools"><button data-sfx="none" className="tap-text-button tap-skip" onClick={skipPoint}>Skip this point</button><button data-sfx="none" className="tap-text-button" aria-expanded={settingsOpen} onClick={openSettings}>Pace & cues <span aria-hidden="true">{settingsOpen ? '−' : '+'}</span></button></div>
          {settingsOpen && <div className="tap-paused-settings">{roundSettings}<p className="tap-small">Resume when you’re ready. Your place is kept.</p></div>}
        </div>
      </main>}
      {stage === 'result' && <main className="tap-result">
        <p className="tap-eyebrow">{stopped ? 'YOU CHOSE WHERE TO STOP' : rounds > 0 ? 'A GUIDED ROUND, AT YOUR PACE' : 'HANDS AT REST'}</p>
        <p className="tap-small tap-result-route">{concern.label} <span>·</span> {slow ? 'Spacious' : 'Gentle'} pace</p>
        <h1 ref={heading} tabIndex={-1}>{resultTitle}</h1>
        <div className="tap-comparison"><div><span>Before</span><strong>{before ?? '—'}</strong><small>{before == null ? 'Not rated' : 'out of 10'}</small></div><svg viewBox="0 0 80 20" aria-hidden="true"><path d="M4 10H72M66 4L72 10L66 16"/></svg><div><span>Now</span><strong>{after ?? '—'}</strong><small>{after == null ? 'Not rated' : 'out of 10'}</small></div></div>
        <p>{outcomeText(before, after)}</p>
        <p className="tap-small">{before == null || after == null ? 'A blank rating stays blank. There’s no comparison to make.' : 'Your own check-in, on the same 0–10 scale.'}</p>
        <div className="tap-result-actions"><button data-sfx="none" disabled={busy} className="tap-primary" onClick={() => deliver()}>{busy ? 'Finishing…' : 'Finish'} <span aria-hidden="true">→</span></button>
          {!(before != null && after != null && after > before) && <button data-sfx="none" disabled={busy} className="tap-text-button" onClick={begin}>Try another gentle round <span aria-hidden="true">↻</span></button>}
          {onChangeCourse && <button data-sfx="none" disabled={busy} className="tap-text-button" onClick={() => deliver(true)}>Try a different approach <span aria-hidden="true">→</span></button>}
        </div>
        <JourneyTakeaway id="eftTapping" initialText={`Chosen focus: ${concern.label}.\nPace: ${slow ? 'Spacious' : 'Gentle'}.\nA light touch; either side is fine.`}/>
        {storageNote}
      </main>}
      {stage === 'round' && (soundError || hapticError) && <p role="status" className="tap-error-note">{soundError || hapticError}</p>}
      {error && <p className="tap-error-note" role="alert">{error}</p>}
      <footer className="tap-secondary"><JourneyOptions id="eftTapping" onOpen={pausePractice} /></footer>
    </div>
  </section>;
}
