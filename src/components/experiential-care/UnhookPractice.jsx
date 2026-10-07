import { useEffect } from 'react';
import { Bookmark, CornerDownLeft, Check } from 'lucide-react';
import { MIND_PATTERNS, UNHOOK_STEPS, mindPattern, mindPhrase, unhookPhase, actionAttention, attentionTarget, anchorName, assessmentText } from '@/lib/experientialCare';
import { PracticeButton, PracticeLink, PracticeHeading, ThoughtWords, OutsideAnchor, DirectionChoices, PracticePrivacy } from './PracticeSupport';

export function UnhookIntro({ flow }) {
  return <section className="xr-experience uh-intro"><PracticeHeading flow={flow} eyebrow="Unhook from the thought" body="Practise hearing a thought as something your mind is doing, then return to something you choose.">A thought is here.<br/><em>You still have a next move.</em></PracticeHeading><div className="uh-intro-path" aria-label="The practice"><span>Hear the words</span><i aria-hidden="true"/><span>Name the pattern</span><i aria-hidden="true"/><span>Return to life</span></div><PracticeButton onClick={() => flow.go('baseline')}>Begin</PracticeButton>{flow.saved && <PracticeLink onClick={flow.openSaved}>Open my saved card</PracticeLink>}<PracticePrivacy/></section>;
}
export function UnhookPractice({ flow }) {
  const { s } = flow;
  const phase = unhookPhase(s);
  const pattern = mindPattern(s.perspective);
  const attention = actionAttention(s.action);
  const pulled = phase === 'attention' && s.distance === 'near';
  useEffect(() => { flow.heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [phase, pulled, flow.heading]);
  const chooseAction = action => flow.patch({ action, actionStatus: 'planned', distance: 'beside', anchorType: null, anchorText: '', anchorNoticed: false });
  return <section className={`xr-experience uh-practice uh-phase-${phase} ${pulled ? 'is-pulled' : ''}`} data-unhook-phase={phase} data-pair={Math.floor(s.clicks / 2)}>
    {phase === 'notice' ? <>
      <p className="xr-eyebrow">01 · Hear the thought as words</p>
      <p className="xr-body">{s.perspective ? 'Try this whole sentence quietly, or in your head.' : 'Read the thought once. Then choose what your mind is doing.'}</p>
      <ThoughtWords flow={flow} framed={!!s.perspective} phrase={`${pattern.phrase}…`} heading/>
      <div className="uh-patterns" role="group" aria-label="What my mind is doing">{MIND_PATTERNS.map(item => <button type="button" key={item.id} aria-pressed={!!s.perspective && pattern.id === item.id} onClick={() => flow.patch({ perspective: mindPhrase(item.id, s.notice), defusionStep: 1 })}><strong>{item.label}</strong><small>{item.hint}</small></button>)}</div>
      {s.perspective && <PracticeButton onClick={() => flow.patch({ defusionStep: 2, practiceTaken: true, distance: 'beside' })}>I tried saying it this way</PracticeButton>}
    </> : phase === 'direction' ? <>
      <PracticeHeading flow={flow} eyebrow="02 · Choose your direction" body="Keep the thought. Choose something that deserves your attention next.">What do you want<br/><em>attention back for?</em></PracticeHeading>
      <div className="uh-noticed"><Check size={16} aria-hidden="true"/><span>You tried noticing it as <strong>{pattern.id === 'noticing' ? 'a thought' : pattern.id}</strong>.</span></div>
      <DirectionChoices flow={flow} choices={UNHOOK_STEPS} choose={chooseAction}/>
      <ThoughtWords flow={flow} phrase={`${pattern.phrase}…`} compact/>
      <PracticeLink onClick={() => flow.patch({ defusionStep: 1 })}>Try the phrase again</PracticeLink>
    </> : <>
      <p className="xr-eyebrow">03 · Return to what you choose</p>
      <p className="xr-body">{pulled ? 'Notice the same thought again. Then gently return to your chosen detail.' : s.anchorNoticed ? 'A return you tried. The thought can come along.' : 'Let the thought be here while you bring attention to this step.'}</p>
      <ThoughtWords flow={flow} phrase={`${pattern.phrase}…`} compact={!pulled} heading={pulled}/>
      <div className="uh-attention" key={`attention-${Math.floor(s.clicks / 2)}`}><span>{s.anchorNoticed ? 'You marked this return as tried' : `Your next move · ${s.actionStatus === 'done' ? 'Done' : 'Planned'}`}</span>{pulled ? <h2>{s.action}</h2> : <h1 ref={flow.heading} tabIndex={-1}>{s.action}</h1>}{s.anchorType && <div className="uh-target"><span>Attention here</span><strong>{attentionTarget(s)}</strong></div>}</div>
      {!s.anchorNoticed && !pulled && <OutsideAnchor flow={flow} contextualCue={s.anchorText ? `Notice one ordinary detail of ${s.anchorText}. Then give your next step some attention.` : s.anchorType === attention.preferred ? attention.cue : undefined}/>}
      {pulled ? <PracticeButton onClick={() => flow.patch({ distance: 'beside', anchorNoticed: true })}>I brought attention back</PracticeButton> : !s.anchorNoticed ? <PracticeButton disabled={!s.anchorType} onClick={() => flow.patch({ anchorNoticed: true, practiceTaken: true })}>I tried returning attention</PracticeButton> : <>
        <p className="uh-return-feedback" role="status"><CornerDownLeft size={16} aria-hidden="true"/>Back with {attentionTarget(s)}. Your next step is {s.actionStatus === 'done' ? 'marked done' : 'still a plan'}.</p>
        <PracticeButton onClick={() => flow.go('rerate')}>Check in and finish</PracticeButton>
        {s.actionStatus !== 'done' && <PracticeLink onClick={() => flow.patch({ actionStatus: 'done' })}>I have done this step</PracticeLink>}
      </>}
      {s.anchorNoticed && <PracticeLink onClick={() => flow.patch({ actionStatus: null, anchorNoticed: false })}>Choose another next step</PracticeLink>}
    </>}
    <div className="xr-safety">{phase === 'attention' && s.anchorType && !pulled && <PracticeLink onClick={() => flow.patch({ distance: 'near' })}><CornerDownLeft size={14} aria-hidden="true"/>The thought pulled me back</PracticeLink>}<PracticeLink className="xr-link xr-stop" onClick={() => flow.go('orient')}>Stop and return to the room</PracticeLink></div>
  </section>;
}
export function UnhookFinish({ flow }) {
  const { s } = flow;
  const pattern = mindPattern(s.perspective);
  return <section className="xr-experience uh-finish"><PracticeHeading flow={flow} eyebrow={flow.viewingSaved ? 'Your saved way back' : 'A way back to keep'}>When the thought returns,<br/><em>return to your next move.</em></PracticeHeading><ThoughtWords flow={flow} framed={!!s.perspective} phrase={`${pattern.phrase}…`} compact/>{s.action && <div className="uh-attention"><span>Your next move · {s.actionStatus === 'done' ? 'Done' : s.actionStatus === 'planned' ? 'Planned' : 'Chosen'}</span><h2>{s.action}</h2>{s.anchorType && <div className="uh-target"><span>My outside anchor</span><strong>{anchorName(s)}</strong></div>}</div>}<p className="xr-recipe">Notice the words as a thought. Find one detail of what you chose. Return again when attention wanders.</p><p className="xr-honest">{s.practiceTaken ? 'You marked the noticing practice as tried.' : 'You did not mark this practice as tried.'}</p><p className="xr-assessment">{assessmentText(s)}</p><PracticeButton onClick={flow.finish}>{flow.viewingSaved ? 'Close card' : 'Finish'}</PracticeButton>{!flow.viewingSaved && <PracticeLink onClick={flow.save}><Bookmark size={16} aria-hidden="true"/>Save this card on my device</PracticeLink>}{flow.saved && <PracticeLink onClick={flow.deleteSaved}>Delete saved card</PracticeLink>}<PracticeLink onClick={flow.restart}>Practise again</PracticeLink></section>;
}
export function UnhookOutside({ flow }) {
  return <section className="xr-experience uh-outside"><PracticeHeading flow={flow} eyebrow="Back with the room" body="Leave the thought practice aside for now. Give one ordinary detail around you a moment of attention.">Return to<br/><em>what is around you.</em></PracticeHeading><div className="uh-attention"><span>An outside anchor</span><h2>{anchorName(flow.s)}</h2></div><PracticeButton onClick={() => flow.go('action')}>Choose a next step</PracticeButton><PracticeLink onClick={() => flow.go('rerate')}>End practice</PracticeLink></section>;
}
