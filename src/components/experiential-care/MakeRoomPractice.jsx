import { useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { ROOM_STEPS, anchorName, roomPhase, assessmentText } from '@/lib/experientialCare';
import { makeRoomPhrase } from '@/lib/carePracticeDesign';
import { PracticeButton, PracticeLink, PracticeHeading, OutsideAnchor, DirectionChoices, PracticePrivacy } from './PracticeSupport';

function FeelingWords({ flow, anchor = true, heading = false }) {
  const Words = heading ? 'h1' : 'h2';
  return <div className="mr-feeling-room"><div className="mr-feeling"><span>The feeling that is here</span><Words ref={heading ? flow.heading : undefined} tabIndex={heading ? -1 : undefined}>{flow.s.notice || 'A feeling, held in mind'}</Words></div>{anchor && flow.s.anchorType && <div className="mr-also-here"><span>Also here, around me</span><strong>{anchorName(flow.s)}</strong></div>}</div>;
}
export function MakeRoomIntro({ flow }) {
  return <section className="xr-experience mr-intro"><PracticeHeading flow={flow} eyebrow="Make room for the feeling" body="Stay connected to the room as you try letting one manageable feeling be here. Then choose an everyday step.">Room for a feeling.<br/><em>Room for your life.</em></PracticeHeading><div className="mr-intro-pair"><span>A feeling can be here.</span><span>So can something I choose to do.</span></div><PracticeButton onClick={() => flow.go('baseline')}>Begin</PracticeButton>{flow.saved && <PracticeLink onClick={flow.openSaved}>Open my saved card</PracticeLink>}<PracticePrivacy/></section>;
}
export function MakeRoomPractice({ flow }) {
  const { s } = flow;
  const phase = roomPhase(s);
  useEffect(() => { flow.heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [phase, flow.heading]);
  return <section className={`xr-experience mr-practice mr-phase-${phase}`} data-room-phase={phase} data-pair={Math.floor(s.clicks / 2)}>
    {phase === 'anchor' ? <>
      <PracticeHeading flow={flow} eyebrow="01 · Begin outside the feeling" body="Choose one ordinary detail around you. Keep your attention there before turning toward the feeling.">Start with<br/><em>the room around you.</em></PracticeHeading>
      <div className="mr-anchor-window"><span>A steady point outside</span><h2>{s.anchorType ? anchorName(s) : 'Something here, now.'}</h2><OutsideAnchor flow={flow}/></div>
      <p className="mr-working-with">The feeling you named: <strong>{s.notice || 'held in mind'}</strong></p>
      <PracticeButton disabled={!s.anchorType} onClick={() => flow.patch({ allowance: 'small', perspective: makeRoomPhrase(s.notice), attentionFocused: false })}>Try a gentle moment with this anchor</PracticeButton>
      <PracticeLink onClick={() => flow.go('action')}>Stay outside the feeling and choose a step</PracticeLink>
    </> : <>
      <p className="xr-eyebrow">02 · A gentle moment of room</p><p className="xr-body">Let the feeling be here for this moment, without trying to push it away.</p>
      <FeelingWords flow={flow} heading/>
      <div className="mr-guidance"><span>Notice it lightly.</span><p>Let it be uncomfortable without solving it now. Keep your connection to {anchorName(s).toLowerCase()}.</p></div>
      <PracticeButton onClick={() => flow.go('action', { practiceTaken: true })}>I tried letting the feeling be here</PracticeButton>
      <PracticeLink onClick={() => flow.go('action')}>Go straight to my next step</PracticeLink>
    </>}
    <PracticeLink className="xr-link xr-stop" onClick={() => flow.go('orient', { allowance: null })}>Too much? Return to the room</PracticeLink>
  </section>;
}
export function MakeRoomAction({ flow }) {
  const { s } = flow;
  const selected = !!s.action.trim() && ['planned', 'done'].includes(s.actionStatus);
  useEffect(() => { flow.heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [selected, flow.heading]);
  const choose = action => flow.patch({ action, actionStatus: 'planned' });
  return <section className="xr-experience mr-action" data-pair={Math.floor(s.clicks / 2)}>
    <p className="xr-eyebrow">03 · Room for what you choose</p><p className="xr-body">{selected ? 'A feeling and an everyday step can be here together.' : 'Choose one small thing you want to do. The feeling does not have to change first.'}</p>
    <FeelingWords flow={flow} heading anchor={selected}/>
    {!selected ? <DirectionChoices flow={flow} choices={ROOM_STEPS} choose={choose}/> : <><p className="mr-step-label">And a step I choose</p><PracticeButton onClick={() => flow.go('rerate', { actionStatus: 'planned' })} detail="Keep as my next step">{s.action}</PracticeButton><div className="xr-secondary-row"><PracticeLink onClick={() => flow.go('rerate', { actionStatus: 'done' })}>I have done this step</PracticeLink><PracticeLink onClick={() => flow.patch({ action: '', actionStatus: null })}>Choose another step</PracticeLink></div></>}
    <div className="xr-safety"><PracticeLink onClick={() => flow.go('rerate', { action: '', actionStatus: 'not-now' })}>No next step for now</PracticeLink><PracticeLink className="xr-link xr-stop" onClick={() => flow.go('orient')}>Return to the room</PracticeLink></div>
  </section>;
}
export function MakeRoomOutside({ flow }) {
  return <section className="xr-experience mr-outside"><PracticeHeading flow={flow} eyebrow="Back with your surroundings" body="Keep attention outside for now. A nearby object, sound or supporting surface is enough.">Stay with<br/><em>something ordinary.</em></PracticeHeading><div className="mr-anchor-window"><span>Here in the room</span><h2>{anchorName(flow.s)}</h2></div><PracticeButton onClick={() => flow.go('action')}>Choose a next step</PracticeButton><PracticeLink onClick={() => flow.go('rerate')}>End practice</PracticeLink></section>;
}
export function MakeRoomFinish({ flow }) {
  const { s } = flow;
  return <section className="xr-experience mr-finish"><PracticeHeading flow={flow} eyebrow={flow.viewingSaved ? 'Your saved practice' : 'A moment to return to'}>Let a feeling be here.<br/><em>Keep a place for your next step.</em></PracticeHeading><FeelingWords flow={flow}/>{s.action && <div className="mr-next-move"><span>My next step · {s.actionStatus === 'done' ? 'Done' : s.actionStatus === 'planned' ? 'Planned' : 'Chosen'}</span><h2>{s.action}</h2></div>}<p className="xr-recipe">Begin with the room. Allow a gentle moment for the feeling. Choose an ordinary action with it here.</p><p className="xr-honest">{s.practiceTaken ? 'You marked making room as tried.' : 'You did not mark making room as tried.'}</p><p className="xr-assessment">{assessmentText(s)}</p><PracticeButton onClick={flow.finish}>{flow.viewingSaved ? 'Close card' : 'Finish'}</PracticeButton>{!flow.viewingSaved && <PracticeLink onClick={flow.save}><Bookmark size={16} aria-hidden="true"/>Save this card on my device</PracticeLink>}{flow.saved && <PracticeLink onClick={flow.deleteSaved}>Delete saved card</PracticeLink>}<PracticeLink onClick={flow.restart}>Practise again</PracticeLink></section>;
}
