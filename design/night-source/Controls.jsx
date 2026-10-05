import React, { useEffect, useState } from 'react';
import { captureGoalBaseline, goalPointChange, GOAL_ASSESSMENTS } from '../../src/lib/goalAssessment.js';
export function NightControls({
  night
}) {
  const [link, setLink] = useState(''),
    [baseline, setBaseline] = useState(null),
    [finish, setFinish] = useState(false),
    [after, setAfter] = useState(null),
    [baselineOpen, setBaselineOpen] = useState(false);
  useEffect(() => {
    const receive = event => {
      const b = event.data?.baseline;
      if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'night-baseline' && goalPointChange(b, b?.direction, b?.value) === 0) setBaseline(current => current || b);
    };
    window.addEventListener('message', receive);
    if (window.parent !== window) window.parent.postMessage({
      type: 'night-baseline-request'
    }, location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (night.panel) document.querySelector('.night-provider')?.scrollIntoView({
      block: 'center'
    });
  }, [night.panel]);
  const provider = night.panel,
    state = night.providerStates[provider],
    assessment = baseline || GOAL_ASSESSMENTS.sleep;
  return <section className="night-controls" data-remaining={night.seconds} aria-label="Playback controls">
    <p role="status">{night.status.replaceAll('_', ' ')}{night.message ? ` — ${night.message}` : ''}</p>
    <p>{night.source === 'local' ? night.files[night.channel] ? 'Your attached file • plays once' : ['podcast', 'documentary', 'audible'].includes(night.channel) ? 'Recording not added yet' : 'Generated noise preview • no recorded scene or voices' : `${night.source === 'spotify' ? 'Spotify' : 'Apple Music'} • ${night.title || 'waiting for track information'}`}</p>
    <div className="night-actions">
      <button disabled={night.busy} onClick={() => night.status === 'playing' ? night.pause() : night.play()}>{night.status === 'playing' ? 'Pause' : night.status === 'error' ? 'Retry playback' : 'Play / resume'}</button>
      <button onClick={night.stop}>STOP</button>
      {night.view && <button onClick={() => night.setView(false)}>Choose source</button>}
    </div>
    <label>Sleep timer <select aria-label="Sleep timer" value={night.minutes} onChange={e => night.changeTimer(Number(e.target.value))}>{[15, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}</select></label>
    <p>{Math.floor(night.seconds / 60)}:{String(night.seconds % 60).padStart(2, '0')} remaining while playing. {night.source === 'local' ? 'Local sound fades in the final minute.' : 'Provider audio stops at the timer; no fade or volume control is promised.'} Pause and STOP keep position. A new timer selection resets the remaining time.</p>
    <p>Locked-screen and background playback are unverified on this device. Browser suspension can delay the stop timer; keep this page open for the tested controls.</p>
    {!night.view && <div className="night-actions"><button onClick={() => night.setPanel('spotify')}>Spotify settings</button><button onClick={() => night.setPanel('apple')}>Apple Music settings</button></div>}
    {provider && <section className="night-provider" aria-label={`${provider} connection`}>
      <h2>{provider === 'spotify' ? 'Spotify' : 'Apple Music'}</h2><p>Connection: {state?.replaceAll('_', ' ')}</p>
      <p>{provider === 'spotify' ? 'Requires Spotify Premium and access to the owner’s developer app. Plays a track you choose, without other Night audio.' : 'Requires Apple Music authorization and an active subscription. The owner must first configure secure developer-token delivery.'}</p>
      <div className="night-actions"><button disabled={night.busy || state === 'config_missing'} onClick={() => night.connect(provider)}>Connect {provider === 'spotify' ? 'Spotify' : 'Apple Music'}</button><button disabled={night.busy || !['ready', 'playing', 'paused', 'error'].includes(state)} onClick={() => night.disconnect(provider)}>Disconnect</button><button onClick={() => night.setPanel(null)}>Close settings</button></div>
      <label>Song link<input aria-label={`${provider} song link`} placeholder={provider === 'spotify' ? 'https://open.spotify.com/track/…' : 'https://music.apple.com/…'} value={link} onChange={e => setLink(e.target.value)} /></label>
      <button disabled={night.busy || !link || !['ready', 'playing', 'paused'].includes(state)} onClick={() => night.playProvider(provider, link)}>Play selected song</button>
      <p>No account is connected by opening these settings. Connect opens the provider’s authorization flow.</p>
    </section>}
    {!baseline && !night.hasStarted && <button onClick={() => setBaselineOpen(!baselineOpen)}>Optional starting check</button>}
    {baselineOpen && !baseline && !night.hasStarted && <fieldset><legend>{assessment.question} ({assessment.scale})</legend><p>0 = {assessment.left}; 10 = {assessment.right}</p><div className="night-ratings">{Array.from({
          length: 11
        }, (_, v) => <button key={v} onClick={() => {
          setBaseline(captureGoalBaseline('sleep', v));
          setBaselineOpen(false);
        }}>{v}</button>)}</div><button onClick={() => setBaselineOpen(false)}>Skip</button></fieldset>}
    <button disabled={night.busy} onClick={async () => {
      if (await night.stop()) setFinish(true);
    }}>Finish by choice</button>
    {finish && <section aria-label="Optional end check"><p>Finished. You can leave quietly.</p>{baseline && after === null && <><p>Optional: {assessment.question} ({assessment.scale})</p><p>0 = {assessment.left}; 10 = {assessment.right}</p><div className="night-ratings">{Array.from({
            length: 11
          }, (_, v) => <button key={v} onClick={() => setAfter(v)}>{v}</button>)}</div></>}{after !== null && <p>Your answer: {after}/10. Change from your starting answer: {goalPointChange(baseline, baseline.direction, after)} points. These answers stay in this tab only.</p>}<button onClick={() => setFinish(false)}>Close quietly</button></section>}
  </section>;
}
export function AudibleSlot({
  night
}) {
  return <section className="night-provider"><h2>Your Audible</h2><p>Planned audiobook slot. Audible streaming is not connected here. You can attach an audio file you have permission to use, or open Audible and use its own sleep timer. Night cannot stop or fade playback in Audible.</p><button disabled={night.busy} onClick={async () => {
      if (await night.stop()) window.open('https://www.audible.com/library', '_blank', 'noopener,noreferrer');
    }}>Open Audible website</button></section>;
}
