import React, { useEffect, useRef } from 'react';

// A selected sound is not playback. The existing audio engine starts only on Tune In.
export default function SetupFlow({ night, channels }) {
  const heading = useRef(null);
  const selected = channels.find(channel => channel.id === night.channel) || channels[0];
  const hasFile = Boolean(night.files[selected.id]);
  const step = night.setupStep;
  const move = next => {
    night.setSetupStep(next);
  };
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0,0); }, [step]);
  const choose = async channel => {
    if (await night.select(channel.id)) move(['podcast','documentary','audible'].includes(channel.id) && !night.files[channel.id] ? 'file' : 'timer');
  };
  return <section className="night-setup-flow" aria-labelledby="night-question">
    <h2 id="night-question" ref={heading} tabIndex={-1}>{step === 'source' ? 'What would you like to listen to?' : step === 'file' ? hasFile ? 'Use your attached recording' : 'Add your recording' : 'When should the sound stop?'}</h2>
    <p>{step === 'source' ? 'Choose one sound. Nothing starts yet.' : step === 'file' ? hasFile ? `${night.title || 'Your recording'} is still here in this tab.` : night.needsFile ? 'Your previous file was not kept. Attach it again to use this sound.' : 'This slot has no recording yet. Your file stays in this tab.' : `${selected.name}. Local sound fades in the final minute.`}</p>
    {step === 'source' && <div className="night-sound-choices">{channels.map(channel => <button key={channel.id} aria-pressed={night.channel === channel.id && night.status !== 'idle'} disabled={night.busy} onClick={() => choose(channel)}>
      <strong>{channel.name}</strong><span>{['podcast','documentary','audible'].includes(channel.id) ? 'Add your own recording' : 'Generated noise preview · no voices'}</span>
    </button>)}</div>}
    {step === 'source' && <details className="night-other-sources"><summary>Use a music app instead</summary><button onClick={() => night.setPanel('spotify')}>Spotify</button><button onClick={() => night.setPanel('apple')}>Apple Music</button><p>Connection and authorization are required. The app timer stops provider audio; it does not fade it.</p></details>}
    {step === 'file' && <>{hasFile && <button className="night-primary" onClick={()=>move('timer')}>Continue with this recording</button>}<details open={!hasFile} className={hasFile ? "night-other-sources" : "night-required-file"}><summary>{hasFile ? 'Change recording' : 'Choose an audio file'}</summary><label className="night-file-action">Choose an audio file<input type="file" accept="audio/*" onChange={async event => {
      const file = event.target.files?.[0];
      if (file && await night.attach(selected.id, file)) { night.setView(false); move('timer'); }
    }}/></label></details>{selected.id === 'audible' && <p>Or <a href="https://www.audible.com/library" target="_blank" rel="noopener noreferrer" onClick={() => night.stop()}>open Audible</a> and use its own timer. Night cannot control playback there.</p>}</>}
    {step === 'timer' && <><div className="night-timer-choices" role="group" aria-label="Stop time">{[15,30,45,60].map(minutes => <button key={minutes} aria-pressed={night.minutes === minutes} onClick={() => night.changeTimer(minutes)}>{minutes} minutes</button>)}</div>{night.timerConfirmed && <aside className="night-listening-ticket" data-checkpoint="1" role="status"><span>Your listening choice</span><div className="night-ticket-dial" aria-hidden="true" style={{"--ticket-angle":`${night.minutes / 60 * 360}deg`}}><b>{night.minutes}</b><i>min</i></div><strong>{selected.name}</strong><p>{night.minutes} minutes · {hasFile ? 'Your recording' : 'Generated noise'} · stops automatically</p><small>Ready when you are. Nothing is playing yet.</small></aside>}<button className="night-primary" disabled={night.busy} onClick={() => night.play()}>Tune In</button></>}
    {step !== 'source' && <button className="night-quiet" onClick={() => move('source')}>Back to sounds</button>}
    {!night.setupOk && <p role="alert">Your choices are here, but this tab could not remember them after a refresh.</p>}
    {night.status === 'error' && <p role="alert">{night.message}</p>}
  </section>;
}
