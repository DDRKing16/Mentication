import { useState } from 'react';
import { ArrowRight, Check, Eye, Ear, Hand, Pencil } from 'lucide-react';
import { OUTSIDE_ANCHORS } from '@/lib/experientialCare';
import './experiential-care.css';

export function PracticeButton({ children, detail, ...props }) {
  return <button type="button" className="xr-primary" {...props}><span>{children}{detail && <small>{detail}</small>}</span><ArrowRight size={19} aria-hidden="true"/></button>;
}
export function PracticeLink({ children, ...props }) { return <button type="button" className="xr-link" {...props}>{children}</button>; }
export function PracticeHeading({ flow, eyebrow, children, body }) {
  return <><p className="xr-eyebrow">{eyebrow}</p><h1 ref={flow.heading} tabIndex={-1} className="xr-heading">{children}</h1>{body && <p className="xr-body">{body}</p>}</>;
}
export function ThoughtWords({ flow, framed = true, phrase, compact = false, heading = false }) {
  const Words = heading ? 'h1' : 'p';
  return <div className={`uh-words ${compact ? 'is-compact' : ''}`}><span>{framed ? phrase : 'The thought'}</span><Words ref={heading ? flow.heading : undefined} tabIndex={heading ? -1 : undefined}>{flow.s.notice || 'My own thought, held in mind'}</Words></div>;
}
export function OutsideAnchor({ flow, contextualCue }) {
  const { s } = flow;
  const [naming, setNaming] = useState(false);
  const icons = { object: Eye, sound: Ear, support: Hand };
  return <div className="xr-anchor"><div className="xr-anchor-choices" role="group" aria-label="Choose an outside anchor">{Object.entries(OUTSIDE_ANCHORS).map(([key, anchor]) => { const Icon = icons[key]; return <button type="button" key={key} aria-pressed={s.anchorType === key} aria-label={anchor.name} onClick={() => flow.patch({ anchorType: key, anchorText: '', anchorNoticed: false })}><Icon size={18} aria-hidden="true"/>{anchor.label}{s.anchorType === key && <Check size={13} aria-hidden="true"/>}</button>; })}</div>
    {s.anchorType && <><p className="xr-anchor-cue">{contextualCue || OUTSIDE_ANCHORS[s.anchorType].cue}</p><PracticeLink aria-expanded={naming} onClick={() => setNaming(!naming)}><Pencil size={13} aria-hidden="true"/>{s.anchorText ? 'Change my anchor' : 'Name what I notice'}</PracticeLink>{naming && <label className="xr-label">My outside anchor<input maxLength={140} value={s.anchorText} placeholder={OUTSIDE_ANCHORS[s.anchorType].example} onChange={event => flow.patch({ anchorText: event.target.value, anchorNoticed: false })}/></label>}</>}
  </div>;
}
export function DirectionChoices({ flow, choices, choose }) {
  const [own, setOwn] = useState(false);
  return <div className="xr-direction"><div className="xr-action-choices" role="group" aria-label="Choose a useful next step">{choices.map(step => <button type="button" key={step.action} aria-pressed={flow.s.action === step.action} onClick={() => choose(step.action)}><span><strong>{step.label}</strong><small>{step.detail}</small></span><ArrowRight size={18} aria-hidden="true"/></button>)}</div><PracticeLink aria-expanded={own} onClick={() => setOwn(!own)}>Choose my own step</PracticeLink>{own && <><label className="xr-label">My useful next step<input autoFocus maxLength={300} value={flow.s.action} placeholder="Something small I want to return to" onChange={event => flow.patch({ action: event.target.value, actionStatus: null })}/></label><PracticeButton disabled={!flow.s.action.trim()} onClick={() => choose(flow.s.action.trim())}>Use this step</PracticeButton></>}</div>;
}
export function PracticePrivacy() { return <p className="xr-privacy">Your words stay on this device. Exit keeps a draft for 24 hours after your last change. Finish clears the draft; Save keeps a separate card.</p>; }
