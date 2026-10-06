let audio = null;
let retryGesture = null;
let muted = false;
let wanted = false;
let generation = 0;

const MUSIC_URL = '/audio/home-ambient.mp3';
const MUSIC_VOLUME = 0.35;
const mayPlay=()=>wanted&&!muted&&(typeof document==='undefined'||document.visibilityState!=='hidden');
function cancelRetry() {
  if(!retryGesture)return;
  document.removeEventListener('pointerdown',retryGesture,true);
  document.removeEventListener('keydown',retryGesture,true);
  retryGesture=null;
}
function pauseCurrent() { generation+=1;cancelRetry();try { audio?.pause(); } catch { /* media unavailable */ } }
function attemptPlay() {
  if(!audio||!mayPlay())return;
  cancelRetry();const request=++generation,current=audio;
  try {
    Promise.resolve(current.play()).then(()=>{if(!mayPlay())current.pause();}).catch(()=>{
      // An earlier rejected play must not arm a new retry after pause/mute.
      if(request!==generation||!mayPlay())return;
      retryGesture=()=>{cancelRetry();if(mayPlay())attemptPlay();};
      document.addEventListener('pointerdown',retryGesture,true);
      document.addEventListener('keydown',retryGesture,true);
    });
  } catch { /* media unavailable */ }
}
function ensureAudio() {
  if(typeof window==='undefined')return null;
  if(!audio) {
    try { audio=new Audio(MUSIC_URL); } catch { return null; }
    audio.loop=true;audio.preload='auto';audio.volume=MUSIC_VOLUME;audio.muted=muted;
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseCurrent();else if(mayPlay())attemptPlay();});
    window.addEventListener('pagehide',pauseCurrent);
    window.addEventListener('pageshow',()=>{if(mayPlay())attemptPlay();});
  }
  return audio;
}
export function handoffHomeAmbient({currentTime=0,volume=MUSIC_VOLUME}={}) {
  const current=ensureAudio();if(!current)return;
  if(Number.isFinite(currentTime)&&currentTime>=0){try{current.currentTime=currentTime;}catch{/* metadata unavailable */}}
  current.volume=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):MUSIC_VOLUME;
  current.muted=muted;wanted=true;attemptPlay();
}
export function resumeHomeAmbient() {
  const current=ensureAudio();wanted=true;
  if(!current||!mayPlay()||!current.paused)return;
  current.muted=false;attemptPlay();
}
export function setHomeAmbientMuted(nextMuted) {
  muted=Boolean(nextMuted);const current=ensureAudio();
  if(current)current.muted=muted;
  if(muted){wanted=false;pauseCurrent();}else{wanted=true;attemptPlay();}
  return muted;
}
export function isHomeAmbientMuted(){return muted;}
export function pauseHomeAmbient(){wanted=false;pauseCurrent();}
export function stopHomeAmbient(){pauseHomeAmbient();}
