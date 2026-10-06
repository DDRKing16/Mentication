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
 const [editMood,setEditMood]=useState(false);
 const [mood,setMood]=useState(null),[distress,setDistress]=useState(null),[setting,setSetting]=useState(''),[time,setTime]=useState(null),[longerJourney,setLongerJourney]=useState(false),[confirmed,setConfirmed]=useState(false);
 const [readError,setReadError]=useState(''),[retry,setRetry]=useState(0);
 const {allowed,isPremium,loading}=useFreeQuota();
 useEffect(()=>{let live=true;setReadError('');setLoaded(false);sessionStore.list('-created_date',100).then(records=>{if(live){const found=records.find(s=>s.intervention_outcome?.handoffToken===token&&s.pathway?.includes('changeScene'))||null;setSession(found);setMood(typeof found?.intensity_end==='number'?found.intensity_end:null);setLoaded(true);}}).catch(()=>{if(live){setReadError("Your saved check-in could not be read. Nothing has been removed.");setLoaded(true);}});return()=>{live=false};},[token,retry]);
 const next=sceneHandoff(session,request,{mood,distress,location:setting,timeMin:time,longerJourney,confirmed});
 const canAccess=!loading&&(isPremium||allowed>0);
 const resetConfirmation=()=>setConfirmed(false);
 return <main className="calmbg min-h-dvh px-5 py-8"><div className="mx-auto flex max-w-lg flex-col gap-6"><FlowHomeButton/>
 <h1 className="font-heading text-3xl text-primary">{request==='dear2100'?'Considering Dear 2100':request==='happyBump'?'Considering Happy Bump':'Try a different mechanism'}</h1>
 {!loaded?<p role="status">Loading your completed check-in…</p>:readError?<div role="alert"><p>{readError}</p><Button onClick={()=>setRetry(value=>value+1)}>Try reading again</Button></div>:!session?<><p>This completed Change the Scene check-in is no longer available.</p><Button onClick={()=>navigate('/library')}>Open the library</Button></>:<>
 <p className="text-muted-foreground">Your Change the Scene session is saved. Starting another practice is optional.</p>
 {request==='dear2100'&&<p className="text-primary">Dear 2100 is a longer reflection. The next step is Happy Bump, followed by a fresh mood and distress check-in. Dear 2100 is offered there only if it fits your current setting and answers.</p>}
 {session.intensity_end!=null&&!editMood?<div className="grid gap-2"><p className="text-primary">Mood from your final check-in: {session.intensity_end} / 10</p><button className="min-h-11 text-left text-primary underline" onClick={()=>setEditMood(true)}>Change my mood rating</button></div>:<><h2 className="font-heading text-2xl text-primary">How is your mood right now?</h2><IntensityDial value={mood} direction="lift" onChange={value=>{setMood(value);resetConfirmation();}}/></>}
 <label className="grid gap-2 text-primary">Current distress<select aria-label="Current distress" className="min-h-12 rounded-xl border bg-card px-3" value={distress??''} onChange={e=>{setDistress(e.target.value===''?null:Number(e.target.value));resetConfirmation();}}><option value="">Choose a rating</option>{Array.from({length:11},(_,i)=><option key={i} value={i}>{i}{i===0?' · None':i===10?' · Extreme':''}</option>)}</select></label>
 <label className="grid gap-2 text-primary">Where are you now?<select aria-label="Current setting" className="min-h-12 rounded-xl border bg-card px-3" value={setting} onChange={e=>{setSetting(e.target.value);resetConfirmation();}}><option value="">Choose a setting</option><option value="home">Home</option><option value="work">Work</option><option value="public">In public</option></select></label>
 <label className="grid gap-2 text-primary">Time available now<select aria-label="Time available now" className="min-h-12 rounded-xl border bg-card px-3" value={time??''} onChange={e=>{setTime(e.target.value===''?null:Number(e.target.value));resetConfirmation();}}><option value="">Choose time</option>{[2,3,5,10,15,20].map(i=><option key={i} value={i}>{i} minutes</option>)}</select></label>
 {request==='dear2100'&&<label className="flex min-h-12 items-center gap-3 text-primary"><input type="checkbox" checked={longerJourney} onChange={e=>{setLongerJourney(e.target.checked);resetConfirmation();}}/>I want to consider a longer journey after Happy Bump</label>}
 <p className="text-muted-foreground">Confirm your current distress, setting and time. A displayed mood starting position is not an answer.</p>
 {!confirmed?<Button className="rounded-full" disabled={mood==null||distress==null||!setting||time==null} onClick={()=>setConfirmed(true)}>Check what fits</Button>:next?<><p className="text-primary">{next.intervention.name} · {next.intervention.durationMin} minutes</p><Button className="rounded-full" disabled={!canAccess} onClick={()=>{recordHandoffDecision('changeScene',next.intervention.id,'accepted');navigate('/reset',{state:next.entry});}}>Open {next.intervention.name}</Button>{!canAccess&&!loading&&<Button variant="outline" onClick={()=>navigate('/plus')}>View access options</Button>}</>:<p className="text-primary" role="status">This practice does not fit these answers and the current safety or time limits. You can finish here or change your answers.</p>}
 <Button variant="outline" className="rounded-full" onClick={()=>navigate('/',{replace:true})}>Finish here</Button>
 </>}
 </div></main>;
}
