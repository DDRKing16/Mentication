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
import { createUrgeSession, reduceUrgeSession, URGE_SURF_DEFAULTS, urgePracticeCompletion, captureUrgeRuntime, restoreUrgeRuntime } from "@/lib/urgeSurfSession";
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
  return (
    <main className="urge-lovable">
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
  const [setupOpen, setSetupOpen] = useState(false);
  const intensity = session.initialIntensity ?? 7;
  const ready = Number.isInteger(session.initialIntensity);
  const duration = session.timer.segmentDurationMs / 1000;
  useUrgeNarration(setupOpen ? URGE_SURF_NARRATION.name : PRACTICE_STAGES[0].spoken, audioEnabled);
  return (
    <Shell onBack={goBack} backLabel="Back" trailing={<button type="button" className="urge-lovable__exit" onClick={onExit}>Exit</button>}>
      <div className="urge-lovable__screen urge-lovable__start">
        <div className="urge-lovable__intro">
          <p className="urge-lovable__eyebrow">Urge surfing</p>
          <h1>Make a little space before acting.</h1>
          <p>Notice a neutral detail around you while you wait. You do not have to focus on your body or make the urge change.</p>
        </div>
        <div className="urge-lovable__start-wave" aria-hidden="true"><UrgeWave stage={0} paused reducedMotion={prefs.reducedMotion} /></div>
        <p className="urge-lovable__reassurance">The wave guides the practice; it does not measure your urge.</p>
        <fieldset className="urge-lovable__start-duration"><legend>Time with the wave</legend>
          {[30,60].map(seconds => <button type="button" key={seconds} aria-pressed={duration===seconds} onClick={()=>dispatch({type:"DURATION_CHANGED",durationMs:seconds*1000})}>{seconds} seconds</button>)}
        </fieldset>
        <PrimaryButton onClick={()=>dispatch({type:"QUICK_PRACTICE_STARTED"})}>Start with a detail around me</PrimaryButton>
        <p className="urge-lovable__reassurance">Pause or stop at any time. If observing the urge is uncomfortable, choose Another way.</p>
        <p className="urge-lovable__reassurance">Refresh keeps your timer paused and your confirmed check-ins in this tab. Unsaved anchor words and body details are not kept.</p>
        <details className="urge-lovable__optional-setup" onToggle={event=>setSetupOpen(event.currentTarget.open)}>
          <summary>Add an urge rating or body anchor · optional</summary>
          <h2>{URGE_INTENSITY_QUESTION}</h2>
          <p>No need to change it. Just notice what’s here.</p>
          <div className="urge-lovable__orb-wrap"><WaveOrb intensity={intensity} rated={ready} /></div>
          <label className="sr-only" htmlFor="urge-intensity">{URGE_INTENSITY_QUESTION}</label>
          <input id="urge-intensity" className="urge-lovable__slider" type="range" min="1" max="10" value={intensity}
            aria-valuetext={ready ? `${intensity} out of 10` : "No rating chosen. Choose a rating from 1 to 10."}
            onChange={event=>dispatch({type:"INITIAL_INTENSITY_SET",value:Number(event.target.value)})} />
          <p>{INTENSITY_ANCHORS}</p>
          <button type="button" className="urge-lovable__text-button" onClick={()=>dispatch({type:"INITIAL_INTENSITY_SET",value:intensity})}>Confirm {intensity} out of 10</button>
          <PrimaryButton disabled={!ready} onClick={()=>dispatch({type:"NAVIGATE",route:"urge.body"})}>{ready ? "Choose my anchor" : "Choose or confirm a rating"}</PrimaryButton>
        </details>
      </div>
    </Shell>
  );
}

function BodyStage({ session, dispatch, audioEnabled }) {
  const region = session.bodyRegionKey;
  const sensation = session.sensationKeys[0] || null;
  const ready = Boolean(session.environmentCueKey || (region && sensation));
  useUrgeNarration(URGE_SURF_NARRATION.body, audioEnabled);
  return (
    <Shell step={2} onBack={() => dispatch({ type: "NAVIGATE_BACK" })} backLabel="Back to urge intensity">
      <div className="urge-lovable__screen urge-lovable__body-screen">
        <div className="urge-lovable__heading urge-lovable__body-section-title">
          <p className="urge-lovable__eyebrow">Tune in</p>
          <h1>Where do you feel it?</h1>
        </div>
        <fieldset className="urge-lovable__choice-grid">
          <legend className="sr-only">Body area</legend>
          {BODY_AREAS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={region === key} className={region === key ? "is-selected" : ""} onClick={() => dispatch({ type: "BODY_REGION_SET", key })}>
              {region === key && <Check aria-hidden="true" />} {label}
            </button>
          ))}
        </fieldset>
        <fieldset className="urge-lovable__choice-grid"><legend>Or choose another starting point</legend>
          {[["external", "Something around me"], ["not_sure", "Not sure / no clear sensation"]].map(([key, label]) => <button type="button" key={key} aria-pressed={session.environmentCueKey === key} className={session.environmentCueKey === key ? "is-selected" : ""} onClick={() => dispatch({ type: "ENVIRONMENT_CUE_SET", key })}>{label}</button>)}
        </fieldset>
        {!session.environmentCueKey && <><div className="urge-lovable__subheading urge-lovable__body-section-title"><p className="urge-lovable__eyebrow">Give it texture</p><h2>What does it feel like?</h2></div>
        <fieldset className="urge-lovable__sensation-grid">
          <legend className="sr-only">Sensation</legend>
          {SENSATIONS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={sensation === key} className={sensation === key ? "is-selected" : ""} onClick={() => dispatch({ type: "SENSATION_TOGGLED", key })}>
              {sensation === key && <Check aria-hidden="true" />} {label}
            </button>
          ))}
        </fieldset>
        </>}
        <PrimaryButton disabled={!ready} onClick={() => dispatch({ type: "NAVIGATE", route: "urge.anchor" })}>Continue</PrimaryButton>
      </div>
    </Shell>
  );
}

function AnchorStage({ session, dispatch, audioEnabled }) {
  const duration = Math.round(session.timer.segmentDurationMs / 1000);
  useUrgeNarration(URGE_SURF_NARRATION.anchor, audioEnabled);
  return (
    <Shell step={3} onBack={() => dispatch({ type: "NAVIGATE_BACK" })} backLabel="Back to body sensations">
      <div className="urge-lovable__screen urge-lovable__anchor-screen">
        <div className="urge-lovable__heading">
          <p className="urge-lovable__eyebrow">Set your anchor</p>
          <h1>What are you protecting by waiting?</h1>
          <p>Optional. Choose a thought below, write your own, or move straight on.</p>
        </div>
        <div className="urge-lovable__anchor-suggestions" aria-label="Suggested anchors">
          {ANCHOR_SUGGESTIONS.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              aria-pressed={session.anchorText === suggestion}
              className={session.anchorText === suggestion ? "is-selected" : ""}
              onClick={() => dispatch({ type: "ANCHOR_CHANGED", value: suggestion })}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <label className="urge-lovable__anchor">
          <span>Your own words <small>optional</small></span>
          <textarea
            rows="1"
            maxLength="120"
            value={session.anchorText}
            placeholder="Add a short reminder"
            onChange={(event) => dispatch({ type: "ANCHOR_CHANGED", value: event.target.value })}
          />
          <small className="urge-lovable__counter">{session.anchorText.length}/120</small>
        </label>
        <label className="urge-lovable__duration" htmlFor="urge-duration">
          <span><b>Time with the wave</b><output htmlFor="urge-duration">{duration} sec</output></span>
          <input
            id="urge-duration"
            className="urge-lovable__slider"
            type="range"
            min={URGE_SURF_DEFAULTS.durations[0]}
            max={URGE_SURF_DEFAULTS.durations.at(-1)}
            step="5"
            value={duration}
            onChange={(event) => dispatch({ type: "DURATION_CHANGED", durationMs: Number(event.target.value) * 1000 })}
          />
          <span className="urge-lovable__range-labels"><small>30 sec</small><small>60 sec</small></span>
        </label>
        <PrimaryButton onClick={() => dispatch({ type: "TIMER_STARTED" })}>Start surfing</PrimaryButton>
        <p className="urge-lovable__reassurance">You can pause or stop at any time, including if the urge gets stronger.</p>
      </div>
    </Shell>
  );
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

function PostRatingStage({ session, dispatch, audioEnabled }) {
  const afterIntensity = session.postIntensity ?? session.initialIntensity ?? 5;
  const choiceOutcome = session.choiceOutcome;
  const ready = session.postIntensity !== null && choiceOutcome !== null;
  useUrgeNarration(URGE_SURF_NARRATION.postRating, audioEnabled);
  const complete = () => {
    dispatch({ type: "POST_INTENSITY_SELECTED", value: afterIntensity });
    dispatch({ type: "CHOICE_OUTCOME_SET", value: choiceOutcome });
  };
  return (
    <Shell step={5}>
      <div className="urge-lovable__screen">
        <div className="urge-lovable__heading">
          <p className="urge-lovable__eyebrow">Check in again</p>
          <h1>{URGE_INTENSITY_QUESTION}</h1>
          <p>It may be softer, stronger, or simply different. Every answer is okay.</p>
        </div>
        <div className="urge-lovable__orb-wrap"><WaveOrb intensity={afterIntensity} breathing rated={session.postIntensity !== null} /></div>
        <input
          aria-label={URGE_INTENSITY_QUESTION}
          aria-valuetext={session.postIntensity === null ? "No rating chosen. Choose a rating from 1 to 10." : `${afterIntensity} out of 10`}
          className="urge-lovable__slider"
          type="range"
          min="1"
          max="10"
          value={afterIntensity}
          onChange={(event) => dispatch({ type: "POST_INTENSITY_SELECTED", value: Number(event.target.value) })}
        />
        <p>{INTENSITY_ANCHORS}</p>
        <button type="button" className="urge-lovable__text-button" onClick={() => dispatch({ type: "POST_INTENSITY_SELECTED", value: afterIntensity })}>Confirm {afterIntensity} out of 10{afterIntensity === session.initialIntensity ? " · unchanged" : ""}</button>
        <fieldset className="urge-lovable__outcomes">
          <legend>Did the pause give you more room to choose?</legend>
          {[["a_little", "More room to choose"], ["not_yet", "No change"], ["stronger", "Less room / more unsettled"]].map(([value, label]) => (
            <button type="button" key={value} className={choiceOutcome === value ? "is-selected" : ""} aria-pressed={choiceOutcome === value} onClick={() => dispatch({ type: "CHOICE_OUTCOME_SELECTED", value })}>{label}</button>
          ))}
        </fieldset>
        <PrimaryButton disabled={!ready} onClick={complete}>{ready ? "Complete practice" : "Confirm a rating and choose"}</PrimaryButton>
        <button type="button" className="urge-lovable__text-button" onClick={() => dispatch({ type: "POST_RATING_SKIPPED" })}>I’d rather not say</button>
      </div>
    </Shell>
  );
}

function CompleteStage({ session, dispatch, onExit, onFinish, audioEnabled }) {
  const navigate = useNavigate();
  const [nextAction, setNextAction] = useState(null);
  const nextActionRef = useRef(null);
  useEffect(() => {
    if (!nextAction) return;
    nextActionRef.current?.scrollIntoView({ block: "start" });
    nextActionRef.current?.focus({ preventScroll: true });
  }, [nextAction]);
  const totalSeconds = Math.round(session.timer.totalElapsedMs / 1000);
  useUrgeNarration(URGE_SURF_NARRATION.complete, audioEnabled);
  return (
    <Shell onBack={session.entryMode === "external" ? undefined : () => dispatch({ type: "NAVIGATE_BACK" })} backLabel="Back to ratings" trailing={<button type="button" className="urge-lovable__exit" onClick={onExit}>Exit</button>}>
      <div className="urge-lovable__screen urge-lovable__complete">
        <div className="urge-lovable__complete-mark"><Check aria-hidden="true" /></div>
        <p className="urge-lovable__eyebrow">{session.timer.completionReason === "stopped" ? "Practice ended early" : "Practice complete"}</p>
        <h1>{session.choiceOutcome === "a_little" ? "You noticed more room to choose." : session.choiceOutcome === "stronger" ? "You noticed less room to choose." : session.choiceOutcome === "not_yet" ? "You noticed no change in choice." : "Take the next step that fits."}</h1>
        <p>{session.postIntensity == null ? "No final intensity rating was recorded." : session.initialIntensity == null ? `Your confirmed urge rating: ${session.postIntensity} out of 10. No starting urge rating was recorded.` : `Urge intensity: ${session.initialIntensity} → ${session.postIntensity}. ${Math.abs(session.postIntensity - session.initialIntensity)} points ${session.postIntensity < session.initialIntensity ? "lower" : session.postIntensity > session.initialIntensity ? "higher" : "change"}.`}</p>
        <p>{session.choiceOutcome === "stronger" ? "You can stop focusing on the urge, move away from the trigger, or reach out for support." : "The urge may still be here. Choose what would help you through the next few minutes."}</p>
        <div className="urge-lovable__time-rule"><span />{formatDuration(totalSeconds)} active time with the wave<span /></div>
        <div className="urge-lovable__finish-actions">
          <PrimaryButton onClick={() => onFinish("wait")}>Continue to final check-in</PrimaryButton>
          <button type="button" onClick={() => dispatch({ type: "REPEAT_WAVE" })}>Ride it again</button>
          <button type="button" onClick={() => dispatch({ type: "EXTEND_TIMER" })}>Wait 10 more minutes</button>
          <button type="button" onClick={() => setNextAction("leave")}>Leave the trigger</button>
          <button type="button" onClick={() => setNextAction("substitute")}>Choose a substitute</button>
          <button type="button" onClick={() => { dispatch({ type: "COMPLETION_ROUTE_SELECTED", route: "support" }); navigate("/support"); }}>Reach out for support</button>
        </div>
        {nextAction && <section ref={nextActionRef} tabIndex={-1} aria-live="polite" aria-labelledby="urge-next-action-title"><h2 id="urge-next-action-title">{nextAction === "leave" ? "Create some distance" : "Choose one substitute"}</h2><p>{nextAction === "leave" ? "If safe, close the app or put the triggering item out of reach. Move to another room or a place where you feel supported. Pick where you will go before continuing." : "Pick one safe action for the next few minutes: sip water, walk to another room, hold a familiar object, or contact someone supportive. Decide which one you will do now."}</p><PrimaryButton onClick={() => onFinish(nextAction)}>I have a next step · finish</PrimaryButton><button type="button" className="urge-lovable__text-button" onClick={() => setNextAction(null)}>Back to choices</button></section>}
        {session.entryMode === "external" && <details className="urge-lovable__optional-setup"><summary>Urge check-in · optional</summary>
          <h2>{URGE_INTENSITY_QUESTION}</h2><p>{INTENSITY_ANCHORS}</p>
          <output>{session.postIntensity === null ? "No rating chosen" : `${session.postIntensity} out of 10`}</output>
          <input aria-label={URGE_INTENSITY_QUESTION} aria-valuetext={session.postIntensity === null ? "No rating chosen. Choose a rating from 1 to 10." : `${session.postIntensity} out of 10`} className="urge-lovable__slider" type="range" min="1" max="10" value={session.postIntensity ?? 5} onChange={event=>dispatch({type:"POST_INTENSITY_SELECTED",value:Number(event.target.value)})} />
          <button type="button" className="urge-lovable__text-button" onClick={()=>dispatch({type:"POST_INTENSITY_SELECTED",value:session.postIntensity ?? 5})}>Confirm {session.postIntensity ?? 5} out of 10</button>
          <fieldset className="urge-lovable__outcomes"><legend>Did the pause give you more room to choose?</legend>
            {[["a_little","More room to choose"],["not_yet","No change"],["stronger","Less room / more unsettled"]].map(([value,label])=><button type="button" key={value} aria-pressed={session.choiceOutcome===value} className={session.choiceOutcome===value ? "is-selected" : ""} onClick={()=>dispatch({type:"CHOICE_OUTCOME_SELECTED",value})}>{label}</button>)}
          </fieldset>
          <button type="button" className="urge-lovable__text-button" onClick={()=>dispatch({type:"POST_RATING_SKIPPED"})}>Clear this optional check-in</button>
        </details>}
        <JourneyTakeaway id="urgeSurf" />
        <details className="urge-lovable__optional-setup"><summary>Practice feedback and local record · optional</summary>
        <fieldset className="urge-lovable__outcomes"><legend>Was this practice helpful? Optional — helps future suggestions on this device.</legend>
          {[["helpful", "Helpful"], ["same", "No difference"], ["worse", "Made things worse"], ["unsure", "Not sure"]].map(([value, label]) => <button key={value} type="button" className={session.helpfulness === value ? "is-selected" : ""} aria-pressed={session.helpfulness === value} onClick={() => dispatch({ type: "HELPFULNESS_SELECTED", value })}>{label}</button>)}
        </fieldset>
        <label className="urge-lovable__save">
          <input type="checkbox" checked={session.savePreference} onChange={(event) => dispatch({ type: "SAVE_PREFERENCE_SET", value: event.target.checked })} />
          <span><strong>Include urge ratings and choice feedback in my local record</strong><small>No anchor words, body locations, or voice content are included.</small></span>
        </label>
        </details>
        <a className="urge-lovable__support-link" href="https://findahelpline.com" target="_blank" rel="noreferrer">Need immediate support? <ExternalLink aria-hidden="true" /></a>
      </div>
    </Shell>
  );
}

export default function UrgeSurfExperience({ answers, sessionId, onExit, onComplete }) {
  // A shared distress baseline must never answer the different urge question.
  const initialSession = useMemo(() => restoreUrgeRuntime(window.history.state?.urgeSurfRuntime, sessionId) || createUrgeSession(), [sessionId]);
  const [state, send] = useReducer(reduceUrgeSession, initialSession);
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

  if (state.currentRoute === "urge.body") return <BodyStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.anchor") return <AnchorStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.timer") return <TimerStage session={state} dispatch={send} audioEnabled={audioEnabled} runtimeAvailable={runtimeAvailable} />;
  if (state.currentRoute === "urge.postRating") return <PostRatingStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.complete") return <CompleteStage session={state} dispatch={send} onExit={exit} onFinish={finish} audioEnabled={audioEnabled} />;
  return <NameStage session={state} dispatch={send} onExit={exit} audioEnabled={audioEnabled} />;
}
