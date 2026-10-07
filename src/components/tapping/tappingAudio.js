import manifest from './tappingAudioManifest.json';
import { TAPPING_CONTACT_MS } from './tappingGuidance';
import { tappingNarration, tappingNarrationKeys, TAPPING_VOICE_RATE } from './tappingNarration';

const ROOT='/media/tapping/audio/';
const files=concern=>[...tappingNarrationKeys(concern),'warm-room','contact'];

// Offline mixer. One native audio loop owns the audible contact cadence.
// Its output clock also drives the fingers and light; no per-contact JS timers.
// resume() is called directly inside Start/Resume/Unmute, before any await.
export function createTappingAudio({
  AudioContextClass=window.AudioContext||window.webkitAudioContext,
  fetchAudio=(url,options)=>fetch(url,options),
  onError=()=>{}, onInterrupted=()=>{}, onEvent=()=>{},
  now=()=>performance.now(),
  resolveNarration=tappingNarration,
}={}) {
  let context=null,master=null,musicGain=null,voiceGain=null,beatGain=null;
  let disposed=false,playing=false,generation=0,musicNode=null,voiceNode=null;
  let musicOffset=0,musicStarted=0,voiceCursor=null;
  let channels={voice:true,music:true,beat:true};
  let rhythmClock=null;
  const rhythmBuffers=new Map();
  const bytes=new Map(),buffers=new Map(),nodes=new Set(),abort=new AbortController();
  const isLive=token=>!disposed&&generation===token;
  const assetFor=key=>manifest[key]?resolveNarration(key)?.url:ROOT+key+'.mp3';
  function preload(concern) {
    return Promise.allSettled(files(concern).map(async key=>{
      const url=assetFor(key);
      if(!url)return;
      if(!bytes.has(key)){
        const promise=fetchAudio(url,{signal:abort.signal})
          .then(response=>{if(!response.ok)throw Error('Audio unavailable');return response.arrayBuffer();});
        bytes.set(key,promise);promise.catch(()=>{if(bytes.get(key)===promise)bytes.delete(key);});
      }
      return bytes.get(key);
    }));
  }
  function makeGain(value){const gain=context.createGain();gain.gain.value=value;gain.connect(master);return gain;}
  function stateChanged(){if(playing&&context.state!=='running'&&!disposed){pause();onInterrupted();}}
  async function activate(concern,options=channels) {
    const token=++generation;
    if(disposed||!AudioContextClass)throw Error('Audio unavailable');
    if(!context){context=new AudioContextClass();master=context.createGain();master.gain.value=.9;master.connect(context.destination);musicGain=makeGain(.45);voiceGain=makeGain(.95);beatGain=makeGain(.38);context.addEventListener?.('statechange',stateChanged);}
    const unlocked=context.resume();
    await unlocked;
    if(!isLive(token))return false;
    if(context.state!=='running')throw Error('Audio unavailable');
    await preload(concern);
    if(!isLive(token))return false;
    const errors=new Set();
    await Promise.allSettled(files(concern).map(async key=>{
      if(buffers.has(key))return;
      try{const data=await bytes.get(key);if(!data)throw Error('Audio unavailable');const buffer=await context.decodeAudioData(data.slice(0));if(isLive(token))buffers.set(key,buffer);}
      catch{errors.add(key==='warm-room'?'music':key==='contact'?'beat':'voice');}
    }));
    if(!isLive(token))return false;
    channels={...options};
    for(const kind of errors){channels[kind]=false;if(options[kind])onError(kind);}
    if(context.state!=='running')throw Error('Audio unavailable');
    return Object.values(channels).some(Boolean);
  }
  function stopNode(node){if(!node)return;try{node.source.onended=null;node.source.stop();node.source.disconnect();}catch{/* already ended */}nodes.delete(node);}
  function stopKind(kind){for(const node of [...nodes])if(node.kind===kind)stopNode(node);}
  function duck(value){if(!musicGain)return;musicGain.gain.cancelScheduledValues(context.currentTime);musicGain.gain.setTargetAtTime(value,context.currentTime,.16);}
  function sourceFor(key,kind,gain,{offset=0,delay=0,at=null,loop=false,buffer=null}={}){
    if((!buffer&&!buffers.has(key))||context.state!=='running')throw Error('Audio unavailable');
    const source=context.createBufferSource();source.buffer=buffer||buffers.get(key);source.loop=loop;source.connect(gain);
    const rate=kind==='voice'?TAPPING_VOICE_RATE:1;
    source.playbackRate.value=rate;
    const node={source,kind,key,start:at??context.currentTime+delay,offset,rate};nodes.add(node);
    source.onended=()=>{nodes.delete(node);try{source.disconnect();}catch{/* ended */}if(node===voiceNode){voiceNode=null;voiceCursor=null;duck(.45);}if(node===musicNode)musicNode=null;};
    source.start(node.start,offset);onEvent(kind,{key,at:node.start,offset});return node;
  }
  function startMusic(){if(!playing||!channels.music||musicNode)return;try{musicStarted=context.currentTime;musicOffset%=buffers.get('warm-room').duration;musicNode=sourceFor('warm-room','music',musicGain,{offset:musicOffset,loop:true});duck(voiceNode? .12:.45);}catch{channels.music=false;onError('music');}}
  function speak(key,offset=0){
    if(!playing||!channels.voice)return;
    stopNode(voiceNode);voiceNode=null;voiceCursor=null;
    const clip=buffers.get(key);if(!clip||offset>=clip.duration)return;
    try{voiceNode=sourceFor(key,'voice',voiceGain,{offset});voiceCursor={key,offset};duck(.12);}catch{channels.voice=false;onError('voice');}
  }
  function run(){
    if(disposed||!context||context.state!=='running')return;
    if(!playing){playing=true;const cursor=voiceCursor;startMusic();if(cursor)speak(cursor.key,cursor.offset);}
    else startMusic();
  }
  function beat(contactDelay=TAPPING_CONTACT_MS){if(!playing||!channels.beat)return;try{sourceFor('contact','beat',beatGain,{delay:contactDelay/1000});}catch{channels.beat=false;onError('beat');}}
  function stopRhythm(){rhythmClock=null;stopKind('beat');}
  function outputTime(){
    const stamp=context.getOutputTimestamp?.();
    if(stamp?.performanceTime>0&&stamp.performanceTime<=now()+2&&Number.isFinite(stamp.contextTime)&&stamp.contextTime>=0&&stamp.contextTime<=context.currentTime)return stamp.contextTime;
    // Engines without output timestamps use their reported output latency.
    return Math.max(0,context.currentTime-(context.baseLatency||0)-(context.outputLatency||0));
  }
  function contactLoop(beatMs,contactMs){
    const key=`${beatMs}:${contactMs}`;
    if(rhythmBuffers.has(key))return rhythmBuffers.get(key);
    const clip=buffers.get('contact');
    if(!clip||!(beatMs>0)||contactMs<0||contactMs>=beatMs)throw Error('Audio unavailable');
    const length=Math.round(beatMs*clip.sampleRate/1000),offset=Math.round(contactMs*clip.sampleRate/1000);
    if(clip.length>length-offset)throw Error('Audio unavailable');
    const loop=context.createBuffer(clip.numberOfChannels,length,clip.sampleRate);
    for(let channel=0;channel<clip.numberOfChannels;channel++)loop.getChannelData(channel).set(clip.getChannelData(channel),offset);
    rhythmBuffers.set(key,loop);return loop;
  }
  function startRhythm({beatMs,contactMs,phaseMs=0}){
    stopRhythm();
    if(!playing||!channels.beat||!context||disposed)return;
    try{
      const buffer=contactLoop(beatMs,contactMs);
      const phase=((phaseMs%beatMs)+beatMs)%beatMs;
      const start=context.currentTime+.05,origin=start-phase/1000;
      // Start at the current cycle position, with a short native scheduling lead.
      // The native loop survives main-thread stalls without missed contacts or
      // a burst of replacement sources. Pause/Stop still cancel it immediately.
      sourceFor('contact','beat',beatGain,{buffer,loop:true,at:start,offset:phase/1000});
      rhythmClock={origin,lastPhase:phase};
    }catch{stopRhythm();channels.beat=false;onError('beat');}
  }
  function rhythmPhase(){
    if(!playing||!channels.beat||!rhythmClock||disposed)return null;
    rhythmClock.lastPhase=Math.max(rhythmClock.lastPhase,(outputTime()-rhythmClock.origin)*1000);
    return rhythmClock.lastPhase;
  }
  function playbackTime(){return !disposed&&context?.state==='running'?outputTime():null;}
  function pause(){
    generation+=1;playing=false;stopRhythm();
    if(voiceNode)voiceCursor={key:voiceNode.key,offset:Math.max(0,voiceNode.offset+(context.currentTime-voiceNode.start)*voiceNode.rate)};
    if(musicNode)musicOffset+=Math.max(0,context.currentTime-musicStarted);
    for(const node of [...nodes])stopNode(node);musicNode=null;voiceNode=null;
  }
  function cancel(){pause();voiceCursor=null;}
  function configure(options){channels={...channels,...options};if(!channels.voice){stopKind('voice');voiceNode=null;voiceCursor=null;duck(.45);}if(!channels.music){if(musicNode)musicOffset+=Math.max(0,context.currentTime-musicStarted);stopKind('music');musicNode=null;}if(!channels.beat)stopRhythm();}
  function dispose(){if(disposed)return;cancel();disposed=true;abort.abort();context?.removeEventListener?.('statechange',stateChanged);if(context)void context.close().catch(()=>{});}
  return {preload,activate,run,speak,beat,startRhythm,stopRhythm,rhythmPhase,playbackTime,pause,cancel,configure,dispose};
}
