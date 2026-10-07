import { checkpointFor, careCheckpoints } from '@/lib/practiceCheckpoints';
import { ArrowRight, Check } from 'lucide-react';
import { CompassionVisual, ThoughtVisual, FeelingVisual } from './CareVisuals';
import { CareFrame } from './CarePracticeFrame';
import useSingleQuestionCare from './useSingleQuestionCare';
import { CARE_PRACTICES } from '@/lib/carePractices';
import { COMPASSION_STARTERS, CARE_ACTIONS, compassionateSuggestions, makeRoomPhrase } from '@/lib/carePracticeDesign';
import { MIND_PATTERNS, UNHOOK_STEPS, ROOM_STEPS, OUTSIDE_ANCHORS, mindPattern, mindPhrase, actionAttention, attentionTarget, anchorName, assessmentText } from '@/lib/experientialCare';
import { careNextAfterNotice, careSavedMatches } from '@/lib/careQuestionFlow';
import { careSavedWorkRows } from '@/lib/careSavedWork';
import './single-question-care.css';

function Prompt({ flow, title, body, kind = 'question', children }) {
  return <section className="cq-screen" data-care-screen={flow.screen} data-screen-kind={kind}>
    <p className="cq-eyebrow">{kind === 'question' ? 'Choose what fits' : kind === 'practice' ? 'A moment of practice' : 'Your practice'}</p>
    <h1 ref={flow.heading} id={`cq-heading-${flow.id}`} tabIndex={-1}>{title}</h1>
    {body && <p className="cq-body">{body}</p>}{children}
  </section>;
}
function Primary({ children, ...props }) { return <button type="button" className="cq-primary" {...props}><span>{children}</span><ArrowRight size={18} aria-hidden="true"/></button>; }
function Secondary({ children, ...props }) { return <button type="button" className="cq-secondary" {...props}>{children}</button>; }
function Choices({ flow, items, columns = false }) {
  return <div className={`cq-choices${columns ? ' cq-columns' : ''}`} role="group" aria-labelledby={`cq-heading-${flow.id}`}>
    {items.map((item, index) => <button type="button" key={item.label} aria-label={item.label} aria-describedby={item.detail ? `cq-choice-${flow.id}-${index}` : undefined} data-care-answer aria-pressed={item.selected || undefined} onClick={item.choose}><span>{item.label}{item.detail && <small id={`cq-choice-${flow.id}-${index}`}>{item.detail}</small>}</span>{item.selected ? <Check size={18} aria-hidden="true"/> : <ArrowRight size={17} aria-hidden="true"/>}</button>)}
  </div>;
}
function Words({ label, children, practice = false }) {
  return <div className={`cq-words${practice ? ' cq-practice-words' : ''}`} data-long={String(children || '').length > 150 || undefined}><span>{label}</span><p>{children}</p></div>;
}
function Editor({ label, value, change, max = 300 }) {
  return <label className="cq-editor">{label}<textarea data-care-editor autoFocus rows={3} maxLength={max} value={value} onChange={event => change(event.target.value)}/></label>;
}
function Stop({ flow, label = 'Stop and return to the room' }) {
  return <Secondary onClick={() => flow.advance('orient', { allowance: null })}>{label}</Secondary>;
}
const BEGIN = {
  selfCompassion: ['Try a voice on your side.', 'Bring one harsh line. Try believable words, then one supportive action.'],
  unhook: ['Hear the thought. Choose your next move.', 'Name what your mind is doing, then practise returning attention to a useful step.'],
  makeRoom: ['Room for a feeling. Room for your life.', 'Begin with your surroundings. Try a gentle moment of allowing, then an everyday step.'],
};
function Intro({ flow }) {
  return <Prompt flow={flow} kind="instruction" title={BEGIN[flow.id][0]} body={BEGIN[flow.id][1]}><div className="cq-intro-object">{flow.id === 'selfCompassion' ? <CompassionVisual s={flow.s}/> : flow.id === 'unhook' ? <ThoughtVisual s={flow.s}/> : <FeelingVisual s={flow.s} mode="intro"/>}</div><Primary onClick={() => flow.advance('before')}>Begin</Primary><details className="cq-privacy"><summary>Your private draft</summary><p>Your words stay on this device. Exit keeps a draft for 24 hours after your last change. Finish clears it; saving keeps a separate card.</p></details>{flow.saved && <Secondary onClick={flow.openSaved}>Open my saved card</Secondary>}<Secondary onClick={() => flow.advance('options')}>Practice options</Secondary></Prompt>;
}
function Rating({ flow }) {
  const config = CARE_PRACTICES[flow.id], before = flow.screen === 'before';
  const value = before ? flow.s.before : flow.s.after;
  const answer = rating => flow.advance(before ? 'notice' : 'card', before ? { before: rating } : { after: rating });
  return <Prompt flow={flow} title={config.question} body="Choose a number to continue, or leave this rating blank."><fieldset className="cq-rating" aria-labelledby={`cq-heading-${flow.id}`}><legend className="sr-only">{config.question}</legend><div>{Array.from({ length: 11 }, (_, n) => <button type="button" data-care-answer key={n} aria-label={`${n} of 10`} aria-pressed={value === n} onClick={() => answer(n)}>{n}</button>)}</div><p><span>0 · {config.left}</span><span>10 · {config.right}</span></p></fieldset><Secondary onClick={() => answer(null)}>Skip rating</Secondary></Prompt>;
}
function Notice({ flow }) {
  const { s, id } = flow, config = CARE_PRACTICES[id];
  const reset = notice => ({ notice, noticeConfirmed:false, responseConfirmed:false, perspective: '', practiceTaken: false, responseRead: false, defusionStep: 0, distance: 'near', anchorNoticed: false, allowance: null });
  const choose = notice => flow.advance(careNextAfterNotice(id), reset(notice));
  const values = id === 'selfCompassion' ? COMPASSION_STARTERS.map(item => item.line) : config.notices;
  const own = flow.screen === 'notice-own';
  return <Prompt flow={flow} title={config.noticeTitle} body={id === 'makeRoom' ? 'Choose a manageable feeling. No need to revisit how it began.' : 'Choose familiar words, or use your own.'}>
    {own ? <><Editor label={config.noticeLabel} value={s.notice} change={notice => flow.patch(reset(notice))}/><Primary disabled={!s.notice.trim()} onClick={() => choose(s.notice)}>Use these words</Primary></> : <Choices flow={flow} items={[...values.map(text => ({ label: text, selected: s.notice === text, choose: () => choose(text) })), { label: 'Use my own words', choose: () => flow.advance('notice-own') }, { label: id === 'makeRoom' ? 'Leave the feeling unnamed' : id === 'unhook' ? 'Keep the words in my mind' : 'Keep the line in my mind', choose: () => choose('') }]}/>}
  </Prompt>;
}
function Response({ flow }) {
  const { s } = flow, own = flow.screen === 'response-own';
  const choose = perspective => flow.advance('say', { perspective, responseRead: false, practiceTaken: false });
  return <Prompt flow={flow} title="What caring words can you believe?" body="Offer yourself the care you would offer someone you care about.">{own ? <><Editor label="A response I can believe" value={s.perspective} change={perspective => flow.patch({ perspective, responseConfirmed:false, responseRead: false, practiceTaken: false })}/><Primary disabled={!s.perspective.trim()} onClick={() => choose(s.perspective)}>Use these words</Primary></> : <Choices flow={flow} items={[...compassionateSuggestions(s.notice).slice(0, 2).map(text => ({ label: text, selected: s.perspective === text, choose: () => choose(text) })), { label: 'Write a response I can believe', choose: () => flow.advance('response-own') }, { label: 'Choose care without the words', choose: () => flow.advance('action') }]}/>}</Prompt>;
}
function Tone({ flow }) {
  return <Prompt flow={flow} title="What tone would help you say it?" body="Try the tone you could offer someone you care about."><Choices flow={flow} items={['steady','gentle'].map(tone => ({ label: tone === 'steady' ? 'Steady' : 'Gentle', detail: tone === 'steady' ? 'Calm and clear.' : 'Soft and unhurried.', selected: flow.s.responseTone === tone, choose: () => flow.advance('say', { responseTone: tone }) }))}/></Prompt>;
}
function Say({ flow }) {
  return <Prompt flow={flow} kind="practice" title="Say the response slowly." body={`Try a ${flow.s.responseTone} voice, as if speaking to someone you care about.`}><CompassionVisual s={flow.s} mode="practice"/><details className="cq-tone-options"><summary>Try a different tone</summary><div className="cq-tone-choices">{["steady","gentle"].map(tone => <button type="button" key={tone} aria-pressed={flow.s.responseTone === tone} onClick={() => flow.patch({responseTone:tone})}>{tone === "steady" ? "Steady" : "Gentle"}</button>)}</div></details><Primary onClick={() => flow.advance('action', { practiceTaken: true, responseRead: true })}>I tried saying these words</Primary><Secondary onClick={() => flow.advance('response')}>Change the words</Secondary><Secondary onClick={() => flow.advance('action')}>Choose care without the words</Secondary></Prompt>;
}
function Pattern({ flow }) {
  return <Prompt flow={flow} title="What is your mind doing with this thought?" body="Name the process without deciding whether the thought is true."><Words label="The thought">{flow.s.notice || 'My own thought, held in mind'}</Words><Choices flow={flow} columns items={MIND_PATTERNS.map(item => ({ label: item.label, detail: item.hint, selected: !!flow.s.perspective && mindPattern(flow.s.perspective).id === item.id, choose: () => flow.advance('frame', { perspective: mindPhrase(item.id, flow.s.notice), defusionStep: 1 }) }))}/></Prompt>;
}
function Frame({ flow }) {
  return <Prompt flow={flow} kind="practice" title="Try hearing these as words." body="Say the whole phrase quietly, or in your head."><ThoughtVisual s={flow.s} mode="thought"/><Primary onClick={() => flow.advance('action', { defusionStep: 2, practiceTaken: true, distance: 'beside' })}>I tried saying it this way</Primary><Stop flow={flow}/></Prompt>;
}
function Action({ flow }) {
  const { s, id } = flow, own = flow.screen === 'action-own';
  const suggestions = id === 'selfCompassion' ? CARE_ACTIONS.selfCompassion : id === 'unhook' ? UNHOOK_STEPS : ROOM_STEPS;
  const outsideOnly = s.careTrail.slice(-2).includes('orient');
  const choose = action => flow.advance(id === 'unhook' && !outsideOnly ? 'anchor' : 'status', { action, actionStatus: null, anchorNoticed: id === 'unhook' ? false : s.anchorNoticed });
  const title = id === 'selfCompassion' ? 'What would being on your side look like?' : id === 'unhook' ? 'What do you want attention back for?' : 'What can you do with the feeling here?';
  return <Prompt flow={flow} title={title} body={id === 'makeRoom' ? 'One ordinary step. The feeling does not have to change first.' : 'Choose one small, useful step.'}>
    {own ? <><Editor label="My useful next step" value={s.action} change={action => flow.patch({ action, actionConfirmed:false, actionStatus: null })}/><Primary disabled={!s.action.trim()} onClick={() => choose(s.action)}>Use this step</Primary></> : <Choices flow={flow} items={[...suggestions.map(item => ({ label: item.label, detail: item.detail, selected: s.action === item.action, choose: () => choose(item.action) })), { label: 'Choose my own step', choose: () => flow.advance('action-own') }, { label: 'No next step for now', choose: () => flow.advance('after', { action: '', actionStatus: 'not-now' }) }]}/>}
  </Prompt>;
}
function Anchor({ flow }) {
  return <Prompt flow={flow} title="What can you stay connected to?" body="Choose something ordinary outside the thought or feeling."><Choices flow={flow} items={Object.entries(OUTSIDE_ANCHORS).map(([key, anchor]) => ({ label: anchor.name, selected: flow.s.anchorType === key, choose: () => flow.advance(flow.id === 'unhook' ? 'return' : 'outside', { anchorType: key, anchorText: flow.s.anchorType === key ? flow.s.anchorText : '', anchorNoticed: false }) }))}/></Prompt>;
}
function AnchorOwn({ flow }) {
  const origin = flow.s.careTrail.at(-1), next = ['return','outside','re-hook'].includes(origin) ? origin : flow.id === 'unhook' ? 'return' : 'outside';
  return <Prompt flow={flow} title={flow.s.anchorType === 'sound' ? 'Which sound will you notice?' : flow.s.anchorType === 'support' ? 'What is supporting you?' : 'Which object or colour will you notice?'} body="A few words are enough."><Editor max={140} label="My outside anchor" value={flow.s.anchorText} change={anchorText => flow.patch({ anchorText, anchorNoticed: false })}/><Primary disabled={!flow.s.anchorText.trim()} onClick={() => flow.advance(next)}>Use this anchor</Primary></Prompt>;
}
function Outside({ flow }) {
  return <Prompt flow={flow} kind="practice" title="Notice a detail around you." body={OUTSIDE_ANCHORS[flow.s.anchorType]?.cue}><Words label="My outside anchor" practice>{anchorName(flow.s)}</Words><Primary onClick={() => flow.advance('allow', { allowance: 'small', perspective: makeRoomPhrase(flow.s.notice) })}>Try a gentle moment with this anchor</Primary><Secondary onClick={() => flow.advance('anchor-own')}>Name this anchor</Secondary><Stop flow={flow} label="Stay outside the feeling"/></Prompt>;
}
function Allow({ flow }) {
  return <Prompt flow={flow} kind="practice" title="Let the feeling be here for this moment." body="Notice it lightly, without pushing it away or solving it now."><FeelingVisual s={flow.s} mode="feeling"/><Primary onClick={() => flow.advance('action', { practiceTaken: true })}>I tried letting the feeling be here</Primary><Stop flow={flow}/></Prompt>;
}
function Return({ flow }) {
  const { s } = flow, pulled = flow.screen === 're-hook', attention = actionAttention(s.action);
  const cue = s.anchorText ? 'Notice one ordinary detail of your anchor. Then give your chosen step some attention.' : s.anchorType === attention.preferred ? attention.cue : `${OUTSIDE_ANCHORS[s.anchorType]?.cue || ''} Then return attention to your chosen step.`;
  return <Prompt flow={flow} kind="practice" title={pulled ? 'Notice the thought again. Return gently.' : 'Return attention to your chosen step.'} body={pulled ? 'The same thought can be here while you attend to what you chose.' : cue}><ThoughtVisual s={{...s,anchorText:attentionTarget(s)}} mode="anchor"/><Words label="My chosen step" practice>{s.action}</Words><Primary onClick={() => flow.advance('return-next', { anchorNoticed: true, distance: 'beside', practiceTaken: true })}>{pulled ? 'I brought attention back' : 'I tried returning attention'}</Primary>{!pulled && <Secondary onClick={() => flow.advance('anchor-own')}>Name this anchor</Secondary>}<Stop flow={flow}/></Prompt>;
}
function ReturnNext({ flow }) {
  return <Prompt flow={flow} title="What would you like to do next?" body="You marked a return as tried. You can return again when the thought pulls."><Words label="Where I return">{flow.s.action}</Words><Choices flow={flow} items={[{ label: 'Continue to my next step', choose: () => flow.advance('status') }, { label: 'The thought pulled me back', choose: () => flow.advance('re-hook', { distance: 'near' }) }]}/></Prompt>;
}
function Status({ flow }) {
  return <Prompt flow={flow} title="Is this step planned or done?" body="Choosing an action and doing it are different."><Words label="My chosen step">{flow.s.action}</Words><Choices flow={flow} items={[{ label: 'Keep this as my next step', detail: 'A plan for what comes next.', selected: flow.s.actionStatus === 'planned', choose: () => flow.advance('after', { actionStatus: 'planned' }) }, { label: 'I have done this step', selected: flow.s.actionStatus === 'done', choose: () => flow.advance('after', { actionStatus: 'done' }) }]}/></Prompt>;
}
function Orient({ flow }) {
  return <Prompt flow={flow} kind="instruction" title="Stay with something ordinary." body="Leave the practice aside. Give a nearby object, sound or supporting surface a moment of attention."><Words label="Here around me">{anchorName(flow.s)}</Words><Primary onClick={() => flow.advance('after')}>End practice</Primary><Secondary onClick={() => flow.advance('action')}>Choose a next step</Secondary></Prompt>;
}
function Save({ flow }) {
  return <Prompt flow={flow} title="Keep this practice on your device?" body="A saved card keeps your words and chosen step in Return points."><Choices flow={flow} items={[{ label: 'Save my card on this device', choose: () => { if (flow.save()) flow.advance('card'); } }, { label: 'Continue without saving', choose: () => flow.advance('card') }]}/></Prompt>;
}
function Card({ flow }) {
  const rows = careSavedWorkRows(flow.id, flow.s);
  const checkpoint = checkpointFor(careCheckpoints(flow.id,flow.s));
  const saved = flow.viewingSaved || careSavedMatches(flow.s, flow.saved);
  return <Prompt flow={flow} kind="instruction" title={flow.id === 'selfCompassion' ? 'Keep care close.' : flow.id === 'unhook' ? 'A way back to what you choose.' : 'A feeling and a next step can both be here.'}><div className="cq-card" data-checkpoint={checkpoint.pairs || undefined} data-practice-count={checkpoint.count}>{rows.map(row => <Words key={row.kind} label={row.label}>{row.value}</Words>)}{!rows.length && <p>{CARE_PRACTICES[flow.id].returnLine}</p>}</div><p className="cq-result">{flow.s.practiceTaken ? 'You marked this practice as tried.' : 'You did not mark this practice as tried.'}<br/>{assessmentText(flow.s)}</p>{saved && <p className="cq-saved" role="status">Saved on this device. You can find it in Return points.</p>}<Primary onClick={flow.finish}>{flow.viewingSaved ? 'Close card' : 'Finish'}</Primary>{!saved && !flow.viewingSaved && <Secondary onClick={flow.save}>Save my card on this device</Secondary>}<Secondary onClick={() => flow.advance('options')}>Practice options</Secondary></Prompt>;
}
function Options({ flow }) {
  return <Prompt flow={flow} title="What would you like to do?" body="Your current words are kept unless you choose to clear them."><Choices flow={flow} items={[{ label: 'Return to my practice', choose: flow.back }, { label: 'Start fresh', choose: flow.restart }, ...(flow.saved ? [{ label: 'Delete saved card', choose: flow.deleteSaved }] : []), { label: 'Delete draft and leave', choose: flow.discard }]}/></Prompt>;
}
export default function SingleQuestionCare(props) {
  const flow = useSingleQuestionCare(props.id, props);
  const screens = { intro: Intro, before: Rating, after: Rating, notice: Notice, 'notice-own': Notice, response: Response, 'response-own': Response, tone: Tone, say: Say, pattern: Pattern, frame: Frame, action: Action, 'action-own': Action, anchor: Anchor, 'anchor-own': AnchorOwn, outside: Outside, allow: Allow, return: Return, 're-hook': Return, 'return-next': ReturnNext, status: Status, orient: Orient, save: Save, card: Card, options: Options };
  const Content = screens[flow.screen];
  return <CareFrame flow={flow} focused><Content flow={flow}/></CareFrame>;
}
