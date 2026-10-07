import { useJourneyScreenHistory } from '@/hooks/useJourneyScreenHistory';
import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useEffect, useRef, useState } from "react";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useGuideVoice } from "@/hooks/useGuideVoice";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import { getActiveFlagship, saveActiveFlagship, clearActiveFlagship, rememberFlagshipEvent } from "@/lib/flagshipMemory";
import { getNarration } from "@/lib/narrationService";
import { voiceFor } from "@/lib/spoken";
import { SCENE_ACTIONS, restoreSceneSession, sceneAction, sceneOutcome } from "@/lib/changeSceneSession";
const ID="changeScene";
const STEPS = [
  {
    accent: "#c46c4d",
    accentRgb: "196, 108, 77",
    title: "Change the Scene",
    eyebrow: "",
    prompt: "Try a small change around you. Skip anything that does not fit.",
    badge: "✦",
    progress: [true, false, false, false, false, false, false, false, false],
    cta: "TAP to SHIFT",
    meta: "about 2 minutes • go at your own pace",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <defs>
          <filter id="nebula-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="nebula-grad-1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a2f9b8" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#a2f9b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#581825" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula-grad-2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#ef4444" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#581825" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="45" cy="50" r="38" fill="url(#nebula-grad-1)" filter="url(#nebula-glow)" />
        <circle cx="85" cy="58" r="42" fill="url(#nebula-grad-2)" filter="url(#nebula-glow)" />
        <circle cx="66" cy="35" r="28" fill="url(#nebula-grad-1)" filter="url(#nebula-glow)" />
        <path d="M25 45 L50 35 L75 55 L105 40 L85 75 L55 70 Z" stroke="rgba(162, 249, 184, 0.4)" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="M50 35 L55 70 M75 55 L55 70" stroke="rgba(162, 249, 184, 0.25)" strokeWidth="0.8" />
        <circle cx="25" cy="45" r="3.5" fill="#a2f9b8" filter="url(#nebula-glow)" />
        <circle cx="50" cy="35" r="2.5" fill="#ffffff" />
        <circle cx="75" cy="55" r="4" fill="#a2f9b8" filter="url(#nebula-glow)" />
        <circle cx="105" cy="40" r="3" fill="#ef4444" filter="url(#nebula-glow)" />
        <circle cx="85" cy="75" r="2" fill="#ffffff" />
        <circle cx="55" cy="70" r="3.5" fill="#a2f9b8" filter="url(#nebula-glow)" />
        <ellipse cx="66" cy="54" rx="55" ry="32" stroke="rgba(162, 249, 184, 0.15)" strokeWidth="1" transform="rotate(-15 66 54)" />
        <circle cx="20" cy="65" r="1.5" fill="#a2f9b8" />
        <circle cx="112" cy="43" r="2" fill="#ef4444" />
      </svg>
    )
  },
  {
    accent: "#5f8a70",
    accentRgb: "95, 138, 112",
    title: "Move, just a little",
    eyebrow: "Now",
    prompt: "Move to a different spot in the room.",
    badge: "1",
    progress: [false, true, false, false, false, false, false, false, false],
    cta: "Moved",
    meta: "1 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="13" y="29" width="44" height="44" rx="13" fill="#fff" stroke="rgba(20,33,30,.12)" strokeWidth="2"/>
        <rect x="77" y="22" width="47" height="47" rx="15" fill="rgba(95,138,112,.08)" stroke="rgba(95,138,112,.20)" strokeWidth="2"/>
        <path d="M37 51h12" stroke="rgba(20,33,30,.16)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M89 42h18" stroke="rgba(20,33,30,.14)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="65" cy="53" r="2" fill="#5f8a70"/>
        <circle cx="71" cy="53" r="2" fill="rgba(20,33,30,.14)"/>
      </svg>
    )
  },
  {
    accent: "#4f89a5",
    accentRgb: "79, 137, 165",
    title: "Get Some Water",
    eyebrow: "Now",
    prompt: "Grab a glass of water. Take a few slow sips.",
    badge: "2",
    progress: [false, false, true, false, false, false, false, false, false],
    cta: "Got it",
    meta: "2 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <path d="M46 24h40l-4 60c-1 8-31 8-32 0l-4-60Z" fill="#fff" stroke="#25312e" strokeWidth="1.6"/>
        <path d="M50 59h32l-2 24c-1 5-27 5-28 0l-2-24Z" fill="#4ea8de" style={{ filter: "drop-shadow(0 0 10px #4ea8de)" }} />
        <ellipse cx="66" cy="59" rx="16" ry="3" fill="rgba(255,255,255,.55)"/>
        <circle cx="60" cy="64" r="1.4" fill="white" opacity=".7"/>
        <circle cx="72" cy="74" r="1" fill="white" opacity=".4"/>
        <circle cx="62" cy="78" r="1.2" fill="white" opacity=".6"/>
      </svg>
    )
  },
  {
    accent: "#7767a1",
    accentRgb: "119, 103, 161",
    title: "Step outside",
    eyebrow: "Now",
    prompt: "Take 30 seconds outside. Bring your phone.",
    badge: "3",
    progress: [false, false, false, true, false, false, false, false, false],
    cta: "I'm outside",
    meta: "3 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="24" y="24" width="38" height="60" rx="2" fill="#fffdf8" stroke="rgba(20,33,30,.12)"/>
        <rect x="37" y="35" width="25" height="49" fill="#fff" stroke="rgba(20,33,30,.12)"/>
        <circle cx="95" cy="44" r="8" stroke="rgba(119,103,161,.3)"/>
        <circle cx="95" cy="44" r="3" fill="rgba(119,103,161,.22)"/>
        <path d="M95 31v-7M95 64v-7M82 44h-7M115 44h-7M86 35l-5-5M109 58l-5-5M104 35l5-5M81 58l5-5" stroke="rgba(119,103,161,.28)" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    accent: "#c46c58",
    accentRgb: "196, 108, 88",
    title: "Send one text",
    eyebrow: "Now",
    prompt: "Send a small text.",
    badge: "4",
    progress: [false, false, false, false, true, false, false, false, false],
    cta: "I'll send one",
    meta: "4 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="18" y="31" width="78" height="48" rx="16" fill="#fff" stroke="rgba(20,33,30,.08)"/>
        <rect x="25" y="37" width="64" height="20" rx="6" fill="#e2f0fe" />
        <text x="57" y="49" textAnchor="middle" fontSize="5" fill="#1e3a8a" fontFamily="system-ui" fontWeight="bold">Have a beautiful day! ✦</text>
        <circle cx="98" cy="34" r="7" fill="rgba(196,108,88,.18)"/>
        <path d="M96 34h4M98 32v4" stroke="#c46c58" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    accent: "#7f916b",
    accentRgb: "127, 145, 107",
    title: "Find a quiet corner",
    titleStyle: { fontSize: "44px" },
    eyebrow: "Now",
    prompt: "Choose somewhere different. Get comfortable and let your body soften.",
    badge: "5",
    progress: [false, false, false, false, false, true, false, false, false],
    cta: "I'm settled",
    meta: "5 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="23" y="20" width="81" height="67" rx="2" fill="#fffdf8" stroke="rgba(20,33,30,.08)"/>
        <ellipse cx="59" cy="67" rx="25" ry="11" fill="rgba(127,145,107,.12)"/>
        <rect x="91" y="52" width="4" height="28" rx="2" fill="rgba(20,33,30,.16)"/>
        <circle cx="93" cy="44" r="8" fill="#f4decf"/>
        <path d="M35 36c7-5 13-5 19 0-6 7-13 7-19 0Z" fill="rgba(127,145,107,.28)"/>
      </svg>
    )
  },
  {
    accent: "#936fba",
    accentRgb: "147, 111, 186",
    title: "Plan one thing",
    eyebrow: "Now",
    prompt: "Plan one thing, anything you'd like to do.",
    badge: "6",
    progress: [false, false, false, false, false, false, true, false, false],
    cta: "Planned",
    meta: "6 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>
        </defs>
        <rect x="25" y="16" width="82" height="76" rx="14" fill="url(#cal-grad)" stroke="rgba(20,33,30,.12)" strokeWidth="1.5" />
        <rect x="25" y="16" width="82" height="20" rx="14" fill="#936fba" />
        <rect x="38" y="10" width="4" height="12" rx="2" fill="#374151" />
        <rect x="64" y="10" width="4" height="12" rx="2" fill="#374151" />
        <rect x="90" y="10" width="4" height="12" rx="2" fill="#374151" />
        <circle cx="42" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="58" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="74" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="90" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="42" cy="68" r="4" fill="#e5e7eb" />
        <circle cx="58" cy="68" r="4" fill="#e5e7eb" />
        <circle cx="74" cy="68" r="7" fill="#936fba" style={{ filter: "drop-shadow(0 0 6px #936fba)" }} />
        <path d="M72 68l1.5 1.5 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
];
export default function ChangeSceneExperience({ intervention, answers, onComplete, onAttemptEvent, onExit }) {
  const [session,setSession]=useState(()=>restoreSceneSession(getActiveFlagship()?.interventionId===ID ? getActiveFlagship().experience : null));
  const [showAlternatives,setShowAlternatives]=useState(false);
  const [draftOk,setDraftOk]=useState(true);
  const [showAdapt,setShowAdapt]=useState(false);
  const [showAccessibility,setShowAccessibility]=useState(false);
  const [audioOn,setAudioOn]=useState(answers?.audio!=='no');
  const heading=useRef(null);
  const dialog=useRef(null);
  const restoreFocus=useRef(null);
  const completed=useRef(false);
  const startedAt=useRef(Date.now());
  const {prefs}=useAccessibilityPrefs();
  const {speak,stop}=useGuideVoice();
  const {step}=session;
  useJourneyScreenHistory(ID,String(step),position=>{
    const value=Number(position);if(Number.isInteger(value)&&value>=0&&value<=7)setSession(current=>({...current,step:value}));
  });
  const current = STEPS[Math.min(step, Math.max(0, STEPS.length - 1))];
  const action=SCENE_ACTIONS[step-1];
  const choice=session.actions[step]?.choice || 'primary';
  const status=session.actions[step]?.status || 'chosen';
  const prompt=action ? action[choice] : step===0 ? STEPS[0].prompt : 'Optional. There is no expected result.';
  const outcome=sceneOutcome(session);
  const handoffToken=useRef(globalThis.crypto?.randomUUID?.() || `scene-${Date.now()}`);
  const narrationAvailable=Boolean(getNarration(prompt)?.url);
  useEffect(()=>{if(!completed.current) setDraftOk(saveActiveFlagship({interventionId:ID,experience:session}));},[session]);
  useEffect(()=>{setShowAlternatives(false);heading.current?.focus();},[step]);
  useEffect(()=>{stop();if(audioOn)speak(prompt,{voice:voiceFor('lift')});return ()=>stop();},[prompt,audioOn,speak,stop]);
  useEffect(()=>{
    if(!showAdapt&&!showAccessibility)return;
    restoreFocus.current=document.activeElement;
    const node=dialog.current;
    const focusable=()=>Array.from(node.querySelectorAll('button:not(:disabled),[tabindex="0"]'));
    focusable()[0]?.focus();
    const handle=(event)=>{
      if(event.key==='Escape'){event.preventDefault();setShowAdapt(false);setShowAccessibility(false);}
      if(event.key==='Tab'){
        const items=focusable(),first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    node.addEventListener('keydown',handle);
    return ()=>{node.removeEventListener('keydown',handle);restoreFocus.current?.focus();};
  },[showAdapt,showAccessibility]);
  const go=(next)=>setSession(s=>({...s,step:Math.max(0,Math.min(7,next))}));
  const record=(event)=>setSession(s=>sceneAction(s,step,event));
  const finish=(target)=>{
    if(completed.current)return;
    completed.current=true;
    stop();
    clearActiveFlagship(ID);
    rememberFlagshipEvent({interventionId:ID,completed:outcome.confirmedActions>0,options:{confirmedActions:outcome.confirmedActions,skippedActions:outcome.skippedActions}});
    onAttemptEvent?.({interventionId:ID,mechanism:intervention.mechanism,action:'completed',startedAt:startedAt.current,exitReason:outcome.confirmedActions?'completed':'skipped',completedPercentage:outcome.confirmedActions/6,timestamp:Date.now()});
    onComplete?.({requireGoalReassessment:true,exitReason:outcome.confirmedActions?'completed':'skipped',helpfulness:session.helpfulness,outcome:{...outcome,...(target?{handoffToken:handoffToken.current}:{})},navigateTo:target?`/scene-followup?practice=${target}&session=${handoffToken.current}`:undefined});
  };
  const changeMechanism=()=>{setShowAdapt(false);finish('different');};
  return <div className={`scene-experience scene-step-${step}`} data-reduced-motion={prefs.reducedMotion || undefined}>
    <style>{SCENE_STYLES}</style>
    <header className="scene-chrome">
      <button aria-label="Go back" onClick={()=>step?go(step-1):onExit?.()}>←</button>
      <span>Mentication · Lift<br/><strong>Change the Scene</strong></span>
      <button aria-label="Accessibility options" onClick={()=>setShowAccessibility(true)}>•••</button>
      <button aria-label="Exit intervention" onClick={onExit}>×</button>
    </header>
    <main className="scene-card">
      {!draftOk&&<p role="status" className="scene-caption">Progress could not be saved in this tab. Keep it open to retain these choices; refreshing may lose them.</p>}
      <nav className="scene-progress" aria-label="Journey progress">
        {['Start','Move','Water','View','Connect','Rest','Plan','Review'].map((label,i)=><div key={label} role="img" aria-label={`${label}: ${session.actions[i]?.status==='done'?'confirmed':session.actions[i]?.status==='skipped'?'skipped':i>0&&i<7?'not confirmed':''}${i===step?', current step':''}`} aria-current={i===step?'step':undefined}><span aria-hidden="true">{i===0?'✦':session.actions[i]?.status==='done'?'✓':session.actions[i]?.status==='skipped'?'−':i}</span><small>{label}</small></div>)}
      </nav>
      <p className="scene-kicker">{step===0?'One small shift at a time':step===7?'Your check-in':`Step ${step} of 6`}</p>
      <h1 ref={heading} tabIndex={-1}>{action?.title || (step===0?'Change the Scene':'Was this useful?')}</h1>
      {step<7 && <div className="scene-art" aria-hidden="true">{current.art}</div>}
      <p className="scene-prompt">{prompt}</p>
      {step===0 ? <>
        <p className="scene-caption">About 2 minutes · go at your own pace</p>
        <button className="scene-primary" onClick={()=>go(1)}>Begin Change the Scene <span aria-hidden="true">▷</span></button>
      </> : step<7 ? <>
        <details open={showAlternatives} onToggle={event=>setShowAlternatives(event.currentTarget.open)} className="scene-options">
          <summary>Choose a different action</summary>
          {['primary','alternative'].map(value=><button key={value} aria-pressed={choice===value} onClick={()=>{record(value);setShowAlternatives(false);}}>{action[value]}{choice===value?' ✓':''}</button>)}
        </details>
        <p className="scene-caption">Choose what fits. Confirm only after you have tried it.</p>
        {status==='done' ? <div className="scene-confirmed"><p role="status">Recorded: {choice==='alternative'?action.alternateDone:action.done}.</p><button onClick={()=>record('undo')}>Undo confirmation</button><button className="scene-primary" onClick={()=>go(step+1)}>Continue</button></div> : <button className="scene-primary" onClick={()=>setSession(s=>({...sceneAction(s,step,'done'),step:step+1}))}>{choice==='alternative'?action.alternateDone:action.done}</button>}
        <button className="scene-secondary" onClick={()=>{setSession(s=>({...sceneAction(s,step,'skip'),step:step+1}));}}>Skip this action</button>
      </> : <>
        <p className="scene-summary">You confirmed {outcome.confirmedActions} of 6 actions{outcome.skippedActions?` and skipped ${outcome.skippedActions}`:''}. Choosing an action alone does not count as doing it.</p>
        <details className="scene-options"><summary>Review or undo your actions</summary>{SCENE_ACTIONS.map((item,i)=><button key={item.title} onClick={()=>go(i+1)}>{item.title} · {session.actions[i+1]?.status==='done'?'confirmed':session.actions[i+1]?.status==='skipped'?'skipped':'not confirmed'}</button>)}</details>
        <fieldset className="scene-feedback"><legend className="sr-only">Was this useful?</legend>{[['helpful','Helpful'],['same','No difference'],['worse','Made things worse'],['unsure','Not sure']].map(([value,label])=><button key={value} aria-pressed={session.helpfulness===value} onClick={()=>setSession(s=>({...s,helpfulness:s.helpfulness===value?null:value}))}>{label}</button>)}</fieldset>
        <p role="status" className="scene-caption">{session.helpfulness==='worse'?'You can stop here. You do not need to try more actions.':session.helpfulness==='same'?'No difference is a valid response.':session.helpfulness==='helpful'?'Keep what was useful; leave the rest.':'There is no expected result. You can leave this unanswered.'}</p>
        <button className="scene-primary" onClick={()=>finish()}>Finish these actions</button>
        {<details className="scene-options"><summary>Explore another practice</summary><p>Finish your check-in first. Availability depends on your setting and current answers.</p><button onClick={()=>finish('happyBump')}>Consider Happy Bump</button><button onClick={()=>finish('dear2100')}>Consider Dear 2100 · longer journey</button></details>}
      </>}
    </main>
    <footer className="scene-controls"><button aria-label={audioOn?'Mute audio':'Enable audio'} aria-pressed={audioOn} onClick={()=>setAudioOn(!audioOn)}>{audioOn?'Audio on':'Audio off'}</button>{audioOn&&!narrationAvailable&&<span className="scene-caption">This instruction is text-only.</span>}<button onClick={()=>setShowAdapt(true)}>This is not helping</button></footer>
    <div className="mx-auto w-full max-w-xl px-5"><JourneyOptions id={ID} onOpen={() => { stop(); setAudioOn(false); }} /></div>
    {showAdapt && <div className="scene-modal" onClick={e=>{if(e.target===e.currentTarget)setShowAdapt(false);}}><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="scene-adapt-heading"><h2 id="scene-adapt-heading">What would fit better?</h2>{step>0&&step<7&&<button onClick={()=>{record(choice==='primary'?'alternative':'primary');setShowAdapt(false);}}>Try the other action</button>}{<button onClick={changeMechanism}>Use a different mechanism</button>}<button onClick={()=>{clearActiveFlagship(ID);stop();onExit?.();}}>Stop deliberately</button><button onClick={()=>setShowAdapt(false)}>Continue here</button></section></div>}
    {showAccessibility&&<div ref={dialog} className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Accessibility options"><AccessibilityPanel onClose={()=>setShowAccessibility(false)} dark /></div>}
  </div>;
}
const SCENE_STYLES=`
.scene-experience{min-height:100dvh;background:#581825;color:#a2f9b8;padding-bottom:32px;font-family:'Hanken Grotesk',sans-serif;}
.scene-chrome{display:flex;align-items:center;gap:8px;padding:16px;max-width:820px;margin:auto}.scene-chrome span{flex:1;text-align:center;font-size:13px}.scene-chrome strong{font-size:18px;font-family:'EB Garamond',serif}
.scene-experience button,.scene-experience summary{min-height:48px;cursor:pointer;font-size:16px;line-height:1.45}.scene-chrome button{min-width:48px;border:1px solid #a2f9b855;border-radius:50%;background:#1c443455;font-size:22px}
.scene-experience :focus-visible{outline:3px solid #f4c95d;outline-offset:4px}.scene-experience h1:focus{outline:none}
.scene-card{position:relative;max-width:640px;margin:8px auto 0;padding:24px 28px 32px;border-radius:28px;border:1px solid #a2f9b840;background:radial-gradient(ellipse at 10% 90%,#a2f9b81a,transparent 60%),#581825;box-shadow:0 24px 64px #22091055;display:flex;flex-direction:column;gap:18px}
.scene-progress{display:flex;gap:4px;justify-content:space-between}.scene-progress>div{flex:1;min-width:0;display:flex;align-items:center;flex-direction:column;font-size:12px;gap:4px}.scene-progress>div:disabled{cursor:default;opacity:.65}.scene-progress>div>span{display:grid;place-items:center;width:26px;height:26px;border:2px solid #a2f9b888;border-radius:50%}.scene-progress [aria-current] span{background:#f4c95d;color:#581825;border-color:#f4c95d}.scene-progress small{font-size:11px}
.scene-kicker{text-align:center;text-transform:uppercase;letter-spacing:.12em;font-size:13px}.scene-card h1{font-family:'EB Garamond',Georgia,serif;font-size:clamp(36px,8vw,52px);line-height:1.07;text-align:center;font-weight:700;letter-spacing:-.025em;margin:0}.scene-art{height:140px;max-width:220px;width:100%;margin:0 auto}.scene-art svg{width:100%;height:100%}.scene-prompt{font-size:21px;line-height:1.45;text-align:center;max-width:480px;margin:auto}.scene-caption{font-size:16px;line-height:1.5;text-align:center;color:inherit;opacity:.85}.scene-primary{background:#a2f9b8;color:#581825;border:2px solid #a2f9b8;border-radius:999px;padding:14px 24px;font-weight:800;box-shadow:0 5px 0 #163c2c;align-self:stretch}.scene-secondary{padding:8px;text-decoration:underline;text-underline-offset:4px}.scene-options{border:1px solid #a2f9b855;border-radius:18px;padding:8px 14px}.scene-options summary{display:list-item;align-content:center;font-weight:600;list-style-position:inside}.scene-options button{display:block;text-align:left;width:100%;padding:12px;border-radius:12px;margin:8px 0;background:#1c4434;color:#a2f9b8;border:1px solid #a2f9b844}.scene-options button[aria-pressed=true]{border-color:#f4c95d}.scene-options p{padding:8px;font-size:16px}.scene-confirmed{display:grid;gap:14px;text-align:center}.scene-confirmed>button:not(.scene-primary){text-decoration:underline}.scene-summary{font-size:18px;line-height:1.5}.scene-feedback{display:grid;grid-template-columns:1fr 1fr;gap:10px}.scene-feedback legend{font-size:20px;margin-bottom:12px}.scene-feedback legend span{font-size:16px}.scene-feedback button{border:1px solid #a2f9b866;border-radius:14px;padding:10px}.scene-feedback [aria-pressed=true]{background:#a2f9b8;color:#581825}.scene-controls{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin:24px 16px 0}.scene-controls button{border:1px solid #a2f9b855;border-radius:999px;padding:10px 20px}.scene-modal{position:fixed;inset:0;z-index:100;background:#000a;display:grid;place-items:center;padding:20px}.scene-modal section{width:100%;max-width:440px;background:#1c4434;border:1px solid #a2f9b8;padding:24px;border-radius:24px;display:grid;gap:14px}.scene-modal h2{font-family:'EB Garamond',serif;font-size:28px}.scene-modal button{padding:12px;border:1px solid #a2f9b866;border-radius:12px;text-align:left}
.scene-step-1,.scene-step-2,.scene-step-3,.scene-step-4{background:#daf1eb;color:#123a30}.scene-step-1 .scene-card,.scene-step-2 .scene-card,.scene-step-3 .scene-card,.scene-step-4 .scene-card{background:radial-gradient(ellipse at 10% 90%,#a2f9b855,transparent 60%),#daf1eb;border-color:#123a3044}.scene-step-1 .scene-chrome button,.scene-step-2 .scene-chrome button,.scene-step-3 .scene-chrome button,.scene-step-4 .scene-chrome button{border-color:#123a3055}.scene-step-1 .scene-progress>div>span,.scene-step-2 .scene-progress>div>span,.scene-step-3 .scene-progress>div>span,.scene-step-4 .scene-progress>div>span{border-color:#123a3088}.scene-modal{color:#a2f9b8}
@media(max-width:680px){.scene-card{margin:0 12px;padding:20px 18px;gap:16px}.scene-art{height:110px}.scene-progress small{display:none}.scene-progress>div{font-size:14px}.scene-prompt{font-size:20px}.scene-chrome{padding:12px}.scene-chrome button{min-width:44px;min-height:44px}.scene-progress>div{min-height:48px}.scene-feedback{grid-template-columns:1fr 1fr}}
html.large-text .scene-experience button,html.large-text .scene-experience p{font-size:1.2rem}html.large-text .scene-prompt{font-size:1.4rem}
`;
