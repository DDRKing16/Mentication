import manifest from './tappingAudioManifest.json';
import { TAPPING_CONTACT_MS } from './tappingGuidance';

const ROOT='/media/tapping/audio/';
const files=concern=>[...Object.keys(manifest).filter(key=>key.startsWith('place-')||key.startsWith(concern+'-')||['tap','rest'].includes(key)),'warm-room','contact'];

// Offline mixer. A short lookahead schedules rhythm on the audio clock;
// the hand's animation epoch anchors its first contact, without React beat jitter.
// resume() is called directly inside Start/Resume/Unmute, before any await.
export function createTappingAudio({
  AudioContextClass=window.AudioContext||window.webkitAudioContext,
  fetchAudio=(url,options)=>fetch(url,options),
  onError=()=>{}, onInterrupted=()=>{}, onEvent=()=>{},
}={}) {
  let context=null,master=null,musicGain=null,voiceGain=null,beatGain=null;
  let disposed=false,playing=false,generation=0,musicNode=null,voiceNode=null;
  let musicOffset=0,musicStarted=0,voiceCursor=null;
  let channels={voice:true,music:true,beat:true};
  let rhythmTimer=null,rhythmGeneration=0;
  const bytes=new Map(),buffers=new Map(),nodes=new Set(),abort=new AbortController();
  const isLive=token=>!disposed&&generation===token;
  function preload(concern) {
    return Promise.allSettled(files(concern).map(async key=>{
      if(!bytes.has(key)){
        const promise=fetchAudio(ROOT+(manifest[key]?.file||key+'.mp3'),{signal:abort.signal})
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
  function sourceFor(key,kind,gain,{offset=0,delay=0,at=null,loop=false}={}){
    if(!buffers.has(key)||context.state!=='running')throw Error('Audio unavailable');
    const source=context.createBufferSource();source.buffer=buffers.get(key);source.loop=loop;source.connect(gain);
    const node={source,kind,key,start:at??context.currentTime+delay,offset};nodes.add(node);
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
  function stopRhythm(){rhythmGeneration+=1;clearInterval(rhythmTimer);rhythmTimer=null;stopKind('beat');}
  function startRhythm({beatMs,contactMs,phaseMs=0}){
    stopRhythm();
    if(!playing||!channels.beat||!context||disposed)return;
    const token=rhythmGeneration,period=beatMs/1000;
    let next=context.currentTime+(contactMs-phaseMs)/1000;
    if(next<context.currentTime)next+=Math.ceil((context.currentTime-next)/period)*period;
    function schedule(){
      if(token!==rhythmGeneration||!playing||!channels.beat||disposed)return;
      if(next<context.currentTime-.02)next+=Math.ceil((context.currentTime-next)/period)*period;
      try{while(next<context.currentTime+.35&&token===rhythmGeneration){sourceFor('contact','beat',beatGain,{at:next});next+=period;}}
      catch{stopRhythm();channels.beat=false;onError('beat');}
    }
    schedule();
    if(token===rhythmGeneration)rhythmTimer=setInterval(schedule,40);
  }
  function pause(){
    generation+=1;playing=false;stopRhythm();
    if(voiceNode)voiceCursor={key:voiceNode.key,offset:Math.max(0,voiceNode.offset+context.currentTime-voiceNode.start)};
    if(musicNode)musicOffset+=Math.max(0,context.currentTime-musicStarted);
    for(const node of [...nodes])stopNode(node);musicNode=null;voiceNode=null;
  }
  function cancel(){pause();voiceCursor=null;}
  function configure(options){channels={...channels,...options};if(!channels.voice){stopKind('voice');voiceNode=null;voiceCursor=null;duck(.45);}if(!channels.music){if(musicNode)musicOffset+=Math.max(0,context.currentTime-musicStarted);stopKind('music');musicNode=null;}if(!channels.beat)stopRhythm();}
  function dispose(){if(disposed)return;cancel();disposed=true;abort.abort();context?.removeEventListener?.('statechange',stateChanged);if(context)void context.close().catch(()=>{});}
  return {preload,activate,run,speak,beat,startRhythm,stopRhythm,pause,cancel,configure,dispose};
}
