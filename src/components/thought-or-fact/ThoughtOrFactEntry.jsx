import React from "react";
import { ArrowLeft, LockKeyhole, Mic, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "@/styles/thought-or-fact.css";

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

function VoiceScreen({ voiceState, voiceSeconds, onStopVoice, onReturnToWriting }) {
  const isListening = voiceState === "listening";
  const elapsed = `${String(Math.floor(voiceSeconds / 60)).padStart(2, "0")}:${String(voiceSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="tof-entry-root tof-voice" data-state={voiceState}>
      <EntryHeader backLabel="Return to writing" onBack={onReturnToWriting} />
      <main className="tof-experience">
        <div className="tof-stage">
          <div className="tof-heading">
            <p>Voice</p>
            <h1>{isListening ? "I’m listening." : voiceState === "unavailable" ? "Voice isn’t available." : "Recording paused."}</h1>
            <span className="tof-sub">{isListening ? "Say the thought exactly as it appears." : voiceState === "unavailable" ? "You can continue by writing it instead." : "Your typed thought is still here."}</span>
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
          <p className="tof-note"><LockKeyhole aria-hidden="true" /> Audio is not saved</p>
          <div className="tof-actions">
            <button type="button" disabled className="tof-button">Use recording</button>
            <button type="button" onClick={onReturnToWriting} className="tof-text-action">Cancel</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ThoughtEntryScreen({ answers, thought, onThoughtChange, onStartVoice, onBegin }) {
  const navigate = useNavigate();
  const launch = (pathway, direction, timeMin) => navigate("/reset", {
    state: { prebuilt: true, pathway: [pathway], direction, intensity: answers.intensity ?? 5, timeMin, audio: answers.audio },
  });

  return (
    <div className="tof-entry-root">
      <EntryHeader onBack={() => navigate(-1)} />
      <main className="tof-experience">
        <div className="tof-stage">
          <div className="tof-heading">
            <h1>What’s the thought?</h1>
            <span className="tof-sub">Tap a close example, use voice, or write it in your own words.</span>
          </div>
          <div className="tof-chips" aria-label="Suggested thoughts">
            {["I made a mistake.", "Something is going to go wrong.", "They probably think badly of me.", "I should be handling this better."].map((suggestion) => (
              <button key={suggestion} type="button" className="tof-pill" aria-pressed={thought === suggestion} onClick={() => onThoughtChange(suggestion)}>{suggestion}</button>
            ))}
          </div>
          <div className="tof-field-wrap">
            <textarea
              className="tof-field"
              value={thought}
              onChange={(event) => onThoughtChange(event.target.value)}
              maxLength={360}
              rows={5}
              placeholder="For example: I made a mistake."
              aria-label="The thought you want to examine"
            />
            <button type="button" aria-label="Start voice entry" className="tof-mic" onClick={onStartVoice}>
              <Mic />
            </button>
          </div>
          <p className="tof-note"><LockKeyhole aria-hidden="true" /> Private on this device</p>
          <div className="tof-actions">
            <button type="button" disabled={thought.trim().length < 3} onClick={onBegin} className="tof-button">
              Continue
            </button>
            <button type="button" className="tof-text-action" onClick={() => launch("grounding54321V2", "ground", 5)}>
              Ground first
            </button>
            <button type="button" className="tof-text-action" onClick={() => launch("nextAction", "focus", 3)}>
              Take a practical step
            </button>
          </div>
          <details className="tof-details">
            <summary>Is this a good time for this?</summary>
            <p>This is for an everyday upsetting thought. If you’re in immediate danger, dealing with abuse or trauma, or need urgent medical or legal help, choose support instead.</p>
          </details>
        </div>
      </main>
    </div>
  );
}

export default function ThoughtOrFactEntry({
  answers,
  thought,
  voiceSeconds,
  voiceState,
  onBegin,
  onReturnToWriting,
  onStartVoice,
  onStopVoice,
  onThoughtChange,
}) {
  // One screen to start: no separate readiness page before the writing page.
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
