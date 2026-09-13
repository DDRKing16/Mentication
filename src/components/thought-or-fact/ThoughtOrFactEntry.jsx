import React from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mic, Scale, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

function EntryHeader({ backLabel = "Go back", onBack }) {
  const navigate = useNavigate();

  return (
    <header className="tof-entry__header">
      <button type="button" onClick={onBack} aria-label={backLabel} className="tof-entry__icon">
        <ArrowLeft />
      </button>
      <p>Thought or Fact?</p>
      <button type="button" onClick={() => navigate("/")} aria-label="Exit Thought or Fact" className="tof-entry__icon">
        <X />
      </button>
    </header>
  );
}

function EntryProgress() {
  return (
    <div className="tof-entry__progress" aria-label="Stage 1 of 8">
      {Array.from({ length: 8 }, (_, index) => (
        <span key={index} className={index === 0 ? "is-active" : ""} />
      ))}
    </div>
  );
}

function ReadinessScreen({ answers, onReady }) {
  const navigate = useNavigate();
  const launch = (pathway, direction, timeMin) => navigate("/reset", {
    state: {
      prebuilt: true,
      pathway: [pathway],
      direction,
      intensity: answers.intensity ?? 5,
      timeMin,
      audio: answers.audio,
    },
  });

  return (
    <div className="tof-readiness">
      <EntryHeader onBack={() => navigate(-1)} />
      <main className="tof-readiness__main">
        <div>
          <p className="tof-readiness__eyebrow">A quiet examination</p>
          <h1>Hold the thought up to the light.</h1>
          <p>Separate what happened from what your mind added.</p>
        </div>
        <details>
          <summary>This is for an everyday upsetting thought.</summary>
          <p>If you’re in immediate danger, dealing with abuse or trauma, or need urgent medical or legal help, choose support instead.</p>
        </details>
        <div className="tof-readiness__actions">
          <button type="button" onClick={onReady} className="tof-entry__primary">
            Begin <ArrowRight />
          </button>
          <button type="button" className="tof-entry__ground" onClick={() => launch("grounding54321V2", "ground", 5)}>
            Ground first
          </button>
          <button type="button" className="tof-entry__ground" onClick={() => launch("nextAction", "focus", 3)}>
            Take a practical step
          </button>
        </div>
      </main>
    </div>
  );
}

function VoiceScreen({ voiceState, voiceSeconds, onStopVoice, onReturnToWriting }) {
  const isListening = voiceState === "listening";
  const elapsed = `${String(Math.floor(voiceSeconds / 60)).padStart(2, "0")}:${String(voiceSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="tof-voice" data-state={voiceState}>
      <EntryHeader backLabel="Return to writing" onBack={onReturnToWriting} />
      <EntryProgress />
      <main className="tof-voice__main">
        <div className="tof-voice__intro">
          <p>Voice capture</p>
          <h1>{isListening ? "I’m listening." : voiceState === "unavailable" ? "Voice capture isn’t available." : "Recording paused."}</h1>
          <span>{isListening ? "Say the thought exactly as it appears." : voiceState === "unavailable" ? "You can continue by writing it instead." : "Your typed thought is still here."}</span>
        </div>
        <section className="tof-voice__panel" aria-live="polite">
          <div className="tof-voice__pulse"><Mic aria-hidden="true" /></div>
          <div className="tof-voice__wave" aria-hidden="true">
            {Array.from({ length: 17 }, (_, index) => <span key={index} style={{ animationDelay: index * -0.08 + "s" }} />)}
          </div>
          <time dateTime={`PT${voiceSeconds}S`}>{elapsed}</time>
          {isListening
            ? <button type="button" onClick={onStopVoice} className="tof-voice__stop"><span aria-hidden="true" />Stop recording</button>
            : <p className="tof-voice__status">{voiceState === "unavailable" ? "Microphone permission was not granted." : "No recording has been kept."}</p>}
        </section>
        <p className="tof-voice__privacy"><LockKeyhole aria-hidden="true" /> Audio is not saved</p>
        <div className="tof-voice__actions">
          <button type="button" disabled className="tof-entry__primary">Use recording</button>
          <button type="button" onClick={onReturnToWriting} className="tof-entry__ground">Cancel</button>
        </div>
      </main>
    </div>
  );
}

function ThoughtEntryScreen({ answers, thought, onThoughtChange, onStartVoice, onBegin }) {
  const navigate = useNavigate();

  return (
    <div className="tof-entry">
      <EntryHeader onBack={() => navigate(-1)} />
      <EntryProgress />
      <main className="tof-entry__main">
        <div className="tof-entry__intro">
          <h1>What thought are you putting on trial?</h1>
          <p>Write it as it appears in your mind.</p>
        </div>
        <section className="tof-entry__folder">
          <div className="tof-entry__tab"><Scale aria-hidden="true" /></div>
          <label className="tof-entry__field">
            <textarea
              value={thought}
              onChange={(event) => onThoughtChange(event.target.value)}
              maxLength={360}
              placeholder="For example: I made a mistake."
              aria-label="The thought you want to examine"
            />
            <button type="button" aria-label="Start voice entry" className="tof-entry__mic" onClick={onStartVoice}>
              <Mic />
            </button>
          </label>
          <p><LockKeyhole aria-hidden="true" /> Private on this device</p>
        </section>
        <div className="tof-entry__actions">
          <button type="button" disabled={thought.trim().length < 3} onClick={onBegin} className="tof-entry__primary">
            Open case
          </button>
          <button
            type="button"
            onClick={() => navigate("/reset", {
              state: {
                prebuilt: true,
                pathway: ["grounding54321V2"],
                direction: "ground",
                intensity: answers.intensity ?? 5,
                timeMin: 5,
                audio: answers.audio,
              },
            })}
            className="tof-entry__ground"
          >
            Ground first
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ThoughtOrFactEntry({
  answers,
  ready,
  thought,
  voiceSeconds,
  voiceState,
  onBegin,
  onReady,
  onReturnToWriting,
  onStartVoice,
  onStopVoice,
  onThoughtChange,
}) {
  if (!ready) return <ReadinessScreen answers={answers} onReady={onReady} />;
  if (voiceState !== "idle") {
    return (
      <VoiceScreen
        voiceState={voiceState}
        voiceSeconds={voiceSeconds}
        onStopVoice={onStopVoice}
        onReturnToWriting={onReturnToWriting}
      />
    );
  }
  return (
    <ThoughtEntryScreen
      answers={answers}
      thought={thought}
      onThoughtChange={onThoughtChange}
      onStartVoice={onStartVoice}
      onBegin={onBegin}
    />
  );
}
