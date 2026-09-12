import { useEffect, useMemo, useReducer, useState } from "react";
import { createUrgeSession, reduceUrgeSession, URGE_SURF_DEFAULTS } from "@/lib/urgeSurfSession";
import { buildUrgeSurfLearningRecord } from "@/lib/urgeSurfState";
import "@/styles/urge-surfing.css";

const ASSET_ROOT = "/media/interventions/urge-surfing/assets";
const CATEGORIES = [["send", "Send it", "ICONS__icon-send.png"], ["check", "Check", "ICONS__icon-check.png"], ["use", "Use", "ICONS__icon-use.png"], ["snap", "Snap", "ICONS__icon-snap.png"], ["avoid", "Avoid", "ICONS__icon-avoid.png"]];
const SENSATIONS = [["hot", "Hot", "ICONS__icon-hot.png"], ["tight", "Tight", "ICONS__icon-tight.png"], ["buzzing", "Buzzing", "ICONS__icon-buzzing.png"], ["restless", "Restless", "ICONS__icon-restless.png"]];
const BODY_REGIONS = [["head_face", "Head or face", "7%", "35%", "30%", "26%"], ["throat_neck", "Throat or neck", "26%", "39%", "16%", "22%"], ["shoulders", "Shoulders", "32%", "20%", "19%", "60%"], ["chest", "Chest", "16%", "33%", "18%", "34%"], ["upper_abdomen", "Upper abdomen", "49%", "36%", "18%", "30%"], ["lower_abdomen", "Lower abdomen", "59%", "36%", "18%", "26%"], ["pelvis", "Pelvis", "68%", "37%", "18%", "24%"], ["arms_hands", "Arms or hands", "39%", "8%", "45%", "84%"], ["legs_feet", "Legs or feet", "71%", "26%", "27%", "48%"], ["whole_body", "Whole body", "4%", "12%", "92%", "76%"]];

function Icon({ file }) { return <img src={`${ASSET_ROOT}/${file}`} alt="" aria-hidden="true" />; }

function Header({ backLabel, onBack, onExit }) {
  return <header className="urge-surf__header"><button className="urge-surf__icon-button" type="button" aria-label={backLabel} onClick={onBack}><Icon file="ICONS__icon-back.png" /></button><button className="urge-surf__exit" type="button" onClick={onExit}>Exit</button></header>;
}

function NameHeader({ onBack, step = 1, backLabel = "Back to the intervention library" }) {
  return <header className="urge-surf__name-header"><button className="urge-surf__name-back" type="button" aria-label={backLabel} onClick={onBack}><Icon file="ICONS__icon-back.png" /></button><p aria-label={`Step ${step} of 5`}>{step} of 5</p></header>;
}

function AnchorHeader({ onBack }) {
  return <header className="urge-surf__anchor-header"><button className="urge-surf__name-back" type="button" aria-label="Back to Find the pull" onClick={onBack}><Icon file="ICONS__icon-back.png" /></button><img className="urge-surf__anchor-wordmark" src={`${ASSET_ROOT}/BRAND__anchor-wordmark-reference.png`} alt="Mentication" /><p aria-label="Step 3 of 5">3 of 5</p></header>;
}

function CrestHeader({ onBack }) {
  return <header className="urge-surf__crest-header"><button type="button" aria-label="End the choice window early" onClick={onBack}><Icon file="ICONS__icon-back.png" /></button><img src={`${ASSET_ROOT}/BRAND__ride-crest-wordmark-reference.png`} alt="Mentication" /><p aria-label="Step 4 of 5">4 of 5</p></header>;
}

function Progress({ step }) { return <div className="urge-surf__progress" aria-label={`Step ${step} of 5`}>{Array.from({ length: 5 }, (_, index) => <i className={index + 1 === step ? "is-active" : ""} key={index} />)}</div>; }

function Waveform({ intensity }) { return <div className="urge-surf__waveform" aria-hidden="true">{Array.from({ length: 31 }, (_, index) => <i key={index} style={{ "--wave-height": `${18 + ((index * 17 + (intensity || 5) * 11) % 64)}%` }} />)}</div>; }

function CircularWave() {
  return <div className="urge-surf__circular-wave" aria-hidden="true"><img className="urge-surf__reference-wave" src={`${ASSET_ROOT}/WAVE_SYSTEM__name-wave-reference.png`} alt="" /><i className="urge-surf__reference-wave-mask" /></div>;
}

function NameStage({ session, dispatch, onExit }) {
  const intensity = session.initialIntensity;
  const category = session.categoryKeys[0] || null;
  const ready = Number.isInteger(intensity) && Boolean(category);
  return <main className="urge-surf urge-surf--cream" aria-labelledby="urge-screen-title"><NameHeader onBack={onExit} /><section className="urge-surf__stage urge-surf__name-stage"><h1 id="urge-screen-title">Name the wave</h1><p className="urge-surf__prompt">What’s the urge calling for right now?</p><div className="urge-surf__intensity" aria-live="polite"><CircularWave intensity={intensity ?? 1} /><p className="urge-surf__value">{intensity ?? "–"}<span>/10</span></p><p className="urge-surf__value-label">Intensity</p></div><div className="urge-surf__intensity-scale" role="radiogroup" aria-label="Initial urge intensity, from 1 to 10">{Array.from({ length: 10 }, (_, index) => { const value = index + 1; const selected = intensity === value; return <button key={value} type="button" role="radio" aria-checked={selected} aria-label={`${value} out of 10`} className={selected ? "is-selected" : ""} onClick={() => dispatch({ type: "INITIAL_INTENSITY_SET", value })}><i aria-hidden="true" /><span>{value}</span></button>; })}</div><p className="urge-surf__voice-label">Say it out loud</p><button className="urge-surf__mic" type="button" aria-label="Use voice entry" onClick={() => dispatch({ type: "VOICE_OPENED" })}><Icon file="ICONS__icon-microphone.png" /></button><p className="urge-surf__or">or choose</p><fieldset className="urge-surf__categories"><legend className="sr-only">Choose the urge category</legend>{CATEGORIES.map(([key, label, icon]) => <button key={key} type="button" className={category === key ? "is-selected" : ""} aria-pressed={category === key} onClick={() => dispatch({ type: "CATEGORY_TOGGLED", key })}><Icon file={icon} /><span>{label}</span></button>)}</fieldset><button className="urge-surf__primary" type="button" disabled={!ready} onClick={() => dispatch({ type: "NAVIGATE", route: "urge.body" })}>Continue <Icon file="ICONS__icon-chevron.png" /></button></section></main>;
}

function VoiceStage({ dispatch }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRecording) return undefined;
    const interval = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);
  const cancel = () => dispatch({ type: "VOICE_CANCELLED" });
  return <main className="urge-surf urge-surf--cream" aria-labelledby="urge-screen-title"><header className="urge-surf__name-header"><button className="urge-surf__name-back" type="button" aria-label="Return to Name the wave" onClick={cancel}><Icon file="ICONS__icon-back.png" /></button><p>1 of 5</p></header><section className="urge-surf__stage urge-surf__voice-stage"><p className="urge-surf__voice-eyebrow">Name the wave</p><h1 id="urge-screen-title">Say it out loud</h1><p className="urge-surf__prompt">Your words stay on this screen. Choose a category when you return.</p><div className={`urge-surf__voice-orb ${isRecording ? "is-recording" : ""}`} aria-live="polite"><Waveform intensity={isRecording ? 8 : 2} /><span>{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</span><small>{isRecording ? "Listening" : "Ready when you are"}</small></div><p className="urge-surf__voice-privacy">Speech-to-text is not connected yet, so no audio is recorded or sent anywhere.</p><button className="urge-surf__voice-action" type="button" onClick={() => setIsRecording((value) => !value)}>{isRecording ? "Stop listening" : "Start speaking"}<Icon file={isRecording ? "ICONS__icon-stop.png" : "ICONS__icon-microphone.png"} /></button><button className="urge-surf__voice-cancel" type="button" onClick={cancel}>Continue manually</button></section></main>;
}

function RegionList({ selected, onSelect, onClose }) {
  return <div className="urge-surf__region-overlay" role="dialog" aria-modal="true" aria-labelledby="urge-region-title"><section><button className="urge-surf__region-close" type="button" aria-label="Close location list" onClick={onClose}><Icon file="ICONS__icon-close.png" /></button><p className="urge-surf__safety-kicker">Find the pull</p><h2 id="urge-region-title">Choose from a list</h2><div className="urge-surf__region-list">{BODY_REGIONS.map(([key, label]) => <button type="button" className={selected === key ? "is-selected" : ""} aria-pressed={selected === key} onClick={() => { onSelect(key); onClose(); }} key={key}>{label}</button>)}</div></section></div>;
}

function BodyStage({ session, dispatch, onExit }) {
  const [listOpen, setListOpen] = useState(false);
  const region = session.bodyRegionKey;
  const sensation = session.sensationKeys[0] || null;
  const ready = Boolean(region && sensation);
  const regionLabel = BODY_REGIONS.find(([key]) => key === region)?.[1];
  return <main className="urge-surf urge-surf--cream" aria-labelledby="urge-screen-title"><NameHeader step={2} backLabel="Back to Name the wave" onBack={() => dispatch({ type: "NAVIGATE_BACK" })} /><section className="urge-surf__stage urge-surf__body-stage"><h1 id="urge-screen-title">Find the pull</h1><p className="urge-surf__prompt">Where do you feel it most?</p><div className="urge-surf__body-map"><img src={`${ASSET_ROOT}/BODY_MAP__human-outline-reference.png`} alt="A neutral human body outline. Choose a location from the controls below." />{region && <img className="urge-surf__body-overlay" src={`${ASSET_ROOT}/BODY_MAP__region-${region}.png`} alt="" aria-hidden="true" />}{regionLabel && <span className="urge-surf__selected-region" aria-live="polite">{regionLabel}</span>}{BODY_REGIONS.map(([key, label, top, left, height, width]) => <button type="button" className={`urge-surf__body-hotspot ${region === key ? "is-selected" : ""}`} aria-pressed={region === key} aria-label={`Select ${label}`} style={{ top, left, height, width }} onClick={() => dispatch({ type: "BODY_REGION_SET", key })} key={key}><span className="sr-only">{label}</span></button>)}</div><button className="urge-surf__region-list-trigger sr-only" type="button" onClick={() => setListOpen(true)}>Choose from a list</button><p className="urge-surf__body-question">What does it feel like?</p><fieldset className="urge-surf__sensations"><legend className="sr-only">Choose one sensation</legend>{SENSATIONS.map(([key, label, icon]) => <button type="button" className={sensation === key ? "is-selected" : ""} aria-pressed={sensation === key} onClick={() => dispatch({ type: "SENSATION_TOGGLED", key })} key={key}><Icon file={icon} />{label}</button>)}</fieldset><p className="urge-surf__hint">You can change this anytime.</p><button className="urge-surf__primary" disabled={!ready} type="button" onClick={() => dispatch({ type: "NAVIGATE", route: "urge.anchor" })}>Continue <Icon file="ICONS__icon-chevron.png" /></button></section>{listOpen && <RegionList selected={region} onSelect={(key) => dispatch({ type: "BODY_REGION_SET", key })} onClose={() => setListOpen(false)} />}</main>;
}

function AnchorStage({ session, dispatch, onExit }) {
  const duration = Math.round(session.timer.segmentDurationMs / 1000);
  const atMinimum = duration === URGE_SURF_DEFAULTS.durations[0];
  const atMaximum = duration === URGE_SURF_DEFAULTS.durations.at(-1);
  const canStart = Boolean(session.anchorText.trim());
  return <main className="urge-surf urge-surf--cream" aria-labelledby="urge-screen-title"><AnchorHeader onBack={() => dispatch({ type: "NAVIGATE_BACK" })} /><section className="urge-surf__stage urge-surf__anchor-stage"><h1 id="urge-screen-title">Set your anchor</h1><p className="urge-surf__prompt">What are you protecting by waiting?</p><label className="urge-surf__anchor"><span className="sr-only">Your anchor</span><input value={session.anchorText} onChange={(event) => dispatch({ type: "ANCHOR_CHANGED", value: event.target.value })} placeholder="Tomorrow morning" maxLength={120} /><span className="urge-surf__anchor-close" aria-hidden="true">×</span></label><p className="urge-surf__choose-window">Choose your choice window</p><div className="urge-surf__duration"><button type="button" aria-label="Shorten choice window" disabled={atMinimum} onClick={() => dispatch({ type: "DURATION_CHANGED", durationMs: (duration - 30) * 1000 })}><Icon file="ICONS__icon-decrement.png" /></button><div className="urge-surf__duration-dial"><img src={`${ASSET_ROOT}/DURATION_DIAL__duration-dial-${duration}s.png`} alt={`${duration} second choice window`} /></div><button type="button" aria-label="Lengthen choice window" disabled={atMaximum} onClick={() => dispatch({ type: "DURATION_CHANGED", durationMs: (duration + 30) * 1000 })}><Icon file="ICONS__icon-increment.png" /></button></div><button className="urge-surf__why-window" type="button"><Icon file="ICONS__icon-information.png" />Why {duration} seconds?<span aria-hidden="true">›</span></button><button className="urge-surf__primary urge-surf__start-window" disabled={!canStart} type="button" onClick={() => dispatch({ type: "TIMER_STARTED" })}>Start my window <Icon file="ICONS__icon-chevron.png" /></button><p className="urge-surf__anchor-reassurance">You can ride any wave. You don’t have to act on it.</p></section></main>;
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function TideLine() {
  return <div className="urge-surf__tide-line" aria-hidden="true"><svg viewBox="0 0 360 62" preserveAspectRatio="none"><path d="M2 36C38 36 44 20 72 20s37 26 66 26c35 0 43-49 76-49 32 0 42 43 74 43 25 0 38-10 70-10" /><circle cx="181" cy="1" r="4.5" /></svg></div>;
}

function TimerStage({ session, dispatch }) {
  const [now, setNow] = useState(Date.now());
  const endsAt = session.timer.segmentEndsAtEpochMs;
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const finalSeconds = secondsLeft <= 10;
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (secondsLeft === 0) dispatch({ type: "TIMER_ELAPSED", nowEpochMs: now });
  }, [dispatch, now, secondsLeft]);
  return <main className={`urge-surf urge-surf__timer-screen ${finalSeconds ? "is-final-seconds" : ""}`} aria-labelledby="urge-screen-title"><CrestHeader onBack={() => dispatch({ type: "TIMER_STOPPED" })} /><section className="urge-surf__timer-stage"><div className="urge-surf__immersive-ocean" aria-hidden="true" /><h1 id="urge-screen-title">Ride the crest</h1><p className="urge-surf__countdown" aria-live="polite" aria-atomic="true">{formatDuration(secondsLeft)}</p><div className="urge-surf__timer-visual"><div className="urge-surf__timer-intensity" aria-label={`Starting intensity ${session.initialIntensity} out of 10`}><strong>{session.initialIntensity}<small>/10</small></strong></div></div><TideLine /><p className="urge-surf__timer-guidance">Ride it like a wave. It rises. It peaks. It falls.</p><button className="urge-surf__haptic-status" type="button" aria-label="Haptics pattern, six pulses active"><span>Haptics</span><i aria-hidden="true" />{Array.from({ length: 8 }, (_, index) => <b className={index < 6 ? "is-active" : ""} aria-hidden="true" key={index} />)}</button><button className="urge-surf__timer-stop" type="button" onClick={() => dispatch({ type: "TIMER_STOPPED" })}>End early</button></section></main>;
}

function PostRatingStage({ dispatch, onExit }) {
  return <main className="urge-surf" aria-labelledby="urge-screen-title"><Header backLabel="Leave Urge Surfing" onBack={onExit} onExit={onExit} /><section className="urge-surf__stage urge-surf__post-rating-stage"><Progress step={5} /><h1 id="urge-screen-title">Your choice window</h1><p className="urge-surf__prompt">Did the pause give you any more room to choose?</p><div className="urge-surf__choice-outcomes"><button type="button" onClick={() => dispatch({ type: "CHOICE_OUTCOME_SET", value: "a_little" })}>Yes, some room</button><button type="button" onClick={() => dispatch({ type: "CHOICE_OUTCOME_SET", value: "not_yet" })}>Not yet</button><button type="button" onClick={() => dispatch({ type: "CHOICE_OUTCOME_SET", value: null })}>I’d rather not say</button></div><p className="urge-surf__rating-note">There is no right outcome here. The urge does not have to be gone for this pause to count.</p></section></main>;
}

function CompleteStage({ session, dispatch, onExit, onFinish }) {
  const totalSeconds = Math.round((session.timer.totalElapsedMs || session.timer.segmentDurationMs) / 1000);
  const nowIntensity = session.postIntensity;
  return <main className="urge-surf" aria-labelledby="urge-screen-title"><Header backLabel="Leave Urge Surfing" onBack={onExit} onExit={onExit} /><section className="urge-surf__stage urge-surf__complete-stage"><Progress step={5} /><h1 id="urge-screen-title">You kept the choice</h1><p className="urge-surf__prompt">You gave yourself space.</p><div className="urge-surf__before-now"><div><span>Before</span><strong>{session.initialIntensity}<small>/10</small></strong></div><b aria-hidden="true">→</b><div><span>Now <em>optional</em></span><strong className={nowIntensity ? "is-current" : ""}>{nowIntensity ?? "–"}<small>/10</small></strong></div></div><label className="urge-surf__optional-rating"><span>How strong is it now? Optional</span><input type="range" min="1" max="10" value={nowIntensity ?? 5} onChange={(event) => dispatch({ type: "POST_INTENSITY_SELECTED", value: Number(event.target.value) })} /></label><div className="urge-surf__duration-card"><Icon file="ICONS__icon-timer.png" /><strong>{formatDuration(totalSeconds)}</strong><span>{session.timer.completionReason === "stopped" ? "pause ended early" : "not acted on"}</span></div><label className="urge-surf__save-record"><input type="checkbox" checked={session.savePreference} onChange={(event) => dispatch({ type: "SAVE_PREFERENCE_SET", value: event.target.checked })} /><span>Save a small local learning record</span><small>No anchor words, body locations, or voice content are included.</small></label><p className="urge-surf__next-title">What’s next?</p><div className="urge-surf__handoffs"><button type="button" onClick={() => dispatch({ type: "EXTEND_TIMER" })}><Icon file="ICONS__icon-timer.png" /><span><strong>Wait 10 more</strong><small>Extend your Choice Window</small></span></button><button type="button" onClick={() => onFinish("leave")}><Icon file="ICONS__icon-leave.png" /><span><strong>Leave the trigger</strong><small>Step out and reset</small></span></button><button type="button" onClick={() => { dispatch({ type: "COMPLETION_ROUTE_SELECTED", route: "support" }); onFinish("support", "/support"); }}><Icon file="ICONS__icon-reach_out.png" /><span><strong>Reach out</strong><small>Talk to someone you trust</small></span></button><button type="button" onClick={() => onFinish("substitute")}><Icon file="ICONS__icon-substitute.png" /><span><strong>Choose a substitute</strong><small>Do something that helps</small></span></button></div><p className="urge-surf__closing">You don’t have to be urge-free<br />to live on purpose.</p></section></main>;
}

export default function UrgeSurfExperience({ intervention, answers, onExit, onComplete, onAttemptEvent }) {
  const initialSession = useMemo(() => {
    const session = createUrgeSession();
    return Number.isInteger(answers?.intensity) && answers.intensity >= 1 && answers.intensity <= 10 ? reduceUrgeSession(session, { type: "INITIAL_INTENSITY_SET", value: answers.intensity }) : session;
  }, [answers?.intensity]);
  const [session, dispatch] = useReducer(reduceUrgeSession, initialSession);
  const finish = (action, redirectTo) => {
    const outcome = session.savePreference ? buildUrgeSurfLearningRecord({
      categoryKey: session.categoryKeys[0], windowSeconds: session.timer.segmentDurationMs / 1000,
      intensityBefore: session.initialIntensity, intensityNow: session.postIntensity,
      action, choiceOutcome: session.choiceOutcome,
    }) : undefined;
    onAttemptEvent?.({
      interventionId: intervention?.id || "urgeSurf",
      mechanism: intervention?.mechanism,
      action: "completed",
      completedPercentage: 1,
      timestamp: Date.now(),
    });
    onComplete?.({ skipReflection: true, outcome, postValue: session.postIntensity ?? null, redirectTo });
  };
  if (session.currentRoute === "urge.voice") return <VoiceStage dispatch={dispatch} />;
  if (session.currentRoute === "urge.body") return <BodyStage session={session} dispatch={dispatch} onExit={onExit} />;
  if (session.currentRoute === "urge.anchor") return <AnchorStage session={session} dispatch={dispatch} onExit={onExit} />;
  if (session.currentRoute === "urge.timer") return <TimerStage session={session} dispatch={dispatch} onExit={onExit} />;
  if (session.currentRoute === "urge.postRating") return <PostRatingStage dispatch={dispatch} onExit={onExit} />;
  if (session.currentRoute === "urge.complete") return <CompleteStage session={session} dispatch={dispatch} onExit={onExit} onFinish={finish} />;
  return <NameStage session={session} dispatch={dispatch} onExit={onExit} />;
}
