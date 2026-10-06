import { useEffect, useState } from 'react';
import { ArrowRight, Pencil, RefreshCw, Eye, Ear, Hand } from 'lucide-react';
import { CARE_ACTIONS, EXTERNAL_ANCHORS, compassionateSuggestions, noticingPhrase, makeRoomPhrase } from '@/lib/carePracticeDesign';
import './practice-first-core.css';

function NextStep({ flow }) {
  return <details className="pf-next"><summary><span>Next step</span><strong>{flow.s.action || 'Choose something useful'}</strong></summary><div className="pf-next-menu">{CARE_ACTIONS[flow.id].map(item => <button type="button" key={item.action} onClick={event => {flow.patch({action:item.action,actionStatus:null});const details=event.currentTarget.closest('details');details.open=false;details.querySelector('summary').focus();}}>{item.action}</button>)}<label>Or my own step<input maxLength={300} value={flow.s.action} onChange={event=>flow.patch({action:event.target.value,actionStatus:null})}/></label></div></details>;
}
function FinishPractice({ flow, report, children, tried = true }) {
  return <button type="button" className="pf-primary" onClick={()=>flow.go(flow.s.action ? 'rerate' : 'action',{practiceTaken:tried, ...(flow.s.action ? {actionStatus:'planned'} : {}), ...(flow.id==='selfCompassion'?{responseRead:true}:{})})}><span><small>{report}</small><strong>{children || flow.s.action || 'Choose my next useful step'}</strong></span><ArrowRight size={20} aria-hidden="true"/></button>;
}
function AnchorChoice({ flow, onChoose }) {
  const icons={object:Eye,sound:Ear,support:Hand};
  return <div className="pf-anchor-tabs" role="group" aria-label="Choose an external anchor">{Object.entries(EXTERNAL_ANCHORS).map(([key,anchor])=>{const Icon=icons[key];return <button type="button" key={key} aria-label={anchor.label} aria-pressed={flow.s.anchorType===key} onClick={()=>{flow.patch({anchorType:key,anchorText:'',anchorNoticed:false});onChoose?.(key);}}><Icon size={16} aria-hidden="true"/>{({object:'See',sound:'Hear',support:'Feel'})[key]}</button>;})}</div>;
}
function AnchorName({ flow }) {
  return <label className="pf-anchor-name"><span>{EXTERNAL_ANCHORS[flow.s.anchorType].prompt}</span><input maxLength={140} value={flow.s.anchorText} placeholder={EXTERNAL_ANCHORS[flow.s.anchorType].example} onChange={event=>flow.patch({anchorText:event.target.value,anchorNoticed:false})}/></label>;
}
function Stop({ flow, children='Return to the room', stage='orient' }) {return <button type="button" className="pf-stop" onClick={()=>flow.go(stage)}>{children}</button>;}

export function CompassionCore({ flow }) {
  const {s}=flow;const [editing,setEditing]=useState(false);const [rewrite,setRewrite]=useState(false);
  const suggestions=compassionateSuggestions(s.notice);
  const showingResponse=!!s.perspective && !rewrite && !editing;
  useEffect(()=>{if(showingResponse)flow.heading.current?.focus({preventScroll:true});},[showingResponse,flow.heading]);
  const choose=perspective=>{flow.patch({perspective,responseRead:false,practiceTaken:false});setRewrite(false);setEditing(false);};
  return <section className="pf-core pf-compassion" data-pair={Math.floor(s.clicks/2)}>
    <div className="pf-critical"><span>The critical voice</span><p>“{s.notice || 'The line I am holding in mind'}”</p></div>
    {!s.perspective || rewrite ? <div className="pf-response-choices"><h1 ref={flow.heading} tabIndex={-1}>{rewrite?'Make it more believable.':'Try a voice on your side.'}</h1><p>{rewrite?'Keep responsibility. Drop the attack on yourself.':'Choose words you could offer someone you care about.'}</p>{(rewrite ? ['I can look honestly at what happened and decide what to repair. I do not need to attack myself to do that.','I do not have to believe a kind sentence yet. I can choose one act of care.'] : suggestions.slice(0,2)).map(text=><button type="button" key={text} onClick={()=>choose(text)}>{text}<ArrowRight size={17} aria-hidden="true"/></button>)}<button type="button" className="pf-inline" onClick={()=>{setEditing(true);setRewrite(false);}}>Write a response I can believe</button></div> : <>
      <div className="pf-response" key={`response-${Math.floor(s.clicks/2)}`}><span>A voice on my side</span><h1 ref={flow.heading} tabIndex={-1}>{s.perspective}</h1><button type="button" aria-label="Edit my caring response" onClick={()=>setEditing(!editing)}><Pencil size={16} aria-hidden="true"/>Edit my words</button></div>
      <div className="pf-tone" role="group" aria-label="A tone to try">{['steady','gentle'].map(tone=><button type="button" key={tone} aria-pressed={s.responseTone===tone} onClick={()=>flow.patch({responseTone:tone})}>{tone==='steady'?'Steady':'Gentle'}</button>)}<span>{s.responseTone==='gentle'?'Soft and unhurried.':'Calm and clear.'}</span></div>
      <button type="button" className="pf-rewrite" onClick={()=>{setRewrite(true);setEditing(false);}}><RefreshCw size={14} aria-hidden="true"/>That does not feel believable</button>
    </>}
    {editing && <label className="pf-editor">A response I can believe<textarea rows={3} maxLength={300} value={s.perspective} onChange={event=>flow.patch({perspective:event.target.value,responseRead:false,practiceTaken:false})}/><button type="button" className="pf-inline" onClick={()=>setEditing(false)}>Use these words</button></label>}
    <NextStep flow={flow}/>
    {s.perspective && !rewrite && <FinishPractice flow={flow} report="I tried saying these words">{s.action || 'Choose one act of care'}</FinishPractice>}
    <Stop flow={flow} stage="action">Choose care without the words</Stop>
  </section>;
}
export function UnhookCore({ flow }) {
  const {s}=flow;const [naming,setNaming]=useState(false);const beside=!!s.anchorType && s.defusionStep>0;
  useEffect(()=>{flow.heading.current?.focus({preventScroll:true});},[s.defusionStep,flow.heading]);
  return <section className={`pf-core pf-unhook ${beside?'is-beside':''}`} data-pair={Math.floor(s.clicks/2)}>
    <p className="pf-instruction">{s.defusionStep?'Keep the thought. Choose what else gets your attention.':'First, notice the words as a thought.'}</p>
    <div className="pf-thought-room"><div className="pf-thought"><span>{s.defusionStep?'I am noticing the thought…':'My mind says…'}</span><h1 ref={flow.heading} tabIndex={-1}>{s.notice || 'The words I am holding in mind'}</h1></div>{beside && <div className="pf-attention" key={`anchor-${Math.floor(s.clicks/2)}`}><span>Also here, in the real world</span><h2>{s.anchorText || {object:'One object nearby',sound:'One sound in the room',support:'The surface supporting me'}[s.anchorType]}</h2><p>{EXTERNAL_ANCHORS[s.anchorType].instruction}</p><button type="button" className="pf-inline" onClick={()=>setNaming(!naming)}>{s.anchorText?'Change my anchor':'Name what I notice'}<Pencil size={13} aria-hidden="true"/></button></div>}</div>
    {!s.defusionStep ? <button type="button" className="pf-primary" onClick={()=>flow.patch({defusionStep:1,perspective:noticingPhrase(s.notice),practiceTaken:false})}><span>Notice this as a thought</span><ArrowRight size={20} aria-hidden="true"/></button> : <><AnchorChoice flow={flow} onChoose={()=>flow.patch({defusionStep:2,distance:'beside'})}/>{naming && s.anchorType && <AnchorName flow={flow}/>}<NextStep flow={flow}/><FinishPractice flow={flow} report="I tried noticing and returning attention"/></>}
    <Stop flow={flow}>Return to the room</Stop>
  </section>;
}
export function MakeRoomCore({ flow }) {
  const {s}=flow;const [naming,setNaming]=useState(false);
  return <section className="pf-core pf-room" data-pair={Math.floor(s.clicks/2)}>
    <div className="pf-room-anchor"><span>Stay connected to</span><strong>{s.anchorText || (s.anchorType?{object:'One object nearby',sound:'One sound in the room',support:'The surface supporting me'}[s.anchorType]:'Something outside the feeling')}</strong>{s.anchorType && <button type="button" className="pf-inline" onClick={()=>setNaming(!naming)}><Pencil size={13} aria-hidden="true"/>{s.anchorText?'Change':'Name it'}</button>}</div>
    <AnchorChoice flow={flow}/>{naming && s.anchorType && <AnchorName flow={flow}/>} 
    <div className={`pf-space ${s.allowance?'has-room':''} ${s.allowance==='more'?'has-more-room':''}`}><div className="pf-space-boundary" aria-hidden="true"/><div className="pf-feeling"><span>Here is</span><h1 ref={flow.heading} tabIndex={-1}>{s.notice || 'This feeling'}</h1></div><p>It can stay the same.</p></div>
    <div className="pf-space-control" role="group" aria-label="How much space to try">{[[null,'Room only'],['small','A little'],['more','More']].map(([value,label])=><button type="button" key={label} disabled={!s.anchorType && value!==null} aria-pressed={s.allowance===value} onClick={()=>flow.patch({allowance:value,perspective:makeRoomPhrase(s.notice),practiceTaken:false,attentionFocused:false})}>{label}</button>)}</div>
    <p className="pf-room-guidance">{!s.anchorType?'Choose an anchor before turning toward the feeling.':!s.allowance?'Stay with your surroundings for now.':'Notice lightly, with your anchor still here.'}</p>
    <NextStep flow={flow}/><FinishPractice flow={flow} tried={!!s.allowance} report={s.allowance?'I tried making a little room':'I stayed with my surroundings'}/>
    <Stop flow={flow}>Too much? Return to the room</Stop>
  </section>;
}
