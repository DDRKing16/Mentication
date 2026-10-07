// The supplied artwork/runtime stays bundled in index.html. This small clock
// owns only activity callbacks: paused time never advances game deadlines.
// Opening the raw asset without an app session goes through the shared baseline.
if (window.parent === window && !new URLSearchParams(location.search).has('session')) location.replace('/vector-shift');
const vectorSession = new URLSearchParams(location.search).get('session') || 'standalone';
const vectorStorageKey = `vector-shift:v2:${vectorSession}`;
function readVectorProgress() {
  try {
    const value = JSON.parse(sessionStorage.getItem(vectorStorageKey));
    if (!value || !Number.isInteger(value.e) || value.e < 1 || value.e > 7) return null;
    return {...value,practiceEvents:Array.isArray(value.practiceEvents)?value.practiceEvents.filter(event=>event && typeof event.id === "string" && typeof event.detail === "string").slice(0,100):[],nn:Number.isInteger(value.nn) && value.nn>=0 && value.nn<Qu.length?value.nn:0,
      reflectionAnswers:Object.fromEntries(Object.entries(value.reflectionAnswers || {}).filter(([key,answer])=>Number.isInteger(Number(key)) && Qu[Number(key)] && Number.isInteger(answer) && answer>=0 && answer<Qu[Number(key)].a.length))};
  } catch { return null; }
}
function saveVectorProgress(value) {
  try {const text=JSON.stringify(value);sessionStorage.setItem(vectorStorageKey,text);return sessionStorage.getItem(vectorStorageKey)===text;}catch{return false;}
}
const vectorStages = ['', 'Vector Shift', 'Align', 'Serpent', 'Word match', 'Solar scan', 'Reflect', 'Check in'];
const vectorInstructions = [
  '',
  'Follow one small visual task.',
  'Drag the star into the ring.',
  'Guide the serpent to a light.',
  'Choose a letter to uncover the word.',
  'Tap a difference between the pictures.',
  'Choose an answer that fits.',
  'Did this practice help?'
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
