import {useJourneyScreenHistory} from '@/hooks/useJourneyScreenHistory';
import React,{useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {sessionStore} from '@/lib/localData';
import {sceneHandoff} from '@/lib/changeSceneHandoff';
import {recordHandoffDecision} from '@/lib/flagshipMemory';
import {useFreeQuota} from '@/hooks/useFreeQuota';
import IntensityDial from '@/components/IntensityDial';
import FlowHomeButton from '@/components/FlowHomeButton';
import {Button} from '@/components/ui/button';
export default function ChangeSceneFollowup(){
 const location=useLocation(),navigate=useNavigate();
 const query=new URLSearchParams(location.search),token=query.get('session'),request=query.get('practice');
 const [session,setSession]=useState(null),[loaded,setLoaded]=useState(false);
 const initial=globalThis.history?.state?.scene_followup;
 const saved=initial?.token===token?initial:null;
 const [step,setStep]=useState(['mood','distress','setting','time','longer','result'].includes(saved?.step)?saved.step:'distress');

 const [mood,setMood]=useState(saved?.mood??null),[distress,setDistress]=useState(saved?.distress??null),[setting,setSetting]=useState(saved?.setting||''),[time,setTime]=useState(saved?.time??null),[longerJourney,setLongerJourney]=useState(saved?.longerJourney===true),[confirmed,setConfirmed]=useState(saved?.confirmed===true);
 const [readError,setReadError]=useState(''),[retry,setRetry]=useState(0);
 const {allowed,isPremium,loading}=useFreeQuota();
 useEffect(()=>{let live=true;setReadError('');setLoaded(false);sessionStore.list('-created_date',100).then(records=>{if(live){const found=records.find(s=>s.intervention_outcome?.handoffToken===token&&s.pathway?.includes('changeScene'))||null;setSession(found);if(!saved){setMood(typeof found?.intensity_end==='number'?found.intensity_end:null);if(found?.intensity_end==null)setStep('mood');}setLoaded(true);}}).catch(()=>{if(live){setReadError("Your saved check-in could not be read. Nothing has been removed.");setLoaded(true);}});return()=>{live=false};},[token,retry]);
 useJourneyScreenHistory('scene-followup',step,next=>{if(['mood','distress','setting','time','longer','result'].includes(next))setStep(next);});
 useEffect(()=>{const state=globalThis.history?.state;if(!state)return;try{globalThis.history.replaceState({...state,scene_followup:{token,step,mood,distress,setting,time,longerJourney,confirmed}},'');}catch{/* In-app answers remain available. */}},[token,step,mood,distress,setting,time,longerJourney,confirmed]);
 const next=sceneHandoff(session,request,{mood,distress,location:setting,timeMin:time,longerJourney,confirmed});
 const canAccess=!loading&&(isPremium||allowed>0);
 const resetConfirmation=()=>setConfirmed(false);
 const title=step==='mood'?'How is your mood right now?':step==='distress'?'How distressed are you right now?':step==='setting'?'Where are you now?':step==='time'?'How much time do you have?':step==='longer'?'Would you like to consider a longer journey?':'Your next option';
 const onward=()=>{if(step==='mood'){setStep('distress');}else if(step==='distress')setStep('setting');else if(step==='setting')setStep('time');else if(step==='time'&&request==='dear2100')setStep('longer');else {setConfirmed(true);setStep('result');}};
 const back=()=>{const order=['mood','distress','setting','time',...(request==='dear2100'?['longer']:[]),'result'];const index=order.indexOf(step);if(index>0)setStep(order[index-1]);else navigate('/library');};
 const disabled=step==='mood'?mood==null:step==='distress'?distress==null:step==='setting'?!setting:step==='time'?time==null:false;
 return <main className="calmbg min-h-dvh px-5 py-6"><div className="mx-auto flex max-w-lg flex-col gap-5"><div className="flex items-center justify-between"><button type="button" className="min-h-11 underline" onClick={back}>Back</button><FlowHomeButton/></div>
 <h1 className="font-heading text-4xl leading-tight text-primary">{title}</h1>
 {!loaded?<p role="status">Loading your saved check-in…</p>:readError?<div role="alert"><p>{readError}</p><Button onClick={()=>setRetry(value=>value+1)}>Try reading again</Button></div>:!session?<><p>This Change the Scene check-in is no longer available.</p><Button onClick={()=>navigate('/library')}>Open the library</Button></>:<>
 {step==='mood'?<><p className="text-muted-foreground">An honest current mood rating.</p><IntensityDial value={mood} direction="lift" onChange={value=>{setMood(value);resetConfirmation();}}/></>:step==='distress'?<><p className="text-muted-foreground">Separate from your mood rating.</p><label className="grid gap-2"><span className="sr-only">Current distress</span><select aria-label="Current distress" className="min-h-14 w-full rounded-xl border bg-card px-3 text-lg" value={distress??''} onChange={e=>{setDistress(e.target.value===''?null:Number(e.target.value));resetConfirmation();}}><option value="">Choose a rating</option>{Array.from({length:11},(_,i)=><option key={i} value={i}>{i}{i===0?' · None':i===10?' · Extreme':''}</option>)}</select></label>{mood!=null&&<button type="button" className="min-h-11 text-left underline" onClick={()=>{setStep('mood');}}>Change my mood rating ({mood}/10)</button>}</>:step==='setting'?<label className="grid gap-2"><span className="sr-only">Current setting</span><select aria-label="Current setting" className="min-h-14 w-full rounded-xl border bg-card px-3 text-lg" value={setting} onChange={e=>{setSetting(e.target.value);resetConfirmation();}}><option value="">Choose a setting</option><option value="home">Home</option><option value="work">Work</option><option value="public">In public</option></select></label>:step==='time'?<label className="grid gap-2"><span className="sr-only">Time available now</span><select aria-label="Time available now" className="min-h-14 w-full rounded-xl border bg-card px-3 text-lg" value={time??''} onChange={e=>{setTime(e.target.value===''?null:Number(e.target.value));resetConfirmation();}}><option value="">Choose time</option>{[2,3,5,10,15,20].map(i=><option key={i} value={i}>{i} minutes</option>)}</select></label>:step==='longer'?<><p className="text-muted-foreground">Happy Bump comes first. A fresh check-in there determines whether Dear 2100 is offered.</p><div className="grid gap-3">{[[true,'Yes, I would like to consider it'],[false,'No, keep the next practice short']].map(([value,label])=><button type="button" key={label} aria-pressed={longerJourney===value} className="min-h-12 rounded-2xl border bg-card p-4 text-left" onClick={()=>{setLongerJourney(value);resetConfirmation();}}>{label}</button>)}</div></>:next?<><p className="text-primary">{next.intervention.name} · {next.intervention.durationMin} minutes</p><p className="text-muted-foreground">Your Change the Scene session is saved. Starting this practice is optional.</p><Button className="min-h-14 w-full rounded-full text-lg" disabled={!canAccess} onClick={()=>{recordHandoffDecision('changeScene',next.intervention.id,'accepted');navigate('/reset',{state:next.entry});}}>Open {next.intervention.name}</Button>{!canAccess&&!loading&&<Button variant="outline" onClick={()=>navigate('/plus')}>View access options</Button>}</>:<p className="text-primary" role="status">This practice does not fit these answers and the current safety or time limits. You can finish here or change an answer.</p>}
 {step!=='result'&&<Button className="min-h-14 w-full rounded-full text-lg" disabled={disabled} onClick={onward}>{step==='time'&&request!=='dear2100'||step==='longer'?'Check what fits':'Continue'}</Button>}
 <button type="button" className="min-h-11 underline" onClick={()=>navigate('/',{replace:true})}>Finish here</button>
 </>}
 </div></main>;
}
