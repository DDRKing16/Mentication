import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, Pencil, X } from 'lucide-react';
import JourneyOptions from '@/components/journey/JourneyOptions';
import { CARE_PRACTICES, careOutcome } from '@/lib/carePractices';
import { CARE_ACTIONS } from '@/lib/carePracticeDesign';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import '@/styles/care-practices.css';
import './practice-first-core.css';

export function Primary({ children, ...props }) { return <button type="button" className="care-primary" {...props}>{children}<ArrowRight size={17} aria-hidden="true" /></button>; }
export function Quiet({ children, ...props }) { return <button type="button" className="care-text" {...props}>{children}</button>; }
export function Scene({ flow, eyebrow, title, body, children }) { return <section className="care-scene"><p className="care-eyebrow">{eyebrow}</p><h1 ref={flow.heading} tabIndex={-1}>{title}</h1>{body && <p className="care-body">{body}</p>}{children}</section>; }
export function WordChoices({ label, value, choices, onChange, placeholder = 'A few words are enough' }) {
  const [editing, setEditing] = useState(() => !!value && !choices.includes(value));
  return <div className="care-word-choices"><div className="care-choices" role="group" aria-label={label}>{choices.map(text => <button type="button" key={text} aria-pressed={value === text} onClick={() => { onChange(text); setEditing(false); }}><span>{text}</span>{value === text && <Check size={17} aria-hidden="true" />}</button>)}</div><button type="button" className="care-edit" aria-expanded={editing} onClick={() => setEditing(!editing)}><Pencil size={14} aria-hidden="true" />{editing ? 'Close editor' : 'Use my own words'}</button>{editing && <label className="care-input-label">{label}<textarea maxLength={300} rows={2} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoFocus /></label>}</div>;
}
export function CareFrame({ flow, children, compact = true }) {
  const { prefs } = useAccessibilityPrefs();
  const config = CARE_PRACTICES[flow.id];
  const index = ['arrival','baseline','notice','perspective','practice','action','rerate','complete'].indexOf(flow.s.stage);
  return <div className="care-practice" data-core={compact || undefined} data-care={flow.id} data-care-stage={flow.s.stage} data-reduced-motion={prefs.reducedMotion || undefined} style={{ '--care-accent': config.accent }} onClick={flow.countClick}>
    <div className="care-atmosphere" aria-hidden="true" />
    <header className="care-header"><button type="button" aria-label="Go back" onClick={flow.back}><ArrowLeft size={19} /></button><div><span>MENTICATION</span><p>{compact ? {selfCompassion:'Self-Compassion',unhook:'Unhook',makeRoom:'Make Room'}[flow.id] : config.title}</p></div>{compact && <div className="pf-header-actions" data-care-tools><JourneyOptions id={flow.id}/><button type="button" aria-label="Exit and keep draft" onClick={flow.exit}><X size={19}/></button></div>}{!compact && <button type="button" aria-label="Exit and keep draft" onClick={flow.exit}><X size={19} /></button>}</header>
    <div className="care-progress" role="progressbar" aria-label="Practice progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={Math.max(0,index)}><i style={{ width: `${Math.max(0,index) / 7 * 100}%` }} /></div>
    <main className="care-main">{flow.returning ? <Scene flow={flow} eyebrow="Your unfinished practice" title="You can begin again, right here." body="Your words and choices are still on this device."><div className="care-resume-card"><span>Where you left off</span><p>{{arrival:'Your beginning',baseline:'Before you begin',notice:'Naming what is here',perspective:'Choosing how to respond',practice:'A moment of practice',orient:'Back with the room',action:'Choosing a next step',rerate:'Checking in again',complete:'Your takeaway'}[flow.s.stage]}</p>{flow.s.perspective && <blockquote>{flow.s.perspective}</blockquote>}</div><Primary onClick={flow.resume}>Resume practice</Primary><Quiet onClick={flow.restart}>Start fresh</Quiet><Quiet onClick={flow.discard}>Delete draft and leave</Quiet></Scene> : children}
      {flow.error && <p role="alert" className="care-error">{flow.error}</p>}{flow.message && <p role="status" className="care-notice">{flow.message}</p>}
      {!compact && !flow.returning && flow.s.milestone && <div className="care-milestone" role="status" aria-live="polite" aria-atomic="true" key={`pair-${Math.floor(flow.s.clicks / 2)}`}><i aria-hidden="true" /><p>{flow.s.milestone}</p></div>}
      {!flow.draftOk && <p role="alert" className="care-error">This device could not save your draft. You can continue here, but progress may be lost when you leave.</p>}
      {!flow.returning && !['perspective','practice'].includes(flow.s.stage) && <footer className="care-tools" data-care-tools>{!flow.viewingSaved && !flow.returning && <Quiet onClick={flow.discard}>Delete draft and leave</Quiet>}</footer>}
    </main>
  </div>;
}
function Rating({ flow }) {
  const config = CARE_PRACTICES[flow.id];
  const before = flow.s.stage === 'baseline';
  const value = before ? flow.s.before : flow.s.after;
  return <fieldset className="care-rating"><legend>{config.question}</legend><div>{Array.from({length:11},(_,n) => <button type="button" key={n} aria-label={`${n} of 10`} aria-pressed={value === n} onClick={() => flow.patch(before ? { before:n } : { after:n })}>{n}</button>)}</div><p><span>0 · {config.left}</span><span>10 · {config.right}</span></p></fieldset>;
}
const INTRO = {
  selfCompassion: ['A kinder way to be on your side.', 'Bring one harsh line. Try a believable response and one act of care.'],
  unhook: ['A thought can be here. You can still choose.', 'Try a little distance from the words that keep pulling you in.'],
  makeRoom: ['A little room for what you feel.', 'Stay with the world around you as you gently allow a manageable feeling.'],
};
const TAKEAWAY_LABELS = { selfCompassion:['When the critic says','My caring response','One act of care'], unhook:['When my mind says','My noticing phrase','Where I return my attention'], makeRoom:['The feeling I noticed','A phrase to make room','What I choose with it here'] };
export function SharedScene({ flow }) {
  const { s, id } = flow;
  if (s.stage === 'arrival') return <Scene flow={flow} eyebrow="A few minutes · Your pace" title={INTRO[id][0]} body={INTRO[id][1]}><Primary onClick={() => flow.go('baseline')}>Begin</Primary>{flow.saved && <Quiet onClick={flow.openSaved}>Open my saved card</Quiet>}<p className="care-privacy">Your words stay on this device. A draft lasts 24 hours after your last change. Finish clears it. Save keeps a separate card.</p></Scene>;
  if (s.stage === 'baseline' || s.stage === 'rerate') return <Scene flow={flow} eyebrow={s.stage === 'baseline' ? 'Before we begin' : 'After your practice'} title={s.stage === 'baseline' ? 'Where are you, right now?' : 'What is true for you now?'} body={s.stage === 'baseline' ? 'Choose a number or leave this blank.' : 'The same question. No particular result is expected.'}><Rating flow={flow} /><Primary onClick={() => flow.go(s.stage === 'baseline' ? 'notice' : 'complete')}>Continue</Primary><Quiet onClick={() => flow.go(s.stage === 'baseline' ? 'notice' : 'complete', s.stage === 'baseline' ? {before:null} : {after:null})}>Skip rating</Quiet></Scene>;
  if (s.stage === 'action') return <Scene flow={flow} eyebrow={id === 'selfCompassion' ? 'Care becomes an action' : id === 'unhook' ? 'Choose your direction' : 'With the feeling here'} title={id === 'selfCompassion' ? 'What would being on your side look like?' : id === 'unhook' ? 'Where does your attention belong next?' : 'What is one thing you want to do next?'} body="Make it small enough for now."><div className="care-action-choices" role="group" aria-label="A useful next step">{CARE_ACTIONS[id].map(item => <button key={item.label} type="button" aria-pressed={s.action === item.action} onClick={() => flow.patch({action:item.action,actionStatus:null})}><span>{item.label}<small>{item.detail}</small></span>{s.action === item.action ? <Check size={19} aria-hidden="true"/> : <ArrowRight size={17} aria-hidden="true"/>}</button>)}</div>{s.action && <label className="care-input-label care-action-edit">My next step<input maxLength={300} value={s.action} onChange={e=>flow.patch({action:e.target.value,actionStatus:null})} /></label>}{!s.action && <label className="care-input-label care-action-edit">Or choose my own step<input maxLength={300} value={s.action} placeholder="One small, useful action" onChange={e=>flow.patch({action:e.target.value})} /></label>}<Primary disabled={!s.action.trim()} onClick={()=>flow.go('rerate',{actionStatus:'planned'})}>Keep this as my next step</Primary><Quiet disabled={!s.action.trim()} onClick={()=>flow.go('rerate',{actionStatus:'done'})}>I have done this step</Quiet><Quiet onClick={()=>flow.go('rerate',{action:'',actionStatus:'not-now'})}>No next step for now</Quiet></Scene>;
  if (s.stage === 'orient') return <Scene flow={flow} eyebrow="Back with your surroundings" title="Stay with something ordinary." body="Look at an object nearby. Notice its edges or colour. Keep your attention outside for a moment."><div className="care-orient-field" aria-hidden="true"><span/><i/></div><Primary onClick={()=>flow.go('action')}>Choose a next step</Primary><Quiet onClick={()=>flow.go('rerate')}>End practice</Quiet></Scene>;
  if (s.stage === 'complete') {
    const outcome = careOutcome(id,s); const labels=TAKEAWAY_LABELS[id];
    return <Scene flow={flow} eyebrow={flow.viewingSaved ? 'Your saved practice' : 'A response to return to'} title={id==='selfCompassion'?'Keep care close.':id==='unhook'?'Your way back to what matters.':'Room for a feeling. Room for a next step.'}>
      <div className={`care-takeaway care-takeaway--${id}`}>{s.notice && <div className="care-takeaway-row"><span>{labels[0]}</span><p>{s.notice}</p></div>}{s.perspective && (id !== 'makeRoom' || s.practiceTaken) && <div className="care-takeaway-row care-takeaway-response"><span>{labels[1]}</span><p>{s.perspective}</p></div>}{s.anchorType && <div className="care-takeaway-row"><span>My anchor in the room</span><p>{s.anchorText || {object:'An ordinary object',sound:'A sound in the room',support:'The surface supporting me'}[s.anchorType]}</p></div>}{s.action && <div className="care-takeaway-row"><span>{labels[2]} · {s.actionStatus === 'done' ? 'Done' : s.actionStatus === 'planned' ? 'Planned' : 'Chosen'}</span><p>{s.action}</p></div>}{!s.perspective && <p className="care-takeaway-empty">You can return to one ordinary thing nearby, then choose your next small step.</p>}</div>
      <p className="care-tried-status">{s.practiceTaken ? 'You marked this practice as tried.' : 'You did not mark this practice as tried.'}</p><p className="care-comparison">{outcome.change===null?'One or both ratings were blank, so there is no score comparison.':`${s.before} → ${s.after} / 10 · ${outcome.change===0?'You reported no change.':outcome.change<0?'You reported less difficulty.':'You reported more difficulty.'}`}</p>
      <Primary onClick={flow.finish}>{flow.viewingSaved?'Close card':'Finish'}</Primary>{!flow.viewingSaved && <button type="button" className="care-save" onClick={flow.save}><Bookmark size={17} aria-hidden="true"/>Save this card on my device</button>}{flow.saved && <Quiet onClick={flow.deleteSaved}>Delete saved card</Quiet>}<Quiet onClick={flow.restart}>Practise again</Quiet>
    </Scene>;
  }
  return null;
}
