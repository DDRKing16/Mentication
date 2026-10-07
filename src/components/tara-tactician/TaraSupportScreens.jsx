import React, { useState } from 'react';
import { ArrowRight, Bell, Coffee, DoorOpen, Heart, LifeBuoy, Waves } from 'lucide-react';
import { keepSupportField, SUPPORT_CHOICES } from '@/lib/taraSupportPlan';
import { supportsTaraNotifications } from '@/lib/taraCheckInNotifications';

const Button = ({ children, onClick, secondary = false, disabled = false }) => <button type="button" disabled={disabled} className={`tara-action${secondary ? ' tara-action--secondary' : ''}`} data-primary-action={!secondary || undefined} onClick={onClick}>{children}<ArrowRight size={18} aria-hidden="true" /></button>;
const Link = ({ children, onClick }) => <button type="button" className="tara-text-button" onClick={onClick}>{children}</button>;
function Guide({ children, introduction = false }) {
  return <div className="tara-support-guide"><img src="/media/brand/tara-tactician.webp" alt="Tara Tactician, your spaniel guide" /><div><span className="tara-small-label">{introduction ? 'Meet Tara Tactician' : 'Tara · here with your plan'}</span><p>{children}</p></div></div>;
}
function Words({ value, fallback }) { return <p className="tara-wording">{value || fallback}</p>; }
function Card({ label, value, fallback, icon: Icon = Heart }) { return <section className="tara-support-card"><span className="tara-small-label"><Icon size={16} aria-hidden="true" />{label}</span><Words value={value} fallback={fallback} /></section>; }
const STEPS = { 'plan-pause': ['pause', 'plan-regulation'], 'plan-regulation': ['regulation', 'plan-affirmation'], 'plan-affirmation': ['affirmation', 'plan-leave'], 'plan-leave': ['leave', 'plan-help'], 'plan-help': ['help', 'plan-check-ins'] };
const DESCRIPTIONS = {
  pause: 'Choose a pause that is possible for you. You can change it during the situation.',
  regulation: 'Choose something comfortable to return your attention to. You do not have to feel calm to choose your next step.',
  affirmation: 'Choose words you believe enough to use. You can write your own.',
  leave: 'If leaving is safe and possible, how could you end or step away? If it is not, name a way to reduce the demand or get help where you are.',
  help: 'Optional: a person or practical source of help, and what you could ask for. This app does not contact anyone.',
};
export function SupportPlanQuestion({ screen, state, go, pocket }) {
  const [field, next] = STEPS[screen];
  const [draft, setDraft] = useState(state.supportPlan[field]);
  const [custom, setCustom] = useState(!SUPPORT_CHOICES[field] || Boolean(draft && !SUPPORT_CHOICES[field].some(([, , words]) => words === draft)));
  const keep = value => go(keepSupportField(state, field, value), next);
  return <>
    <p className="tara-lead">{DESCRIPTIONS[field]}</p>
    {SUPPORT_CHOICES[field] && !custom && <div className="tara-stack">{SUPPORT_CHOICES[field].map(([id, label, words]) => <button type="button" className="tara-choice tara-answer-choice" key={id} onClick={() => keep(words)}><span className="tara-choice-copy"><span>{label}</span><small>{words}</small></span><ArrowRight size={18} aria-hidden="true" /></button>)}</div>}
    {custom ? <><label className="tara-sr-only" htmlFor="tara-support-words">{field === 'leave' ? 'My leaving or safer alternative plan' : field === 'help' ? 'My help plan' : 'My own support words'}</label><textarea id="tara-support-words" rows={3} maxLength={3000} placeholder={field === 'leave' ? 'A step that would be safe and workable for me…' : field === 'help' ? 'Who or what could help, and what I could ask…' : 'Words or a step that fits me…'} value={draft} onChange={event => setDraft(event.target.value)} /><Button onClick={() => keep(draft)}>{draft.trim() ? 'Keep this step' : 'Continue without adding this'}</Button></> : <Link onClick={() => setCustom(true)}>Write my own</Link>}
    {!custom && <Link onClick={() => go(state, next)}>Skip this step</Link>}
    <Link onClick={pocket}>Keep my first move and finish planning</Link>
  </>;
}
export function CheckInQuestion({ screen, state, go, practise, pocket }) {
  const checkIns = state.checkIns;
  const update = (patch, target) => go({ ...state, checkIns: { ...checkIns, ...patch, startedAt: 0, endsAt: 0, nextAt: 0, status: 'off' } }, target);
  if (screen === 'check-in-duration') return <><p className="tara-lead">Check-ins start when you choose “Use my plan”. They stop at the end of this window or when you finish the situation.</p><div className="tara-stack">{[30, 60, 120].map(duration => <button type="button" className="tara-choice tara-answer-choice" key={duration} onClick={() => { const next = { ...state, checkIns: { ...checkIns, durationMinutes: duration } }; practise(next); }}><span>{duration === 120 ? 'Two hours' : `${duration} minutes`}</span><ArrowRight size={18} aria-hidden="true" /></button>)}</div><Link onClick={pocket}>Use my plan without practising</Link></>;
  return <><div className="tara-check-in-explainer"><Bell size={24} aria-hidden="true"/><p>Keep this plan open to see and answer check-ins. {supportsTaraNotifications() ? 'Optional phone reminders need your permission. Focus, settings or your device may delay or hide them. We cannot guarantee reminders when the app is closed or backgrounded, or your phone is locked.' : 'In this browser, check-ins appear while this plan is open. They do not send notifications or run in the background.'}</p></div><div className="tara-stack">{[10, 20, 30].map(interval => <button type="button" className="tara-choice tara-answer-choice" key={interval} onClick={() => update({ preference: supportsTaraNotifications() ? 'device' : 'in-app', intervalMinutes: interval }, 'check-in-duration')}><span>Check in every {interval} minutes</span><ArrowRight size={18} aria-hidden="true" /></button>)}</div><Link onClick={() => practise({ ...state, checkIns: { ...checkIns, preference: 'off', status: 'off', startedAt: 0, endsAt: 0, nextAt: 0 } })}>No check-ins — practise my plan</Link><Link onClick={pocket}>Use my plan without practising</Link><p className="tara-note">If you return during the chosen window after missing a check-in, one overdue check-in is offered. Check-ins do not monitor your safety or alert another person.</p></>;
}
export function PocketSupport({ state, onEdit }) {
  const plan = state.supportPlan;
  return <details className="tara-details tara-pocket-details"><summary>My support plan · {plan.confirmed.length} chosen steps</summary><div className="tara-detail-body">{[['pause', 'My pause'], ['regulation', 'My grounding step'], ['affirmation', 'My reminder phrase'], ['leave', 'Leaving or a safer alternative'], ['help', 'My help plan']].map(([field, label]) => plan[field] && <Card key={field} label={label} value={plan[field]} />)}<Link onClick={onEdit}>{plan.confirmed.length ? 'Edit my support plan' : 'Add a support plan'}</Link></div></details>;
}
export function TaraSupportScreens({ screen, state, go, onReturn, finishEvent, due, stopCheckIns, notificationBusy, notificationError, now }) {
  const plan = state.supportPlan;
  const expired = state.checkIns.endsAt > 0 && state.checkIns.endsAt < now;
  const support = target => go(state, target);
  if (screen === 'live') return <>
    <Guide introduction>I’m Tara. I’ll help you find a workable next step. You can pause, ask for help or leave when it is safe and possible.</Guide>
    <div className="tara-live-actions" aria-label="Immediate support">
      <button type="button" onClick={() => support('take-break')}><Coffee aria-hidden="true"/><span>I need a break<small>Pause or reduce the demand</small></span><ArrowRight size={18} aria-hidden="true"/></button>
      <button type="button" onClick={() => support('regulate')}><Waves aria-hidden="true"/><span>Help me regulate<small>One grounding step</small></span><ArrowRight size={18} aria-hidden="true"/></button>
      <button type="button" onClick={() => support('leave-support')}><DoorOpen aria-hidden="true"/><span>I need to leave<small>Leave safely or find another option</small></span><ArrowRight size={18} aria-hidden="true"/></button>
    </div>
    <div className="tara-live-tools"><Link onClick={() => support('help-support')}>Help me ask for help</Link><Link onClick={() => support('affirmation-support')}>My reminder phrase</Link></div>
    <Link onClick={() => support('check-in')}>{due ? 'My check-in is ready' : 'Check in now'}</Link>
    {state.checkIns.startedAt > 0 && <div className="tara-check-in-status" role="status"><p>{expired || state.checkIns.status === 'ended' ? 'The check-in window has ended. You can still check in here.' : state.checkIns.status === 'scheduled' ? 'Phone reminders are queued. Keep this plan open for check-ins. We cannot guarantee reminders when the app is closed or backgrounded, or your phone is locked. Open this practice again after tapping a notification.' : state.checkIns.status === 'denied' ? 'Phone permission was not granted. Check-ins are available here while this plan is open.' : ['error', 'unverified'].includes(state.checkIns.status) ? 'Phone check-ins are not confirmed. Use the check-in here while this plan is open.' : 'In-app check-ins are on while this plan is open.'}</p>{notificationError && <p>{notificationError}</p>}{state.checkIns.status !== 'ended' && <Link onClick={stopCheckIns}>{notificationBusy ? 'Stopping check-ins…' : 'Turn check-ins off'}</Link>}</div>}
    <Link onClick={finishEvent}>I’m finished or paused — reflect</Link>
    <Card label="My next move" value={state.plan.do} fallback="Choose the next manageable step, or give yourself a pause." />
  </>;
  if (screen === 'check-in') return <><Guide>How are you doing? Your answer can change what you do next. You do not have to push through.</Guide><div className="tara-stack">{[['okay', 'I’m okay for now', 'live'], ['break', 'I need a break', 'take-break'], ['regulate', 'Help me regulate', 'regulate'], ['leave', 'I need to leave', 'leave-support'], ['help', 'I need help', 'help-support']].map(([answer, label, target]) => <button type="button" className="tara-choice tara-answer-choice" key={answer} onClick={() => go(state, target, answer)}><span>{label}</span><ArrowRight size={18} aria-hidden="true"/></button>)}</div></>;
  if (screen === 'take-break') return <><div className="tara-pause-scene" aria-hidden="true"><Coffee size={40}/><span>A moment with less demand</span></div><Card label={plan.pause ? 'My chosen pause' : 'A pause to consider'} icon={Coffee} value={plan.pause} fallback="If it is safe and possible, pause here or move somewhere with less demand."/><Button onClick={() => support('regulate')}>Help me settle during the pause</Button><Link onClick={onReturn}>Back to my support</Link><Link onClick={() => support('leave-support')}>I need to leave instead</Link><p className="tara-note">No timer to finish. Decide what you need before returning.</p></>;
  if (screen === 'regulate') return <><div className="tara-grounding-scene" aria-hidden="true"><div className="tara-grounding-orb"/><span>One point of attention</span></div><Card label={plan.regulation ? 'My grounding step' : 'Try only if comfortable'} icon={Waves} value={plan.regulation} fallback="Look for one ordinary object. Notice its colour or shape. Keep your breathing comfortable."/><Button onClick={onReturn}>Choose what I need next</Button><Link onClick={() => support('help-support')}>I need more help</Link><p className="tara-note">You can stop or switch if this feels uncomfortable. No improvement is assumed or recorded.</p></>;
  if (screen === 'leave-support') return <><Card icon={DoorOpen} label={plan.leave ? 'My leaving or safer alternative plan' : 'Choose a safe, possible next step'} value={plan.leave} fallback="If leaving is safe and possible, choose one step toward ending or stepping away. If it is not, reduce the demand or seek help where you are."/><p className="tara-lead">Use your judgment about your surroundings. You can ask for practical help, pause in place or change your plan.</p><Button onClick={() => support('help-support')}>Help me find support</Button><Link onClick={finishEvent}>I’m finished or paused — reflect</Link><Link onClick={onReturn}>Back to my support</Link><p className="tara-note">Opening this screen does not record that you left.</p></>;
  if (screen === 'help-support') return <><Card icon={LifeBuoy} label={plan.help ? 'My help plan' : 'A request you can adapt'} value={plan.help} fallback="“I’m having a difficult moment. Could you help me with one practical next step?”"/><p className="tara-lead">If safe and appropriate, contact someone you trust or a suitable source of help yourself. Tara provides built-in guidance and cannot contact, monitor or respond to an emergency.</p><Button onClick={onReturn}>Back to my support</Button><Link onClick={() => support('leave-support')}>Review leaving or another option</Link></>;
  if (screen === 'affirmation-support') return <><div className="tara-affirmation-scene"><Heart size={26} aria-hidden="true"/><Words value={plan.affirmation} fallback="I can choose one manageable step and change the pace."/><span className="tara-small-label">{plan.affirmation ? 'My chosen words' : 'Words you can try'}</span></div><Button onClick={onReturn}>Back to my support</Button><Guide>Use words that fit you. You do not have to make yourself feel differently.</Guide></>;
  return null;
}
