import { useFlowNav } from "@/components/brand/InterventionNav";
import { useEffect, useMemo, useReducer, useState } from "react";
import { Check, ChevronLeft, ExternalLink, Pause, Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UrgeWave from "@/components/UrgeWave";
import { useGuideVoice } from "@/hooks/useGuideVoice";
import { useUrgeSurfSoundscape } from "@/hooks/useUrgeSurfSoundscape";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { URGE_SURF_NARRATION } from "@/lib/urgeSurfNarration";
import { createUrgeSession, reduceUrgeSession, URGE_SURF_DEFAULTS } from "@/lib/urgeSurfSession";
import { buildUrgeSurfLearningRecord } from "@/lib/urgeSurfState";
import { getBrandCoral } from "@/lib/interventionBrand";

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

const PRACTICE_STAGES = [
  { label: "Notice", title: "Meet the wave", copy: "Notice the first pull in your body. Name its shape without needing it to change.", spoken: URGE_SURF_NARRATION.stages[0] },
  { label: "Allow", title: "Make room", copy: "Let the feeling gather. Soften around it instead of pushing it away.", spoken: URGE_SURF_NARRATION.stages[1] },
  { label: "Rise", title: "Ride the lift", copy: "As it builds, breathe into the edges. You can feel this without following it.", spoken: URGE_SURF_NARRATION.stages[2] },
  { label: "Crest", title: "Stay at the crest", copy: "This is the peak—not forever. Stay on top of one slow, steady breath.", spoken: URGE_SURF_NARRATION.stages[3] },
  { label: "Soften", title: "Feel it break", copy: "Notice the force beginning to fold. Let your jaw, shoulders, and hands release.", spoken: URGE_SURF_NARRATION.stages[4] },
  { label: "Pass", title: "Watch it pass", copy: "Follow the last movement as it washes through and moves beyond you.", spoken: URGE_SURF_NARRATION.stages[5] },
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
      </section>
    </main>
  );
}

function WaveOrb({ intensity, breathing = false }) {
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
      <div className="urge-lovable__orb-value"><strong>{intensity}</strong><span>intensity</span></div>
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
  const intensity = session.initialIntensity ?? 7;
  const ready = Number.isInteger(session.initialIntensity);
  useUrgeNarration(URGE_SURF_NARRATION.name, audioEnabled);
  return (
    <Shell onBack={goBack} backLabel="Back" trailing={<button type="button" className="urge-lovable__exit" onClick={onExit}>Exit</button>}>
      <div className="urge-lovable__screen">
        <div className="urge-lovable__intro">
          <p className="urge-lovable__eyebrow">Urge surfing</p>
          <p className="urge-lovable__reframe">You don’t have to fight this feeling.</p>
          <h1>How strong is the urge?</h1>
          <p>No need to change it. Just notice what’s here.</p>
        </div>
        <div className="urge-lovable__orb-wrap"><WaveOrb intensity={intensity} /></div>
        <label className="sr-only" htmlFor="urge-intensity">How strong is the urge?</label>
        <input
          id="urge-intensity"
          className="urge-lovable__slider"
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(event) => dispatch({ type: "INITIAL_INTENSITY_SET", value: Number(event.target.value) })}
        />
        <PrimaryButton disabled={!ready} onClick={() => dispatch({ type: "NAVIGATE", route: "urge.body" })}>
          {ready ? "Continue" : "Move the scale to continue"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

function BodyStage({ session, dispatch, audioEnabled }) {
  const region = session.bodyRegionKey;
  const sensation = session.sensationKeys[0] || null;
  const ready = Boolean(region && sensation);
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
        <div className="urge-lovable__subheading urge-lovable__body-section-title"><p className="urge-lovable__eyebrow">Give it texture</p><h2>What does it feel like?</h2></div>
        <fieldset className="urge-lovable__sensation-grid">
          <legend className="sr-only">Sensation</legend>
          {SENSATIONS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={sensation === key} className={sensation === key ? "is-selected" : ""} onClick={() => dispatch({ type: "SENSATION_TOGGLED", key })}>
              {sensation === key && <Check aria-hidden="true" />} {label}
            </button>
          ))}
        </fieldset>
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
        <p className="urge-lovable__reassurance">You can ride any wave. You don’t have to act on it.</p>
      </div>
    </Shell>
  );
}

function formatDuration(totalSeconds) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function TimerStage({ session, dispatch, audioEnabled }) {
  const [now, setNow] = useState(Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
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
  useUrgeSurfSoundscape({ active: true, enabled: audioEnabled, narrationActive, stageIndex });

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!paused) setNow(Date.now());
    }, 250);
    return () => window.clearInterval(interval);
  }, [paused]);

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
          <p>{BODY_AREAS.find(([key]) => key === session.bodyRegionKey)?.[1]} · {SENSATIONS.find(([key]) => key === session.sensationKeys[0])?.[1]}</p>
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
          <div className="urge-lovable__overlay" role="dialog" aria-modal="true" aria-labelledby="urge-end-title">
            <section>
              <h2 id="urge-end-title">Leave the wave?</h2>
              <p>You can stop whenever you need to. The time you have already made still counts.</p>
              <PrimaryButton onClick={() => { setConfirmExit(false); setNow(Date.now()); dispatch({ type: "TIMER_RESUMED", nowEpochMs: Date.now() }); resumeNarration(); }}>Keep surfing</PrimaryButton>
              <button type="button" className="urge-lovable__text-button" onClick={() => dispatch({ type: "TIMER_STOPPED", nowEpochMs: Date.now() })}>End gently</button>
            </section>
          </div>
        )}
      </div>
    </Shell>
  );
}

function PostRatingStage({ session, dispatch, audioEnabled }) {
  const [afterIntensity, setAfterIntensity] = useState(session.initialIntensity ?? 5);
  const [intensityTouched, setIntensityTouched] = useState(false);
  const [choiceOutcome, setChoiceOutcome] = useState(null);
  const ready = intensityTouched && choiceOutcome !== null;
  useUrgeNarration(URGE_SURF_NARRATION.postRating, audioEnabled);
  const complete = () => {
    dispatch({ type: "POST_INTENSITY_SELECTED", value: afterIntensity });
    dispatch({ type: "CHOICE_OUTCOME_SET", value: choiceOutcome });
  };
  return (
    <Shell step={5}>
      <div className="urge-lovable__screen">
        <div className="urge-lovable__heading">
          <p className="urge-lovable__eyebrow">Notice the shift</p>
          <h1>Where is the wave now?</h1>
          <p>It may be softer, stronger, or simply different. Every answer is okay.</p>
        </div>
        <div className="urge-lovable__orb-wrap"><WaveOrb intensity={afterIntensity} breathing /></div>
        <input
          aria-label="Current urge intensity"
          className="urge-lovable__slider"
          type="range"
          min="1"
          max="10"
          value={afterIntensity}
          onChange={(event) => { setAfterIntensity(Number(event.target.value)); setIntensityTouched(true); }}
        />
        <fieldset className="urge-lovable__outcomes">
          <legend>Did the pause give you more room to choose?</legend>
          {[["a_little", "Yes, some room"], ["not_yet", "Not yet"]].map(([value, label]) => (
            <button type="button" key={value} className={choiceOutcome === value ? "is-selected" : ""} aria-pressed={choiceOutcome === value} onClick={() => setChoiceOutcome(value)}>{label}</button>
          ))}
        </fieldset>
        <PrimaryButton disabled={!ready} onClick={complete}>{ready ? "Complete practice" : "Move the scale and choose"}</PrimaryButton>
        <button type="button" className="urge-lovable__text-button" onClick={() => dispatch({ type: "CHOICE_OUTCOME_SET", value: null })}>I’d rather not say</button>
      </div>
    </Shell>
  );
}

function CompleteStage({ session, dispatch, onExit, onFinish, audioEnabled }) {
  const { goBack } = useFlowNav();
  const navigate = useNavigate();
  const totalSeconds = Math.round((session.timer.totalElapsedMs || session.timer.segmentDurationMs) / 1000);
  useUrgeNarration(URGE_SURF_NARRATION.complete, audioEnabled);
  return (
    <Shell onBack={goBack} backLabel="Back" trailing={<button type="button" className="urge-lovable__exit" onClick={onExit}>Exit</button>}>
      <div className="urge-lovable__screen urge-lovable__complete">
        <div className="urge-lovable__complete-mark"><Check aria-hidden="true" /></div>
        <p className="urge-lovable__eyebrow">Wave passed</p>
        <h1>You made space between feeling and action.</h1>
        <p>The urge moved from <strong>{session.initialIntensity}</strong> to <strong>{session.postIntensity ?? "—"}</strong>. Whatever the number, you stayed present.</p>
        <div className="urge-lovable__time-rule"><span />{formatDuration(totalSeconds)} with the wave<span /></div>
        <label className="urge-lovable__save">
          <input type="checkbox" checked={session.savePreference} onChange={(event) => dispatch({ type: "SAVE_PREFERENCE_SET", value: event.target.checked })} />
          <span><strong>Save a small local learning record</strong><small>No anchor words, body locations, or voice content are included.</small></span>
        </label>
        <div className="urge-lovable__finish-actions">
          <PrimaryButton onClick={() => onFinish("wait")}>Return home</PrimaryButton>
          <button type="button" onClick={() => dispatch({ type: "EXTEND_TIMER" })}>Wait 10 more minutes</button>
          <button type="button" onClick={() => onFinish("leave")}>Leave the trigger</button>
          <button type="button" onClick={() => onFinish("substitute")}>Choose a substitute</button>
          <button type="button" onClick={() => { dispatch({ type: "COMPLETION_ROUTE_SELECTED", route: "support" }); navigate("/support"); }}>Reach out for support</button>
        </div>
        <a className="urge-lovable__support-link" href="https://findahelpline.com" target="_blank" rel="noreferrer">Need immediate support? <ExternalLink aria-hidden="true" /></a>
      </div>
    </Shell>
  );
}

export default function UrgeSurfExperience({ answers, onExit, onComplete }) {
  const initialSession = useMemo(() => {
    const initial = createUrgeSession();
    return Number.isInteger(answers?.intensity) && answers.intensity >= 1 && answers.intensity <= 10
      ? reduceUrgeSession(initial, { type: "INITIAL_INTENSITY_SET", value: answers.intensity })
      : initial;
  }, [answers?.intensity]);
  const [state, send] = useReducer(reduceUrgeSession, initialSession);
  const audioEnabled = !answers?.noAudio && answers?.audio === "yes";

  const finish = (action) => {
    const outcome = state.savePreference ? buildUrgeSurfLearningRecord({
      categoryKey: state.categoryKeys[0],
      windowSeconds: state.timer.segmentDurationMs / 1000,
      intensityBefore: state.initialIntensity,
      intensityNow: state.postIntensity,
      action,
      choiceOutcome: state.choiceOutcome,
    }) : undefined;
    onComplete?.({ skipReflection: true, outcome });
  };

  if (state.currentRoute === "urge.body") return <BodyStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.anchor") return <AnchorStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.timer") return <TimerStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.postRating") return <PostRatingStage session={state} dispatch={send} audioEnabled={audioEnabled} />;
  if (state.currentRoute === "urge.complete") return <CompleteStage session={state} dispatch={send} onExit={onExit} onFinish={finish} audioEnabled={audioEnabled} />;
  return <NameStage session={state} dispatch={send} onExit={onExit} audioEnabled={audioEnabled} />;
}
