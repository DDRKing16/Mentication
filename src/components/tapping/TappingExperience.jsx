import PracticeCheckpoint from '@/components/journey/PracticeCheckpoint';
import { recordTappingProgress } from './tappingCheckpoints';
import JourneyOptions from '@/components/journey/JourneyOptions';
import TappingTakeaway from './TappingTakeaway';
import { readTappingDraft, writeTappingDraft, deleteTappingDraft } from './tappingDraft';
import { useEffect, useMemo, useRef, useState } from 'react';
import TappingSilhouette from './TappingSilhouette';
import { TAPPING_ARTWORK } from './tappingArtwork';
import { CONCERNS, TAPPING_POINTS, RATING_QUESTION, makeTappingResult, outcomeText } from './tappingProtocol';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { createTappingCues } from './tappingCues';
import { createTappingAudio } from './tappingAudio';
import { tappingPlan, narrationForTick } from './tappingTiming';
import { TAPPING_BEAT_MS, TAPPING_CONTACT_MS } from './tappingGuidance';
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
  const [settingPage, setSettingPage] = useState('menu');
  const [takeawayText, setTakeawayText] = useState(restored?.takeawayText ?? null);
  const [takeawayId, setTakeawayId] = useState(restored?.takeawayId || null);
  const [savedCueText, setSavedCueText] = useState(null);
  const quiet = stillLight || systemReduced || prefs.reducedMotion;
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState('');
  const [voiceOn,setVoiceOn]=useState(restored?.voiceOn!==false);
  const [musicOn,setMusicOn]=useState(restored?.musicOn ?? prefs.ambientSoundscape);
  const [beatOn,setBeatOn]=useState(restored?.beatOn!==false);
  const channelsOff = !voiceOn && !musicOn && !beatOn;
  const [muted,setMuted]=useState(restored?.muted===true || silent);
  const [audioStarting,setAudioStarting]=useState(false);
  const mixer=useRef(null);
  const audioRequest=useRef(0);
  const flowRequest=useRef(0);
  const [haptic, setHaptic] = useState(false);
  const [hapticError, setHapticError] = useState('');
  const [practiceEvents, setPracticeEvents] = useState(restored?.practiceEvents || []);
  const recordProgress = action => setPracticeEvents(events => recordTappingProgress(events, action));
  const [rounds, setRounds] = useState(restored?.rounds || 0);
  const [stopped, setStopped] = useState(restored?.stopped === true);
  const [skipped, setSkipped] = useState(restored?.skipped || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cues = useRef(null);
  const cueTick = useRef('');
  const roundSerial = useRef(restored?.checkpointRound || 0);
  const currentTick = useRef('');
  const blockedVisualTick = useRef('');
  const duration = useRef(restored?.duration || 0);
  const finished = useRef(false);
  const roundSkipped = useRef(restored?.roundSkipped === true);
  const heading = useRef(null);
  const settingHeading = useRef(null);
  const point = TAPPING_POINTS[index];
  const grounding = concern.id === 'grounding';
  const placement = TAPPING_ARTWORK[point.id].placement;
  const artworkReady = artworkStatus.id === point.id && artworkStatus.status !== 'loading';
  const artworkError = artworkStatus.id === point.id && artworkStatus.status === 'error';
  const plan=useMemo(()=>tappingPlan(point.id,concern.id,slow),[point.id,concern.id,slow]);
  const secondsPerPoint = plan.total;
  const locating = second < plan.placement;
  const tapping = stage === 'round' && !paused && artworkReady && !locating;
  currentTick.current = `${roundSerial.current}:${index}:${second}`;
  const visualTapping = tapping && blockedVisualTick.current !== currentTick.current;

  useEffect(() => {
    if (draft.error || finished.current) return;
    try { writeTappingDraft({ stage, concern: concern.id, before, after, index, second, slow, stillLight, rounds, stopped, skipped, duration: duration.current, roundSkipped: roundSkipped.current, takeawayText, takeawayId,voiceOn,musicOn,beatOn,muted,practiceEvents,checkpointRound:roundSerial.current }); setDraftStatus('Draft saved on this device. If interrupted, the round returns paused.'); }
    catch { setDraftStatus('Your draft could not be saved. It is available for this visit only.'); }
  }, [stage, concern, before, after, index, second, slow, stillLight, rounds, stopped, skipped, takeawayText, takeawayId,voiceOn,musicOn,beatOn,muted,draft.error,practiceEvents]);
  useEffect(() => { (settingsOpen ? settingHeading : heading).current?.focus(); }, [stage, settingsOpen, settingPage]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) pausePractice(); };
    const deleted = event => { if (event.storageArea === localStorage && event.newValue === null && (event.key === null || event.key === 'mentation.eftTapping.draft.v1')) { finished.current = true; pausePractice(); onExit?.(); } };
    window.addEventListener('storage', deleted);
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('storage', deleted); };
  }, [onExit]);
  useEffect(() => {
    if (stage !== 'round' || paused || !artworkReady) return;
    const timer = window.setInterval(() => {
      duration.current += 1;
      setSecond(s => s + 1);
    }, TAPPING_BEAT_MS);
    return () => clearInterval(timer);
  }, [stage, paused, artworkReady]);
  useEffect(() => {
    if (stage !== 'round' || second < secondsPerPoint) return;
    setPracticeEvents(events => recordTappingProgress(events, { type: 'point', point: TAPPING_POINTS[index].id, round: roundSerial.current }));
    setSecond(0);
    if (index === TAPPING_POINTS.length - 1) { if (!roundSkipped.current) setRounds(r => r + 1); setStage('after'); }
    else setIndex(i => i + 1);
  }, [stage, second, secondsPerPoint, index]);
  useEffect(() => {
    if (stage !== 'round' || paused || !artworkReady || document.hidden) { cues.current?.cancel(); mixer.current?.pause(); return; }
    if (second >= secondsPerPoint) return;
    const tick = `${roundSerial.current}:${index}:${second}`;
    if (cueTick.current === tick) return;
    cueTick.current = tick;
    if(sound&&!muted&&!silent){mixer.current?.run();const spoken=narrationForTick(point.id,concern.id,second,plan);if(spoken)mixer.current?.speak(spoken);if(tapping)mixer.current?.beat();}
    // The supplied tick starts the hand approach; touch/audio contact is +200 ms.
    if(tapping)cues.current?.emit('beat',{haptic:haptic&&!systemReduced&&!prefs.reducedMotion,contactDelay:TAPPING_CONTACT_MS});
  }, [stage, paused, index, second, tapping, sound,muted,haptic,systemReduced,prefs.reducedMotion,secondsPerPoint,silent,artworkReady,point.id,concern.id,plan]);
  useEffect(() => {
    if (systemReduced || prefs.reducedMotion) { cues.current?.stopHaptics(); setHaptic(false); }
  }, [systemReduced, prefs.reducedMotion]);
  useEffect(()=>{suspendFeedback();return()=>resumeFeedback();},[]);
  useEffect(() => {
    if (silent) { mixer.current?.cancel(); if (sound) setSound(false); }
  }, [silent, sound]);
  useEffect(()=>{if(stage==='ready'&&!silent)void audioController().preload(concern.id);},[stage,concern.id,silent]);
  useEffect(()=>{mixer.current?.configure({voice:voiceOn,music:musicOn,beat:beatOn});},[voiceOn,musicOn,beatOn]);
  useEffect(() => () => {flowRequest.current+=1;audioRequest.current+=1;mixer.current?.dispose();mixer.current=null;cues.current?.dispose();cues.current=null;},[]);

  function audioController(){
    if(!mixer.current)mixer.current=createTappingAudio({onError:kind=>{setSoundError(`${kind==='voice'?'Voice':kind==='music'?'Music':'Tapping sound'} couldn’t load. The illustrated guide and captions are here.`);},onInterrupted:()=>{pausePractice();setSound(false);setSoundError('Audio was interrupted. Resume to restart your guide.');}});
    return mixer.current;
  }
  async function unlockAudio({force=false}={}){
    if(silent||(!force&&muted)||(!voiceOn&&!musicOn&&!beatOn))return false;
    const token=++audioRequest.current;setAudioStarting(true);setSoundError('');
    try{const enabled=await audioController().activate(concern.id,{voice:voiceOn,music:musicOn,beat:beatOn});if(token!==audioRequest.current)return false;setSound(enabled);return enabled;}
    catch{if(token===audioRequest.current){setSound(false);setSoundError('Audio couldn’t start. Follow the fingers, or retry sound in the controls.');}return false;}
    finally{if(token===audioRequest.current)setAudioStarting(false);}
  }

  function cueController() {
    if (!cues.current) cues.current = createTappingCues({ onError: kind => {
      if (kind === 'sound') { setSound(false); setSoundError('Sound is unavailable. The light and placement guide are still here.'); }
      else { setHaptic(false); setHapticError('Touch cues are unavailable. The light and placement guide are still here.'); }
    } });
    return cues.current;
  }
  async function toggleSound() {
    if (silent) return;
    if (!voiceOn && !musicOn && !beatOn) { openSettings(); return; }
    if(!muted&&(stage!=='round'||paused||sound)){audioRequest.current+=1;mixer.current?.cancel();setAudioStarting(false);setMuted(true);setSound(false);return;}
    setMuted(false);
    if(stage==='round'&&!paused){if(await unlockAudio({force:true}))mixer.current?.run();}
  }
  async function toggleHaptic() {
    if (haptic) { cues.current?.stopHaptics(); setHaptic(false); return; }
    try { if (await cueController().enableHaptics()) { setHaptic(true); setHapticError(''); } }
    catch { setHapticError('Touch cues are unavailable on this device. Follow the light or your own rhythm.'); }
  }
  async function begin() {
    if(audioStarting)return;
    const intent=++flowRequest.current;cues.current?.cancel();mixer.current?.cancel();
    await unlockAudio();if(intent!==flowRequest.current)return;
    blockedVisualTick.current='';roundSerial.current+=1;roundSkipped.current=false;setIndex(0);setSecond(0);setPaused(false);setStopped(false);setAfter(null);setSettingsOpen(false);setStage('round');
  }
  function pausePractice() {flowRequest.current+=1;audioRequest.current+=1;setAudioStarting(false);blockedVisualTick.current=currentTick.current;cues.current?.cancel();mixer.current?.pause();setPaused(true);}
  async function pauseRound() {
    if(!paused){pausePractice();return;}
    const intent=++flowRequest.current;await unlockAudio();if(intent!==flowRequest.current)return;
    if(!muted&&!silent)mixer.current?.run();setPaused(false);
  }
  function exit() {pausePractice();mixer.current?.cancel();onExit?.();}
  function stop() {pausePractice();mixer.current?.cancel();setStopped(true);setPaused(false);setStage('after');}
  function skipPoint() {
    cues.current?.cancel();
    mixer.current?.cancel();
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
      try { writeTappingDraft({ stage, concern: concern.id, before, after, index, second, slow, stillLight, rounds, stopped, skipped, duration: duration.current, roundSkipped: roundSkipped.current, takeawayText, takeawayId,voiceOn,musicOn,beatOn,muted,practiceEvents,checkpointRound:roundSerial.current }); }
      catch { setDraftStatus('Your draft could not be saved. It is available for this visit only.'); }
      setError('That didn’t finish. Your check-in is still here. Please try again.'); setBusy(false);
    }
  }
  function rate(value) {
    if (stage === 'before') { recordProgress({type:'rating',id:'before',value}); setBefore(value); setStage('ready'); }
    else { recordProgress({type:'rating',id:`after-${roundSerial.current}`,value}); setAfter(value); setStage('result'); }
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
    if (stage === 'round' || audioStarting) pausePractice();
    setSettingPage('menu');
    setSettingsOpen(true);
  }
  function changePace() {
    const nextSlow = !slow;
    if (stage === 'round' && index > 0) {
      const nextSecond = Math.min(second,tappingPlan(point.id,concern.id,nextSlow).total-1);
      cueTick.current = `${roundSerial.current}:${index}:${nextSecond}`;
      blockedVisualTick.current = cueTick.current;
      setSecond(nextSecond);
    }
    setSlow(nextSlow);
  }
  function closeSettings() { setSettingsOpen(false); setSettingPage('menu'); }
  function back() {
    pausePractice();
    if (settingsOpen) { if (settingPage === 'menu') closeSettings(); else setSettingPage('menu'); }
    else if (stage === 'before') setStage('choose');
    else if (stage === 'ready') setStage('before');
    else if (stage === 'result') setStage('after');
    else if (stage === 'next') setStage('result');
    else if (stage === 'note') setStage('next');
    else exit();
  }
  const nextPoint = TAPPING_POINTS[index + 1];
  const movingSoon = !paused && !locating && second >= secondsPerPoint - 3;
  const settingPrompts = { menu: <>What would you<br/><em>like to adjust?</em></>, pace: <>What pace feels<br/><em>comfortable?</em></>, light: <>How would you<br/><em>like the guide?</em></>,voice:<>Would spoken guidance<br/><em>help you?</em></>,music:<>Would soft music<br/><em>help you?</em></>,sound:<>Would tapping sounds<br/><em>help you?</em></>, touch: <>Would touch cues<br/><em>help you?</em></> };
  const settingChoice = (label, selected, action, disabled = false) => <button data-sfx="none" aria-pressed={selected} disabled={disabled} onClick={action}><span>{label}</span><i aria-hidden="true">{selected ? '✓' : ''}</i></button>;
  return <section className={`tapping-experience tap-stage-${stage} ${quiet ? 'tap-reduced' : ''}`} aria-label="Gentle Tapping">
    <div className="tap-wrap">
      <header className="tap-header">
        {(settingsOpen || ['before', 'ready', 'result', 'next', 'note'].includes(stage)) ? <button data-sfx="none" className="tap-back" aria-label="Back" onClick={back}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18"/></svg></button> : <span className="tap-header-goal">CALM + GROUND</span>}
        <img className="tap-wordmark" src="/media/brand/logo/jade-champagne/wordmark.png" alt="MentiCation"/>
        <button data-sfx="none" className="tap-exit" aria-label="Exit tapping" onClick={exit}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7L17 17M17 7L7 17"/></svg></button>
      </header>
      {draftError && <p className="tap-error-note" role="status">{draftStatus}</p>}
      {stage === 'choose' && <main className="tap-entry">
        <p className="tap-eyebrow">GENTLE TAPPING · EFT-STYLE</p>
        <h1 ref={heading} tabIndex={-1}>What’s here<br/><em>right now?</em></h1>
        <p className="tap-lead">Choose a starting point. We’ll show you the way.</p>
        <div className="tap-focus-choices" role="group" aria-label="What’s here right now?">{[CONCERNS[3], ...CONCERNS.slice(0,3)].map(c => <button data-sfx="none" key={c.id} onClick={() => { setConcern(c); recordProgress({type:'focus',concern:c.id}); setStage('before'); }}><span>{c.label}</span><span aria-hidden="true">→</span></button>)}</div>
        <div className="tap-entry-contact"><div className="tap-portrait"><TappingSilhouette point={TAPPING_POINTS[0]} paused quiet/></div><span className="tap-art-note">TWO FINGERTIPS · A LIGHT TOUCH</span></div>
        <footer className="tap-entry-footer"><span>Nine small places</span><span>About 3 minutes</span></footer>
        <details className="tap-about"><summary>About this practice</summary><p>For a concern, EFT-style tapping pairs the standard points with a gentle setup and a short reminder. Grounding uses the same points with your attention on the present. No memory to revisit.</p><p>The moving fingers are an instructional illustration. Spoken guidance is a bundled, locally generated synthetic voice.</p></details>
        {(restored || draft.error) && storageNote}
      </main>}
      {isRating && <main className="tap-checkin">
        <p className="tap-eyebrow">{stage === 'before' ? 'BEFORE YOUR ROUND' : 'HANDS AT REST'}</p>
        {stage === 'after' && !stopped && rounds > 0 && !roundSkipped.current && <div className="tap-rest-thread" role="img" aria-label="One full guided round">{TAPPING_POINTS.map(p => <span key={p.id}/>)}</div>}
        <div className="tap-checkin-context"><span>{concern.label}</span><span>{stage === 'before' ? 'A starting point' : 'The same scale'}</span></div>
        <h1 ref={heading} tabIndex={-1}>{RATING_QUESTION}</h1>
        <p className="tap-lead">{stage === 'after' ? 'Let your hands rest. Notice the same feeling.' : grounding ? 'Notice what’s here, without bringing anything back.' : `Just notice ${concern.phrase}, as it is.`}</p>
        <div className="tap-rating" role="group" aria-label={`${RATING_QUESTION} 0 means none; 10 means as intense as it gets.`}>{Array.from({ length: 11 }, (_, n) => <button data-sfx="none" key={n} style={{ '--rating-size': `${5 + n * 2}px` }} onClick={() => rate(n)} aria-pressed={(stage === 'before' ? before : after) === n} aria-label={`${n} out of 10`}><span>{n}</span><i aria-hidden="true"/></button>)}</div>
        <div className="tap-scale"><span>0 · None</span><span>10 · As intense as it gets</span></div>
        <p className="tap-small">An estimate is enough. You can also leave this blank.</p>
        <button data-sfx="none" className="tap-text-button" onClick={() => rate(null)}>Skip this rating <span aria-hidden="true">→</span></button>
      </main>}
      {stage === 'ready' && <main className="tap-ready" hidden={settingsOpen}>
        <p className="tap-eyebrow">SEE IT · HEAR IT · TRY IT</p>
        <h1 ref={heading} tabIndex={-1}>Follow my fingers.<br/><em>We’ll move together.</em></h1>
        <div className="tap-ready-contact"><div className="tap-portrait"><TappingSilhouette point={TAPPING_POINTS[0]} paused quiet/></div><div className="tap-first-point"><span>01 / 09</span><strong>Side of hand</strong></div></div>
        <p className="tap-ready-placement">{TAPPING_ARTWORK.hand.placement}</p>
        <p className="tap-ready-instruction">Set your phone where you can see it.<br/>Copy the two fingertips. Keep your touch light.</p>
        <p className="tap-small tap-ready-note">Skip tender spots; stop if this feels worse.</p>
        <div className="tap-audio-ready"><span className="tap-small">{silent?'Quiet reset · fingers & captions':muted?'Quiet round · fingers & captions':[voiceOn?'Voice':null,musicOn?'soft music':null,beatOn?'tapping beat':null].filter(Boolean).join(' · ')||'Quiet round · fingers & captions'}</span><button data-sfx="none" aria-label={muted?'Sound ready for Start':'Mute before starting'} disabled={silent} onClick={toggleSound}>{muted?'Sound off':'Sound ready'} <span aria-hidden="true">{muted?'◌':'♪'}</span></button></div>
        <button data-sfx="none" disabled={audioStarting} className="tap-primary" onClick={()=>void begin()}>{audioStarting?'Preparing your guide…':silent||muted||(!voiceOn&&!musicOn&&!beatOn)?'Start quiet round':'Start guided round'} <span aria-hidden="true">→</span></button>
        {soundError&&<p role="status" className="tap-error-note">{soundError}</p>}
        <button data-sfx="none" className="tap-text-button tap-adjust" onClick={openSettings}>Adjust pace or cues <span aria-hidden="true">→</span></button>
      </main>}
      {stage === 'round' && <main className={`tap-round ${paused ? 'is-paused' : ''} ${artworkError ? 'has-art-error' : ''}`} hidden={settingsOpen}>
        <div className="tap-round-meta"><span>{paused?'YOUR PLACE IS KEPT':locating?'FIND YOUR PLACE':'TAP WITH ME'}</span><span>{String(index+1).padStart(2,'0')} <span aria-hidden="true">/</span> 09</span></div>
        <div className="tap-journey-beads" aria-label={`Place ${index+1} of 9`}>{TAPPING_POINTS.map((item,i)=><span key={item.id} className={i<index?'is-found':i===index?'is-here':''}>{i<index?'✓':i+1}</span>)}</div>
        <div className="tap-round-title" aria-live="polite" aria-atomic="true"><h1 ref={heading} tabIndex={-1}>{point.name}</h1><p>{placement}</p></div>
        <div className={`tap-main-art tap-frame-${point.id}`} key={point.id}>
          <div className="tap-portrait"><TappingSilhouette point={point} paused={!visualTapping} quiet={quiet} beat={second} onArtworkStatus={(id, status) => { setArtworkStatus({ id, status }); if (status === 'error') pausePractice(); }}/></div>
          <span className="tap-art-note">TWO FINGERTIPS · EITHER SIDE</span>
          {artworkError && <p className="tap-image-error" role="status">The image couldn’t load. The placement is above. Resume with the text, or skip this point.</p>}
        </div>
        <div className="tap-guidance">
          <div className="tap-contact-action" aria-live="polite" aria-atomic="true"><span className="tap-phase-mark" aria-hidden="true">{paused?'Ⅱ':locating?'01':'02'}</span><h2>{paused?'Take your time.':locating?'Find this place.':'Tap with me.'}</h2><span className="tap-phase-note">{paused?'Resume whenever you’re ready.':locating?'Watch where the fingertips meet.':quiet?'One gentle tap with each beat.':'Copy the contact and lift.'}</span></div>
          <div className="tap-cue">{!locating&&!paused?<><div className="tap-cue-label">{grounding?'GENTLY NOTICE':index===0?`SAY OR THINK · ${Math.min(3,Math.max(1,Math.floor((second-plan.placement-3)/plan.setupGap)+1))} OF 3`:'SAY OR THINK'}</div><p>{phrase}</p></>:<p className="tap-settle-note">{paused?'Your hands can rest.': 'The guide moves for you. No screen taps needed.'}</p>}</div>
          {!locating&&!paused&&<div className="tap-beat-count" aria-live="off"><span>Tap {Math.min(plan.beats,second-plan.placement+1)} <small>of {plan.beats}</small></span><span>{slow?'Spacious':'Gentle'} · 1 beat / sec</span></div>}
        </div>
        <div className="tap-round-bottom">
          <div className={`tap-next ${movingSoon ? 'is-next' : ''}`} aria-live="off"><span>{nextPoint ? movingSoon ? 'COMING NEXT' : 'UP NEXT' : 'THEN'}</span><strong>{nextPoint?.name || 'Rest & notice'}</strong><span aria-hidden="true">→</span></div>
          <div className="tap-progress" role="progressbar" aria-label="Guided point progress" aria-valuemin={0} aria-valuemax={9} aria-valuenow={index} aria-valuetext={`Place ${index+1} of 9: ${point.name}${roundSkipped.current ? '. Some points skipped.' : ''}`}>{TAPPING_POINTS.map((p, i) => <span key={p.id} className={i < index ? 'done' : i === index ? 'current' : ''}><i style={{width: i < index ? '100%' : i === index ? `${Math.min(100, second / secondsPerPoint * 100)}%` : '0%'}}/></span>)}</div>
          <div className="tap-controls"><button data-sfx="none" disabled={audioStarting} className={paused?'tap-primary':'tap-pause'} onClick={()=>void pauseRound()}><span>{audioStarting?'Preparing guide…':paused?'Resume my round':'Pause'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused?'M9 6L18 12L9 18Z':'M9 6V18M15 6V18'}/></svg></button><button data-sfx="none" className="tap-stop" onClick={stop}>Stop round</button></div>
          <div className="tap-audio-controls"><button data-sfx="none" disabled={silent||audioStarting} onClick={()=>void toggleSound()} aria-label={channelsOff?'Adjust sound':muted?'Turn sound on':!paused&&!sound?'Retry audio':'Mute audio'}>{silent?'Quiet reset':channelsOff?'Sound off':muted?'Sound off':paused?'Sound ready':sound?'Sound on':'Retry audio'} <span aria-hidden="true">{muted||silent||channelsOff?'◌':'♪'}</span></button><button data-sfx="none" onClick={openSettings}>Guide controls <span aria-hidden="true">→</span></button></div>
          <div className="tap-practice-tools"><button data-sfx="none" className="tap-text-button tap-skip" onClick={skipPoint}>Skip this point</button><span className="tap-small">Your own rhythm is welcome.</span></div>
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
        </div>
        {savedCueText != null && <p className="tap-small tap-saved-cue" role="status">{takeawayText != null && savedCueText !== takeawayText.trim() ? 'Your previous cue is saved. These edits are still a draft.' : 'Cue saved on this device.'}</p>}
        <button data-sfx="none" disabled={busy} className="tap-text-button tap-more-steps" onClick={() => setStage('next')}>Other next steps <span aria-hidden="true">→</span></button>
      </main>}
      {stage === 'next' && <main className="tap-next-screen">
        <p className="tap-eyebrow">YOUR NEXT CHOICE · OPTIONAL</p>
        <h1 ref={heading} tabIndex={-1}>What would<br/><em>help now?</em></h1>
        <div className="tap-next-choices" role="group" aria-label="What would help now?">
          <button data-sfx="none" onClick={() => setStage('note')}>Keep a cue for next time <span aria-hidden="true">→</span></button>
          {!(before != null && after != null && after > before) && <button data-sfx="none" onClick={begin}>Try another gentle round <span aria-hidden="true">→</span></button>}
          {onChangeCourse && <button data-sfx="none" disabled={busy} onClick={() => deliver(true)}>Try a different approach <span aria-hidden="true">→</span></button>}
        </div>
        <p className="tap-small">Back returns to your check-in and Finish.</p>
        {storageNote}
      </main>}
      {['result', 'next', 'note'].includes(stage) && <TappingTakeaway active={stage === 'note'} initialText={`Chosen focus: ${concern.label}.\nPace: ${slow ? 'Spacious' : 'Gentle'}.\nA light touch; either side is fine.`} draftText={takeawayText} savedId={takeawayId} onTextChange={setTakeawayText} onSaved={record => { recordProgress({type:'cue',value:record.text}); setTakeawayId(record.id); setTakeawayText(record.text); setSavedCueText(record.text); setStage('result'); }} onSavedStateChange={record => { setSavedCueText(record?.text ?? null); setTakeawayId(record?.id || null); }} onReadError={() => setSavedCueText(null)} onSkip={() => setStage('result')}/>}
      {settingsOpen && <main className="tap-setting-screen">
        <p className="tap-eyebrow">{stage === 'round' ? 'YOUR ROUND IS PAUSED' : 'OPTIONAL · YOUR ROUND'}</p>
        <h1 ref={settingHeading} tabIndex={-1}>{settingPrompts[settingPage]}</h1>
        {settingPage === 'menu' ? <div className="tap-setting-menu" role="group" aria-label="What would you like to adjust?">{[['pace','Pace',slow?'Spacious':'Gentle'],['light','Fingers',quiet?'Still':'Moving'],['voice','Voice',voiceOn&&!silent?'On':'Off'],['music','Music',musicOn&&!silent?'On':'Off'],['sound','Tapping sound',beatOn&&!silent?'On':'Off'],['touch','Touch cues',haptic?'On':'Off']].map(([id,label,value])=><button data-sfx="none" key={id} onClick={()=>setSettingPage(id)}><span>{label}</span><small>{value}</small><span aria-hidden="true">→</span></button>)}</div> : <>
          <div className="tap-setting-choices" role="group" aria-label={{pace:'Comfortable pace',light:'Finger motion preference',voice:'Voice preference',music:'Music preference',sound:'Tapping sound preference',touch:'Touch cue preference'}[settingPage]}>
            {settingPage === 'pace' && <>{settingChoice('Gentle',!slow,() => { if (slow) changePace(); })}{settingChoice('Spacious',slow,() => { if (!slow) changePace(); })}</>}
            {settingPage === 'light' && <>{settingChoice('Moving fingertips',!quiet,()=>setStillLight(false),systemReduced||prefs.reducedMotion)}{settingChoice('A still guide',quiet,()=>setStillLight(true))}</>}
            {settingPage === 'voice' && <>{settingChoice('Voice guidance',voiceOn&&!silent,()=>{setVoiceOn(true);setMuted(false);},silent)}{settingChoice('Captions only',!voiceOn||silent,()=>setVoiceOn(false))}</>}
            {settingPage === 'music' && <>{settingChoice('Soft music',musicOn&&!silent,()=>{setMusicOn(true);setMuted(false);},silent)}{settingChoice('No music',!musicOn||silent,()=>setMusicOn(false))}</>}
            {settingPage === 'sound' && <>{settingChoice('Hear each tap',beatOn&&!silent,()=>{setBeatOn(true);setMuted(false);},silent)}{settingChoice('No tapping sound',!beatOn||silent,()=>setBeatOn(false))}</>}
            {settingPage === 'touch' && <>{settingChoice('No touch cues',!haptic,() => { if (haptic) void toggleHaptic(); })}{settingChoice('Use touch cues',haptic,() => { if (!haptic) void toggleHaptic(); },systemReduced || prefs.reducedMotion)}</>}
          </div>
          <p className="tap-small tap-setting-hint">{settingPage==='pace'?'Spacious gives you more time to find each place and four extra gentle taps.':settingPage==='light'?(systemReduced||prefs.reducedMotion?'Reduced motion keeps the fingers still. The tap count and sound still guide the beat.':'The body stays still. Only the fingertips contact and lift.'):['voice','music','sound'].includes(settingPage)?(silent?'This reset stays quiet. Fingers and captions guide you.':settingPage==='voice'?'Bundled synthetic narration shows you where to tap. Captions stay available.':settingPage==='music'?'A warm, original music bed gets quieter while the voice speaks.':'One soft contact sound for every fingertip contact. No tapping sound while you find a place.'):(systemReduced||prefs.reducedMotion?'Touch cues stay off with reduced motion.':'Touch cues meet the same beat as the fingertips and sound.')}</p>
          {((settingPage === 'sound' && soundError) || (settingPage === 'touch' && hapticError)) && <p className="tap-error-note" role="status">{settingPage === 'sound' ? soundError : hapticError}</p>}
          <button data-sfx="none" className="tap-primary" onClick={closeSettings}>Back to my round <span aria-hidden="true">→</span></button>
        </>}
        {stage === 'round' && <p className="tap-small tap-setting-footnote">Your place is kept. Resume when you’re ready.</p>}
      </main>}
      {stage === 'round' && !settingsOpen && (soundError || hapticError) && <p role="status" className="tap-error-note">{soundError || hapticError}</p>}
      {error && <p className="tap-error-note" role="alert">{error}</p>}
      {!settingsOpen && stage !== 'choose' && <PracticeCheckpoint compact variant="body" title="Your practice, held together" events={practiceEvents}/>}
      <footer className="tap-secondary"><JourneyOptions id="eftTapping" onOpen={pausePractice} /></footer>
    </div>
  </section>;
}
