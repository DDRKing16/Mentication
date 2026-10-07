import React, { useEffect, useState } from 'react';
import { captureGoalBaseline, goalPointChange, GOAL_ASSESSMENTS } from '../../src/lib/goalAssessment.js';
import SetupNote from './SetupNote.jsx';
export function NightControls({
  night, channelName, onFocusMode
}) {
  const [link, setLink] = useState(''),
    [baseline, setBaseline] = useState(null),
    [finish, setFinish] = useState(false),
    [after, setAfter] = useState(null),
    [baselineOpen, setBaselineOpen] = useState(false);
  useEffect(()=>{onFocusMode?.(baselineOpen || finish);},[baselineOpen,finish,onFocusMode]);
  useEffect(()=>{
    const restore=()=>{setBaselineOpen(false);setFinish(false);};
    window.addEventListener('night:history-restore',restore);
    return ()=>window.removeEventListener('night:history-restore',restore);
  },[]);
  useEffect(() => {
    const receive=event=>{
      if(event.origin!==location.origin || event.source!==window.parent || event.data?.type!=='mentication:pause-for-alternative' || typeof event.data.requestId!=='string')return;
      Promise.resolve(night.pause()).then(paused=>{if(paused)window.parent.postMessage({type:'mentication:alternative-ready',requestId:event.data.requestId},location.origin);}).catch(()=>{});
    };
    window.addEventListener('message',receive);return ()=>window.removeEventListener('message',receive);
  },[night.pause]);
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
  if (provider) return <section className="night-controls night-provider-flow" aria-label={`${provider} connection`}>
    <h2>{['ready','playing','paused'].includes(state) ? 'Which song would you like?' : `Connect ${provider === 'spotify' ? 'Spotify' : 'Apple Music'}`}</h2>
    {['ready','playing','paused'].includes(state) ? <><label>Song link<input aria-label={`${provider} song link`} placeholder={provider === 'spotify' ? 'https://open.spotify.com/track/…' : 'https://music.apple.com/…'} value={link} onChange={e => setLink(e.target.value)}/></label><button className="night-primary" disabled={night.busy || !link} onClick={() => night.playProvider(provider,link)}>Play selected song</button><button className="night-quiet" onClick={() => night.disconnect(provider)}>Disconnect</button></> : <><p>{state === 'config_missing' ? 'This connection is not available yet. Choose another sound while the owner configures it.' : provider === 'spotify' ? 'Spotify Premium and your authorization are required.' : 'An Apple Music subscription and your authorization are required.'}</p>{state === 'config_missing' ? <button className="night-primary" onClick={()=>night.setPanel(null)}>Choose another sound</button> : <button className="night-primary" disabled={night.busy} onClick={() => night.connect(provider)}>Connect {provider === 'spotify' ? 'Spotify' : 'Apple Music'}</button>}<p>No account connects until you authorize with the provider.</p></>}
    {night.status === 'error' && <p role="alert">{night.message}</p>}{state !== 'config_missing' && <button className="night-quiet" onClick={() => night.setPanel(null)}>Back to sounds</button>}
  </section>;
  if (baselineOpen && !baseline && !night.hasStarted) return <section className="night-controls night-check"><h2>{assessment.question}</h2><p>Optional · {assessment.scale}. 0 = {assessment.left}; 10 = {assessment.right}</p><div className="night-ratings">{Array.from({length:11},(_,v)=><button key={v} onClick={()=>{setBaseline(captureGoalBaseline('sleep',v));setBaselineOpen(false);}}>{v}</button>)}</div><button className="night-quiet" onClick={()=>setBaselineOpen(false)}>Skip this check</button></section>;
  if (finish) return <section className="night-controls night-check" aria-label="Optional end check">
    <h2>{baseline && after === null ? assessment.question : 'You can leave it here'}</h2>
    {baseline && after === null ? <><p>Optional · {assessment.scale}. 0 = {assessment.left}; 10 = {assessment.right}</p><div className="night-ratings">{Array.from({length:11},(_,v)=><button key={v} onClick={()=>setAfter(v)}>{v}</button>)}</div></> : after !== null ? <p>Your answer: {after}/10. Change from your starting answer: {goalPointChange(baseline,baseline.direction,after)} points. These answers stay in this tab only.</p> : <p>Sound is stopped. No sleep result has been assumed.</p>}
    <button className="night-primary" onClick={()=>setFinish(false)}>{baseline && after === null ? 'Leave this unanswered' : 'Return to controls'}</button>
  </section>;
  return <section className="night-controls" data-remaining={night.seconds} aria-label="Playback details">
    {night.view && <><p role={night.status === 'error' ? 'alert' : 'status'}>{night.status.replaceAll('_',' ')}{night.message ? ` — ${night.message}` : ''}</p>
    <details className="night-playback-settings"><summary>Adjust sound or stop time</summary>
      <label>Sleep timer<select aria-label="Sleep timer" value={night.minutes} onChange={e=>night.changeTimer(Number(e.target.value))}>{[15,30,45,60].map(m=><option key={m} value={m}>{m} minutes</option>)}</select></label>
      <p>A new stop time resets the timer. {night.source === 'local' ? 'Local sound fades in the final minute.' : 'Provider audio stops at the timer; fade and volume control are not available here.'}</p>
      {night.source === 'local' && <><label>Local audio volume<input type="range" aria-label="Local audio volume" min="0" max="1" step="0.01" value={night.volume} onChange={e=>night.setVolume(Number(e.target.value))}/></label>{!night.files[night.channel] && <label>Generated noise texture<input type="range" aria-label="Generated noise texture" min="0" max="1" step="0.01" value={night.texture} onChange={e=>night.setTexture(Number(e.target.value))}/></label>}</>}
    </details>
    <SetupNote night={night} channelName={channelName}/>
    <button className="night-quiet" disabled={night.busy} onClick={async()=>{if(await night.stop())setFinish(true);}}>Finish by choice</button></>}
    <details className="night-practice-guide"><summary>How this works</summary><p>Choose a sound, set a stopping point, then let it hold some attention. You do not need to follow every detail, solve a thought or finish listening. Pause, change the sound or choose quiet rest whenever you want.</p><p>Six ambient channels are generated noise previews, not recordings. Podcast, documentary and audiobook slots need your own file. Spotify and Apple Music need configuration and your authorization. Audible uses its own controls and timer.</p><p>Locked-screen and background playback are unverified on this device. Browser suspension can delay the stop timer; keep this page open for the tested controls.</p><p>{night.setupOk ? 'Your choices can return paused in this tab for up to 24 hours. Audio never restarts on return. Files are not kept.' : 'This tab could not remember your setup. Keep the page open to retain these controls.'}</p></details>
    {!baseline && !night.hasStarted && !night.view && <button className="night-quiet" onClick={()=>setBaselineOpen(true)}>Optional starting check</button>}
  </section>;
}
export function AudibleSlot({
  night
}) {
  return <section className="night-provider"><h2>Your Audible</h2><p>Planned audiobook slot. Audible streaming is not connected here. You can attach an audio file you have permission to use, or open Audible and use its own sleep timer. Night cannot stop or fade playback in Audible.</p><button disabled={night.busy} onClick={async () => {
      if (await night.stop()) window.open('https://www.audible.com/library', '_blank', 'noopener,noreferrer');
    }}>Open Audible website</button></section>;
}
