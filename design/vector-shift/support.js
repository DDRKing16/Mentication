// The supplied artwork/runtime stays bundled in index.html. This small clock
// owns only activity callbacks: paused time never advances game deadlines.
// Opening the raw asset without an app session goes through the shared baseline.
if (window.parent === window && !new URLSearchParams(location.search).has('session')) location.replace('/vector-shift');
const vectorSession = new URLSearchParams(location.search).get('session') || 'standalone';
const vectorStorageKey = `vector-shift:v2:${vectorSession}`;
function readVectorProgress() {
  try {
    const value = JSON.parse(sessionStorage.getItem(vectorStorageKey));
    return value && Number.isInteger(value.e) && value.e >= 1 && value.e <= 7 ? value : null;
  } catch { return null; }
}
function saveVectorProgress(value) {
  try {const text=JSON.stringify(value);sessionStorage.setItem(vectorStorageKey,text);return sessionStorage.getItem(vectorStorageKey)===text;}catch{return false;}
}
const vectorStages = ['', 'Vector Shift', 'Align', 'Serpent', 'Word match', 'Solar scan', 'Reflect', 'Check in'];
const vectorInstructions = [
  '',
  'A visual attention practice, at your pace. Pause, skip or stop at any time.',
  'Drag the star into the ring. You can simply notice a colour or shape with the easier option.',
  'Use the arrow buttons or arrow keys to guide the serpent to lights. The easier option lets you collect three lights without a timer.',
  'Choose letters to uncover a word. Reveal a letter whenever you want; there is no penalty for guessing.',
  'Compare the solar pictures and tap differences. The easier option names things you can look for, with no requirement to find them all.',
  'Choose an answer that fits, or skip this step. Gameplay is not evidence of recovery.',
  'What you report matters more than finishing a game.'
];
const vectorClock = (() => {
  let paused = false, pauseAt = 0, pausedTime = 0, nextId = 0;
  const jobs = new Map();
  const now = () => (paused ? pauseAt : performance.now()) - pausedTime;
  const cancel = id => { const job=jobs.get(id); if(job){if(job.frame)cancelAnimationFrame(job.native);else clearTimeout(job.native);jobs.delete(id);} };
  function schedule(callback, delay, repeat=false, frame=false) {
    const id=++nextId;
    const job={native:null, frame, due:now()+delay};jobs.set(id,job);
    const tick=()=>{
      if(!jobs.has(id))return;
      if(!paused && now()>=job.due){
        if(!repeat)jobs.delete(id);
        callback(now());
        if(!repeat || !jobs.has(id))return;
        job.due=now()+delay;
      }
      job.native=frame ? requestAnimationFrame(tick) : setTimeout(tick,Math.min(50,Math.max(8,job.due-now())));
    };
    job.native=frame ? requestAnimationFrame(tick) : setTimeout(tick,Math.min(50,delay));
    return id;
  }
  return {
    get paused(){return paused},
    set paused(value){if(value===paused)return;if(value)pauseAt=performance.now();else pausedTime+=performance.now()-pauseAt;paused=value},
    now, cancel, timeout:(fn,ms)=>schedule(fn,ms), interval:(fn,ms)=>schedule(fn,ms,true), frame:fn=>schedule(fn,0,false,true),
    clear:()=>{for(const id of jobs.keys())cancel(id)}
  };
})();
