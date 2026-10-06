import { MakeRoomCore } from './care-practices/PracticeFirstCore';
import useCarePractice from './care-practices/useCarePractice';
import { CareFrame, Primary, Quiet, Scene, SharedScene, WordChoices } from './care-practices/CarePracticeFrame';
import { FeelingVisual } from './care-practices/CareVisuals';
import { EXTERNAL_ANCHORS, makeRoomPhrase } from '@/lib/carePracticeDesign';

export default function MakeRoomExperience(props) {
  const flow=useCarePractice('makeRoom',props); const {s}=flow;
  return <CareFrame flow={flow} compact={s.stage==='practice'}>
    {s.stage==='notice' ? <Scene flow={flow} eyebrow="Name just a little" title="What feeling is here?" body="Choose something manageable. No need to revisit how it began."><FeelingVisual s={s}/><WordChoices label="The feeling" value={s.notice} choices={['Worry','Sadness','Frustration','Hard to name']} onChange={notice=>flow.patch({notice,allowance:null,attentionFocused:false})}/><Primary disabled={!s.notice.trim()} onClick={()=>flow.go('perspective')}>Find a steady point nearby</Primary><Quiet onClick={()=>flow.go('perspective',{notice:''})}>Leave the feeling unnamed</Quiet></Scene>
    : s.stage==='perspective' ? <Scene flow={flow} eyebrow="Keep a connection to the room" title="First, choose something outside the feeling." body="Keep your eyes open. This will be your steady point."><FeelingVisual s={s}/><div className="care-anchor-choices" role="group" aria-label="An anchor in the room">{Object.entries(EXTERNAL_ANCHORS).map(([key,a])=><button type="button" key={key} aria-pressed={s.anchorType===key} onClick={()=>flow.patch({anchorType:key,anchorText:'',attentionFocused:false})}>{a.label}</button>)}</div>{s.anchorType && <div className="care-anchor-instruction"><p>{EXTERNAL_ANCHORS[s.anchorType].instruction}</p><label className="care-input-label">{EXTERNAL_ANCHORS[s.anchorType].prompt}<input maxLength={140} placeholder={`${EXTERNAL_ANCHORS[s.anchorType].example} · optional`} value={s.anchorText} onChange={e=>flow.patch({anchorText:e.target.value})}/></label></div>}<Primary disabled={!s.anchorType} onClick={()=>flow.go('practice',{practiceTaken:false,perspective:makeRoomPhrase(s.notice)})}>Try a little room with this anchor</Primary><Quiet onClick={()=>flow.go('orient')}>Not now — stay with the room</Quiet></Scene>
    : s.stage==='practice' ? <MakeRoomCore flow={flow}/>
    : <SharedScene flow={flow} visual={<FeelingVisual s={s} mode="intro"/>}/>}
  </CareFrame>;
}
