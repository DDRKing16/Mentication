import { UnhookCore } from './care-practices/PracticeFirstCore';
import useCarePractice from './care-practices/useCarePractice';
import { CareFrame, Primary, Quiet, Scene, SharedScene, WordChoices } from './care-practices/CarePracticeFrame';
import { ThoughtVisual } from './care-practices/CareVisuals';

export default function UnhookExperience(props) {
  const flow=useCarePractice('unhook',props); const {s}=flow;
  return <CareFrame flow={flow} compact={['perspective','practice'].includes(s.stage)}>
    {s.stage==='notice' ? <Scene flow={flow} eyebrow="The thought in the foreground" title="Which words keep pulling you in?" body="We will practise noticing them without deciding if they are true."><ThoughtVisual s={s}/><WordChoices label="The sticky thought" value={s.notice} choices={['Something will go wrong.','I cannot do this.','They will judge me.']} onChange={notice=>flow.patch({notice,perspective:'',defusionStep:0,distance:'near',anchorNoticed:false})}/><Primary disabled={!s.notice.trim()} onClick={()=>flow.go('perspective')}>Work with this thought</Primary><Quiet onClick={()=>flow.go('perspective',{notice:''})}>Keep the words in my mind</Quiet></Scene>
    : ['perspective','practice'].includes(s.stage) ? <UnhookCore flow={flow}/>
    : <SharedScene flow={flow} visual={<ThoughtVisual s={s} />}/>}
  </CareFrame>;
}
