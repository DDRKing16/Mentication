import '@/styles/practice-editorial.css';
import PracticeCheckpoint from '@/components/journey/PracticeCheckpoint';
import { practiceEvent as earned } from '@/lib/practiceCheckpoints';
import { useJourneyScreenHistory } from '@/hooks/useJourneyScreenHistory';
import JourneyOptions from '@/components/journey/JourneyOptions';
import JourneyTakeaway from '@/components/journey/JourneyTakeaway';
import { useFlowNav } from "@/components/brand/InterventionNav";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Check, ChevronLeft, ExternalLink, Pause, Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UrgeWave from "@/components/UrgeWave";
import { useGuideVoice } from "@/hooks/useGuideVoice";
import { useUrgeSurfSoundscape } from "@/hooks/useUrgeSurfSoundscape";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { URGE_SURF_NARRATION } from "@/lib/urgeSurfNarration";
import { createUrgeSession, reduceUrgeSession, urgePracticeCompletion, captureUrgeRuntime, restoreUrgeRuntime } from "@/lib/urgeSurfSession";
import { buildUrgeSurfLearningRecord } from "@/lib/urgeSurfState";
import { getBrandCoral } from "@/lib/interventionBrand";
import "@/styles/urge-surfing.css";

const BRAND_ID = "urgeSurf";
const BRAND_GOAL = "calm";

const BODY_AREAS = [
  ["head_face", "Head"],
  ["throat_neck", "Throat"],
  ["chest", "Chest"],
  ["upper_abdomen", "Stomach"],
  ["arms_hands", "Hands"],
  ["whole_body", "All over"],
];

const SENSATIONS = [
  ["tight", "Tight"],
  ["hot", "Hot"],
  ["restless", "Restless"],
  ["heavy", "Heavy"],
  ["buzzing", "Tingling"],
  ["hollow", "Hollow"],
];

const ANCHOR_SUGGESTIONS = [
  "Tomorrow morning",
  "Someone I care about",
  "My peace",
  "The choice I want",
];

export const URGE_INTENSITY_QUESTION = "How strong is the urge?";
const INTENSITY_ANCHORS = "1 · Very mild — 10 · Extremely strong";

const PRACTICE_STAGES = [
  { label: "Notice", title: "Meet the wave", copy: "Notice the urge or its trigger without needing to locate it in your body or make it change.", spoken: URGE_SURF_NARRATION.stages[0] },
  { label: "Allow", title: "Make room", copy: "Allow whatever you notice, if comfortable. You can stop at any time.", spoken: URGE_SURF_NARRATION.stages[1] },
  { label: "Rise", title: "Ride the lift", copy: "Whether steady or changing, take one comfortable breath. You can feel the urge without following it.", spoken: URGE_SURF_NARRATION.stages[2] },
  { label: "Observe", title: "Notice what changes", copy: "The urge may rise, stay steady, or ease. Notice what is true for you.", spoken: URGE_SURF_NARRATION.stages[3] },
  { label: "Steady", title: "Find a little steadiness", copy: "If it helps, loosen your jaw, shoulders, or hands. The urge does not have to soften.", spoken: URGE_SURF_NARRATION.stages[4] },
  { label: "Choose", title: "Consider your next step", copy: "Notice the urge as this practice ends. You can choose a next step even if it is still strong.", spoken: URGE_SURF_NARRATION.stages[5] },
];

const STAGE_SHARES = [0.12, 0.14, 0.22, 0.18, 0.21, 0.13];

function BackgroundWaves() {
  return (
    <div className="urge-lovable__background" aria-hidden="true">
      <svg viewBox="0 0 900 160" preserveAspectRatio="none">
        <path d="M0 88C90 26 150 147 250 84S410 42 500 91s161 51 250-8 150-26 250 15v62H0Z" />
      </svg>
      <svg viewBox="0 0 900 130" preserveAspectRatio="none">
        <path d="M0 70c80-35 150 49 250 1s176-20 250 9 162 30 250-5 168-20 250 9v46H0Z" />
      </svg>
    </div>
  );
}

function Shell({ children, step, onBack, backLabel = "Go back", trailing }) {
  const screen=useRef(null);
  useEffect(()=>{ const heading=screen.current?.querySelector("h1");heading?.setAttribute("tabindex","-1");heading?.focus({preventScroll:true});window.scrollTo(0,0);},[]);
  return (
    <main ref={screen} className="urge-lovable">
      <section className="urge-lovable__shell">
        <BackgroundWaves />
        <header className="urge-lovable__header">
          <div className="urge-lovable__header-side urge-lovable__header-side--start">
            {onBack && (
              <button type="button" onClick={onBack} aria-label={backLabel} className="urge-lovable__icon-button">
                <ChevronLeft aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="urge-lovable__header-label">
            Mentication <span aria-hidden="true" style={{ color: getBrandCoral(BRAND_ID) }}>·</span> {BRAND_GOAL}
          </p>
          <div className="urge-lovable__header-side urge-lovable__header-side--end">{trailing}</div>
        </header>
        {step ? (
          <div className="urge-lovable__thread" role="progressbar" aria-label={`Step ${step} of 5`} aria-valuemin={1} aria-valuemax={5} aria-valuenow={step}>
            <span className="urge-lovable__thread-fill" style={{ width: `${(step / 5) * 100}%`, background: `linear-gradient(90deg, ${getBrandCoral(BRAND_ID)}66, ${getBrandCoral(BRAND_ID)})`, boxShadow: `0 0 10px ${getBrandCoral(BRAND_ID)}88` }} />
          </div>
        ) : null}
        <div className="urge-lovable__content">{children}</div>
        <div style={{position:"relative",zIndex:5,padding:"0 1.25rem"}}><JourneyOptions id="urgeSurf" onOpen={() => window.dispatchEvent(new Event("mentation:urge-pause"))} /></div>
      </section>
    </main>
  );
}

function WaveOrb({ intensity, breathing = false, rated = true }) {
  const fill = 35 + intensity * 4.5;
  return (
    <div className={`urge-lovable__orb ${breathing ? "is-breathing" : ""}`}>
      <div className="urge-lovable__orb-ring" />
      <div className="urge-lovable__orb-water">
        <div className="urge-lovable__water" style={{ height: `${fill}%` }}>
          <svg viewBox="0 0 400 150" preserveAspectRatio="none"><path d="M0 70c45-27 78 20 126-5s82 21 128-3 83 20 146-4v92H0Z" /></svg>
          <svg viewBox="0 0 400 150" preserveAspectRatio="none"><path d="M0 73c49-37 86 33 138-4s87 29 138-3 79 25 124-2v86H0Z" /></svg>
          <i />
          <div className="urge-lovable__water-details" aria-hidden="true">
            <svg className="fish fish-one" viewBox="0 0 32 18"><path d="M9 9C15 3 24 4 29 9c-5 5-14 6-20 0ZM9 9 2 3v12Z" /><circle cx="25" cy="7.5" r="1" /></svg>
            <svg className="fish fish-two" viewBox="0 0 32 18"><path d="M9 9C15 3 24 4 29 9c-5 5-14 6-20 0ZM9 9 2 3v12Z" /></svg>
            <span className="bubble bubble-one" />
            <span className="bubble bubble-two" />
            <span className="bubble bubble-three" />
          </div>
        </div>
      </div>
      <div className="urge-lovable__orb-value"><strong>{rated ? intensity : "—"}</strong><span>{rated ? "intensity" : "not rated"}</span></div>
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return <Button {...props} className="urge-lovable__primary">{children}</Button>;
}

function useUrgeNarration(text, enabled) {
  const { speak, stop, preload } = useGuideVoice();
  useEffect(() => {
    if (!enabled || !text) {
      stop();
      return undefined;
    }
    preload(text);
    speak(text, { rate: 1 });
    return stop;
  }, [enabled, preload, speak, stop, text]);
}

function NameStage({ session, dispatch, onExit, audioEnabled }) {
  const { goBack } = useFlowNav();
  const { prefs } = useAccessibilityPrefs();
  useUrgeNarration(PRACTICE_STAGES[0].spoken, audioEnabled);
  return <Shell onBack={goBack} backLabel="Back" trailing={<button type="button" className="urge-lovable__exit" onClick={onExit}>Exit</button>}><div className="urge-lovable__screen urge-lovable__start">
    <div className="urge-lovable__intro"><p className="urge-lovable__eyebrow">Urge surfing</p><h1>Make a little space before acting.</h1><p>Notice one neutral detail around you. You do not have to focus on your body or change the urge.</p></div>
    <div className="urge-lovable__start-wave" aria-hidden="true"><UrgeWave stage={0} paused reducedMotion={prefs.reducedMotion}/></div>
    <PrimaryButton onClick={()=>dispatch({type:"QUICK_PRACTICE_STARTED"})}>Start a {session.timer.segmentDurationMs/1000}-second pause</PrimaryButton>
    <p className="urge-lovable__reassurance">The wave guides you; it does not measure your urge. Pause or stop any time.</p>
    <button type="button" className="urge-lovable__text-button" onClick={()=>dispatch({type:"SETUP_OPENED"})}>Personalise my pause · optional</button>
    <details className="urge-lovable__optional-setup"><summary>What this tab remembers</summary><p>Refresh keeps your timer paused and confirmed check-ins in this tab. Unsaved anchor words and body details are not kept.</p></details>
  </div></Shell>;
}

function InitialRatingStage({session,dispatch,audioEnabled}) {
  useUrgeNarration(URGE_SURF_NARRATION.name,audioEnabled);
  const value=session.initialIntensity ?? 5;
  return <Shell onBack={()=>dispatch({type:"NAVIGATE_BACK"})}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>{URGE_INTENSITY_QUESTION}</h1><p>Optional. Nothing is rated until you select or confirm it.</p></div><WaveOrb intensity={value} rated={session.initialIntensity!==null}/><input aria-label={URGE_INTENSITY_QUESTION} className="urge-lovable__slider" type="range" min="1" max="10" value={value} onChange={event=>dispatch({type:"INITIAL_INTENSITY_SET",value:Number(event.target.value)})}/><p>{INTENSITY_ANCHORS}</p><button className="urge-lovable__text-button" onClick={()=>dispatch({type:"INITIAL_INTENSITY_SET",value})}>Confirm {value} out of 10</button><PrimaryButton onClick={()=>dispatch({type:"NAVIGATE",route:"urge.body"})}>Continue{session.initialIntensity===null ? ' without a rating' : ''}</PrimaryButton></div></Shell>;
}

function BodyStage({ session, dispatch, audioEnabled }) {
  useUrgeNarration(URGE_SURF_NARRATION.body, audioEnabled);
  return <Shell onBack={()=>dispatch({type:"NAVIGATE_BACK"})}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>Where will you place your attention?</h1><p>Choose a comfortable starting point. Tap an option to continue.</p></div><fieldset className="urge-lovable__choice-grid"><legend className="sr-only">Starting point</legend>{BODY_AREAS.map(([key,label])=><button key={key} type="button" aria-pressed={session.bodyRegionKey===key} onClick={()=>{dispatch({type:"BODY_REGION_SET",key});dispatch({type:"NAVIGATE",route:"urge.sensation"});}}>{label}</button>)}{[["external","Something around me"],["not_sure","Not sure / no clear sensation"]].map(([key,label])=><button key={key} type="button" aria-pressed={session.environmentCueKey===key} onClick={()=>{dispatch({type:"ENVIRONMENT_CUE_SET",key});dispatch({type:"NAVIGATE",route:"urge.anchor"});}}>{label}</button>)}</fieldset></div></Shell>;
}

function SensationStage({session,dispatch,audioEnabled}) {
  useUrgeNarration(URGE_SURF_NARRATION.sensation,audioEnabled);
  return <Shell onBack={()=>dispatch({type:"NAVIGATE_BACK"})}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>What does it feel like?</h1><p>Choose the closest fit, or use a detail around you instead.</p></div><fieldset className="urge-lovable__sensation-grid"><legend className="sr-only">Sensation</legend>{SENSATIONS.map(([key,label])=><button key={key} aria-pressed={session.sensationKeys.includes(key)} onClick={()=>{if(!session.sensationKeys.includes(key))dispatch({type:"SENSATION_TOGGLED",key});dispatch({type:"NAVIGATE",route:"urge.anchor"});}}>{label}</button>)}</fieldset><button className="urge-lovable__text-button" onClick={()=>{dispatch({type:"ENVIRONMENT_CUE_SET",key:"external"});dispatch({type:"NAVIGATE",route:"urge.anchor"});}}>Use something around me</button></div></Shell>;
}

function AnchorStage({ session, dispatch, audioEnabled }) {
  useUrgeNarration(URGE_SURF_NARRATION.anchor, audioEnabled);
  return <Shell onBack={()=>dispatch({type:"NAVIGATE_BACK"})}><div className="urge-lovable__screen urge-lovable__anchor-screen"><div className="urge-lovable__heading"><h1>What are you protecting by waiting?</h1><p>Optional. Choose a reminder, write your own, or leave this blank.</p></div><div className="urge-lovable__anchor-suggestions" aria-label="Suggested anchors">{ANCHOR_SUGGESTIONS.map(value=><button key={value} aria-pressed={session.anchorText===value} onClick={()=>dispatch({type:"ANCHOR_CHANGED",value})}>{value}</button>)}</div><label className="urge-lovable__anchor"><span>Your reminder · optional</span><textarea rows="2" maxLength="120" value={session.anchorText} placeholder="A short reminder for yourself" onChange={event=>dispatch({type:"ANCHOR_CHANGED",value:event.target.value})}/></label><PrimaryButton onClick={()=>dispatch({type:"NAVIGATE",route:"urge.duration"})}>Continue</PrimaryButton></div></Shell>;
}

function DurationStage({session,dispatch}) {
  const duration=session.timer.segmentDurationMs/1000;
  return <Shell onBack={()=>dispatch({type:"NAVIGATE_BACK"})}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>How long would you like to pause?</h1><p>Pause or stop at any time, including if the urge gets stronger.</p></div><fieldset className="urge-lovable__choice-grid"><legend className="sr-only">Practice duration</legend>{[30,60].map(seconds=><button key={seconds} aria-pressed={duration===seconds} onClick={()=>dispatch({type:"DURATION_CHANGED",durationMs:seconds*1000})}>{seconds} seconds</button>)}</fieldset><PrimaryButton onClick={()=>dispatch({type:"GUIDED_PRACTICE_STARTED"})}>Start surfing</PrimaryButton></div></Shell>;
}

function formatDuration(totalSeconds) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function TimerStage({ session, dispatch, audioEnabled, runtimeAvailable }) {
  const [now, setNow] = useState(Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
  const endDialog = useRef(null);
  const [narrationActive, setNarrationActive] = useState(false);
  const { prefs } = useAccessibilityPrefs();
  const paused = session.status === "timer_paused";
  const duration = Math.round(session.timer.segmentDurationMs / 1000);
  const secondsLeft = paused
    ? Math.max(0, Math.ceil((session.timer.pausedRemainingMs ?? 0) / 1000))
    : Math.max(0, Math.ceil((session.timer.segmentEndsAtEpochMs - now) / 1000));
  const elapsed = Math.max(0, duration - secondsLeft);
  const stageDurations = STAGE_SHARES.map((share) => duration * share);
  const starts = stageDurations.map((_, index) => stageDurations.slice(0, index).reduce((total, value) => total + value, 0));
  const stageIndex = Math.min(starts.filter((start) => elapsed >= start).length - 1, PRACTICE_STAGES.length - 1);
  const stageStart = starts[stageIndex] ?? 0;
  const stageProgress = Math.min(1, Math.max(0, (elapsed - stageStart) / (stageDurations[stageIndex] || 1)));
  const stage = PRACTICE_STAGES[stageIndex] ?? PRACTICE_STAGES[0];
  const breathLabel = elapsed % 10 < 5 ? "Inhale slowly" : "Exhale slowly";
  const { speak, stop: stopNarration, pause: pauseNarration, resume: resumeNarration, preload } = useGuideVoice();
  useUrgeSurfSoundscape({ active: true, enabled: audioEnabled && !paused, narrationActive, stageIndex });

  useEffect(() => { if (confirmExit) endDialog.current?.showModal(); }, [confirmExit]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!paused) setNow(Date.now());
    }, 250);
    return () => window.clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (!document.hidden) return;
      dispatch({ type: "TIMER_PAUSED", nowEpochMs: Date.now() });
      pauseNarration();
    };
    const pauseForAlternative = () => { dispatch({ type: "TIMER_PAUSED", nowEpochMs: Date.now() }); pauseNarration(); };
    window.addEventListener("mentation:urge-pause", pauseForAlternative);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => { document.removeEventListener("visibilitychange", pauseWhenHidden); window.removeEventListener("mentation:urge-pause", pauseForAlternative); };
  }, [dispatch, pauseNarration]);

  useEffect(() => {
    if (secondsLeft === 0) dispatch({ type: "TIMER_ELAPSED", nowEpochMs: now });
  }, [dispatch, now, secondsLeft]);

  useEffect(() => {
    if (!audioEnabled) {
      setNarrationActive(false);
      stopNarration();
      return undefined;
    }
    setNarrationActive(true);
    preload(stage.spoken);
    speak(stage.spoken, { rate: 1, onEnd: () => setNarrationActive(false) });
    return stopNarration;
  }, [audioEnabled, preload, speak, stage.spoken, stopNarration]);

  return (
    <Shell step={4}>
      <div className="urge-lovable__screen urge-lovable__practice">
        <div className="urge-lovable__practice-title">
          <p>{(session.environmentCueKey || !session.bodyRegionKey) ? "Notice what is here, without needing to locate it" : `${BODY_AREAS.find(([key]) => key === session.bodyRegionKey)?.[1]} · ${SENSATIONS.find(([key]) => key === session.sensationKeys[0])?.[1]}`}</p>
          <h1>{stage.title}</h1>
        </div>
        <div className="urge-lovable__practice-ocean">
          <UrgeWave stage={stageIndex} progress={stageProgress} paused={paused} reducedMotion={prefs.reducedMotion} />
          <div className="urge-lovable__practice-time"><strong>{formatDuration(secondsLeft)}</strong><span>{paused ? "Take your time" : breathLabel}</span></div>
        </div>
        <div className="urge-lovable__journey" aria-label={`Urge surfing stage ${stageIndex + 1} of ${PRACTICE_STAGES.length}`}>
          {PRACTICE_STAGES.map((item, index) => <span className={index === stageIndex ? "is-active" : index < stageIndex ? "is-complete" : ""} key={item.label}><i />{item.label}</span>)}
        </div>
        <p className="urge-lovable__guidance" aria-live="polite">{stage.copy}</p>
        <PracticeCheckpoint compact variant="wave" title="A little space before acting" events={PRACTICE_STAGES.slice(0,stageIndex).map((item,i)=>earned(`guide-${i}`,'Guidance reached',item.label === 'Notice' ? 'Notice without needing the urge to change.' : item.label === 'Allow' ? 'There is room to wait before choosing.' : item.copy))}/>
        {runtimeAvailable === false && <p role="status" className="urge-lovable__reassurance">Timer position could not be kept for refresh. Keep this page open; you can still pause or stop.</p>}
        <div className="urge-lovable__practice-controls">
          <button
            type="button"
            onClick={() => {
              if (paused) {
                setNow(Date.now());
                dispatch({ type: "TIMER_RESUMED", nowEpochMs: Date.now() });
                resumeNarration();
              } else {
                dispatch({ type: "TIMER_PAUSED", nowEpochMs: Date.now() });
                pauseNarration();
              }
            }}
            aria-label={paused ? "Resume practice" : "Pause practice"}
          >
            <span className="sr-only">{paused ? "Resume practice" : "Pause practice"}</span>{paused ? <Play /> : <Pause />}
          </button>
          <button type="button" onClick={() => { dispatch({ type: "TIMER_PAUSED", nowEpochMs: Date.now() }); pauseNarration(); setConfirmExit(true); }}><X aria-hidden="true" /> End early</button>
        </div>
        {confirmExit && (
          <dialog ref={endDialog} className="urge-lovable__overlay" aria-labelledby="urge-end-title" onCancel={()=>setConfirmExit(false)}>
            <section>
              <h2 id="urge-end-title">Leave the wave?</h2>
              <p>You can stop whenever you need to. The time you have already made still counts.</p>
              <PrimaryButton autoFocus onClick={() => { setConfirmExit(false); setNow(Date.now()); dispatch({ type: "TIMER_RESUMED", nowEpochMs: Date.now() }); resumeNarration(); }}>Keep surfing</PrimaryButton>
              <button type="button" className="urge-lovable__text-button" onClick={() => dispatch({ type: "TIMER_STOPPED", nowEpochMs: Date.now() })}>End gently</button>
            </section>
          </dialog>
        )}
      </div>
    </Shell>
  );
}

function PostRatingStage({session,dispatch,audioEnabled}) {
  useUrgeNarration(URGE_SURF_NARRATION.postRating,audioEnabled);
  const value=session.postIntensity ?? session.initialIntensity ?? 5;
  return <Shell onBack={()=>dispatch({type:"OPTIONAL_ROUTE",route:"urge.complete"})}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>{URGE_INTENSITY_QUESTION}</h1><p>Optional. Softer, stronger or unchanged are all valid.</p></div><div className="urge-lovable__orb-wrap"><WaveOrb intensity={value} rated={session.postIntensity!==null}/></div><input aria-label={URGE_INTENSITY_QUESTION} aria-valuetext={session.postIntensity===null?'No rating chosen':`${value} out of 10`} className="urge-lovable__slider" type="range" min="1" max="10" value={value} onChange={event=>dispatch({type:"POST_INTENSITY_SELECTED",value:Number(event.target.value)})}/><p>{INTENSITY_ANCHORS}</p><button className="urge-lovable__text-button" onClick={()=>dispatch({type:"POST_INTENSITY_SELECTED",value})}>Confirm {value} out of 10</button><PrimaryButton onClick={()=>dispatch({type:"OPTIONAL_ROUTE",route:"urge.choice"})}>Continue{session.postIntensity===null?' without a rating':''}</PrimaryButton><button className="urge-lovable__text-button" onClick={()=>dispatch({type:"OPTIONAL_ROUTE",route:"urge.complete"})}>Finish without more check-ins</button></div></Shell>;
}

function OptionalCompletionStage({session,dispatch,route,audioEnabled}) {
  useUrgeNarration(route === "urge.choice" ? URGE_SURF_NARRATION.choice : null,audioEnabled);
  const titles={"urge.choice":"Did the pause give you more room to choose?","urge.feedback":"Was this practice helpful?","urge.record":"Keep these check-ins in your local record?","urge.takeaway":"What would you like to keep?"};
  const options=route==='urge.choice'?[["a_little","More room to choose"],["not_yet","No change"],["stronger","Less room / more unsettled"]]:[["helpful","Helpful"],["same","No difference"],["worse","Made things worse"],["unsure","Not sure"]];
  const value=route==='urge.choice'?session.choiceOutcome:session.helpfulness;
  return <Shell onBack={()=>dispatch({type:"OPTIONAL_ROUTE",route:route==='urge.choice'?'urge.postRating':'urge.complete'})}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>{titles[route]}</h1><p>Optional. You can continue without adding anything.</p></div>{['urge.choice','urge.feedback'].includes(route)&&<fieldset className="urge-lovable__outcomes"><legend className="sr-only">{titles[route]}</legend>{options.map(([key,label])=><button key={key} aria-pressed={value===key} onClick={()=>dispatch({type:route==='urge.choice'?'CHOICE_OUTCOME_SELECTED':'HELPFULNESS_SELECTED',value:value===key?null:key})}>{label}</button>)}</fieldset>}{route==='urge.record'&&<label className="urge-lovable__save"><input type="checkbox" checked={session.savePreference} onChange={event=>dispatch({type:"SAVE_PREFERENCE_SET",value:event.target.checked})}/><span>Include confirmed urge ratings and choice feedback.<small>No anchor words or body locations. This is device-local and can be deleted in Settings.</small></span></label>}{route==='urge.takeaway'&&<JourneyTakeaway id="urgeSurf"/>}<PrimaryButton onClick={()=>dispatch({type:"OPTIONAL_ROUTE",route:"urge.complete"})}>Return to my next step</PrimaryButton></div></Shell>;
}

function CompleteStage({session,dispatch,onExit,onFinish,audioEnabled}) {
  const navigate=useNavigate();
  const [nextAction,setNextAction]=useState(null);
  useUrgeNarration(URGE_SURF_NARRATION.complete,audioEnabled);
  if(nextAction)return <Shell onBack={()=>setNextAction(null)}><div className="urge-lovable__screen"><div className="urge-lovable__heading"><h1>{nextAction==='leave'?'Create some distance':'Choose one substitute'}</h1><p>{nextAction==='leave'?'If safe, put the triggering item out of reach or move somewhere supported. Choose where you will go.':'Choose one safe action: sip water, walk to another room, hold a familiar object, or contact someone supportive.'}</p></div><PrimaryButton onClick={()=>onFinish(nextAction)}>Finish with this next step</PrimaryButton></div></Shell>;
  return <Shell trailing={<button className="urge-lovable__exit" onClick={onExit}>Exit</button>}><div className="urge-lovable__screen urge-lovable__complete"><div className="urge-lovable__complete-mark"><Check aria-hidden="true"/></div><p className="urge-lovable__eyebrow">{session.timer.completionReason==='stopped'?'Practice ended early':'Practice complete'}</p><h1>Take the next step that fits.</h1><p>The urge may still be here. You do not have to make it change.</p><div className="urge-lovable__time-rule"><span/>{formatDuration(Math.round(session.timer.totalElapsedMs/1000))} active time<span/></div><PrimaryButton onClick={()=>onFinish('wait')}>Finish this pause</PrimaryButton><details className="urge-lovable__optional-setup"><summary>Choose another next step</summary><div className="urge-lovable__finish-actions"><button onClick={()=>dispatch({type:'REPEAT_WAVE'})}>Ride it again</button><button onClick={()=>dispatch({type:'EXTEND_TIMER'})}>Wait 10 more minutes</button><button onClick={()=>setNextAction('leave')}>Leave the trigger</button><button onClick={()=>setNextAction('substitute')}>Choose a substitute</button><button onClick={()=>navigate('/support')}>Reach out for support</button></div></details><details className="urge-lovable__optional-setup"><summary>My check-ins · optional</summary><p>{session.postIntensity===null?'No final urge rating was recorded.':`Confirmed urge rating: ${session.postIntensity}/10.${session.initialIntensity===null?' No starting urge rating was recorded.':` Starting: ${session.initialIntensity}/10.`}`}</p>{session.choiceOutcome&&<p>{session.choiceOutcome==='a_little'?'You noticed more room to choose.':session.choiceOutcome==='not_yet'?'You noticed no change in choice.':'You noticed less room to choose.'}</p>}<div className="urge-lovable__finish-actions"><button onClick={()=>dispatch({type:'OPTIONAL_ROUTE',route:'urge.postRating'})}>Rate the urge</button><button onClick={()=>dispatch({type:'OPTIONAL_ROUTE',route:'urge.feedback'})}>Practice feedback</button><button onClick={()=>dispatch({type:'OPTIONAL_ROUTE',route:'urge.record'})}>Local record preferences</button><JourneyTakeaway id="urgeSurf"/></div></details><a className="urge-lovable__support-link" href="https://findahelpline.com" target="_blank" rel="noreferrer">Need immediate support? <ExternalLink aria-hidden="true"/></a></div></Shell>;
}

export default function UrgeSurfExperience({ answers, sessionId, onExit, onComplete }) {
  // A shared distress baseline must never answer the different urge question.
  const initialSession = useMemo(() => restoreUrgeRuntime(window.history.state?.urgeSurfRuntime, sessionId) || createUrgeSession(), [sessionId]);
  const [state, send] = useReducer(reduceUrgeSession, initialSession);
  useJourneyScreenHistory("urgeSurf",state.currentRoute,route=>{ const next=reduceUrgeSession(state,{type:"SCREEN_RESTORED",route});send({type:"SCREEN_RESTORED",route});return next.currentRoute; });
  const audioEnabled = !answers?.noAudio && answers?.audio === "yes";
  const current = useRef(state);
  current.current = state;
  const [runtimeAvailable, setRuntimeAvailable] = useState(null);
  const clearRuntime = () => {
    if (window.history.state?.urgeSurfRuntime?.sessionId !== sessionId) return;
    const next = {...window.history.state}; delete next.urgeSurfRuntime;
    try { window.history.replaceState(next, ""); } catch { /* the current practice remains usable */ }
  };
  useEffect(() => {
    const keepPosition = () => {
      // Never write an old practice into a different router entry on exit/Back.
      if (window.history.state?.usr?.reset_session_id !== sessionId || window.history.state?.usr?.reset_phase !== "guiding") return;
      const snapshot = captureUrgeRuntime(current.current, sessionId);
      if (!snapshot) return;
      try { window.history.replaceState({...window.history.state,urgeSurfRuntime:snapshot}, ""); setRuntimeAvailable(true); }
      catch { setRuntimeAvailable(false); }
    };
    keepPosition();
    const interval = state.status === "timer_active" ? window.setInterval(keepPosition,1000) : null;
    window.addEventListener("pagehide", keepPosition);
    return () => { if (interval !== null) window.clearInterval(interval); window.removeEventListener("pagehide", keepPosition); };
  }, [sessionId, state]);
  const exit = () => { clearRuntime(); onExit?.(); };

  const finish = (action) => {
    const outcome = state.savePreference ? buildUrgeSurfLearningRecord({
      categoryKey: state.categoryKeys[0],
      windowSeconds: state.timer.segmentDurationMs / 1000,
      intensityBefore: state.initialIntensity,
      intensityNow: state.postIntensity,
      action,
      choiceOutcome: state.choiceOutcome,
    }) : undefined;
    clearRuntime();
    onComplete?.({ requireGoalReassessment: true, ...urgePracticeCompletion(state), helpfulness: state.helpfulness, outcome });
  };

  if (state.currentRoute === "urge.rating") return <InitialRatingStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.sensation") return <SensationStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.duration") return <DurationStage session={state} dispatch={send} />;
  if (["urge.choice","urge.feedback","urge.record","urge.takeaway"].includes(state.currentRoute)) return <OptionalCompletionStage key={state.currentRoute} session={state} dispatch={send} route={state.currentRoute} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.body") return <BodyStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.anchor") return <AnchorStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.timer") return <TimerStage session={state} dispatch={send} audioEnabled={audioEnabled} runtimeAvailable={runtimeAvailable} />;
  if (state.currentRoute === "urge.postRating") return <PostRatingStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.complete") return <CompleteStage session={state} dispatch={send} onExit={exit} onFinish={finish} audioEnabled={audioEnabled} />;
  return <NameStage session={state} dispatch={send} onExit={exit} audioEnabled={audioEnabled} />;
}
