import { CompassionCore } from './care-practices/PracticeFirstCore';
import useCarePractice from './care-practices/useCarePractice';
import { CareFrame, Primary, Quiet, Scene, SharedScene, WordChoices } from './care-practices/CarePracticeFrame';
import { CompassionVisual } from './care-practices/CareVisuals';
import { COMPASSION_STARTERS, compassionateSuggestions } from '@/lib/carePracticeDesign';

export default function SelfCompassionExperience(props) {
  const flow=useCarePractice('selfCompassion',props); const {s}=flow;
  const common=<SharedScene flow={flow} visual={<CompassionVisual s={s} mode="response"/>}/>;
  return <CareFrame flow={flow} compact={s.stage==='practice'}>
    {['notice','perspective','practice'].includes(s.stage) ? <>
      {s.stage==='notice' && <Scene flow={flow} eyebrow="Notice the critic" title="What is the line you keep hearing?" body="Pick something close, or use your own words."><CompassionVisual s={s}/><WordChoices label="The critical line" value={s.notice} choices={COMPASSION_STARTERS.map(x=>x.line)} onChange={notice=>flow.patch({notice,perspective:'',responseRead:false})}/><Primary disabled={!s.notice.trim()} onClick={()=>flow.go('perspective')}>Find a kinder response</Primary><Quiet onClick={()=>flow.go('perspective',{notice:''})}>Keep the line in my mind</Quiet></Scene>}
      {s.stage==='perspective' && <Scene flow={flow} eyebrow="Try a voice on your side" title="What would you say to someone you care about?" body="Choose a believable response. You can change every word.">{s.notice && <div className="compassion-before"><span>They are hearing this</span><p>“{s.notice}”</p></div>}<WordChoices label="A compassionate response" value={s.perspective} choices={compassionateSuggestions(s.notice)} onChange={perspective=>flow.patch({perspective,responseRead:false})} placeholder="Something caring that I can believe"/>{s.perspective && <div className="compassion-response-preview"><span>Now offer these words to yourself</span><p>{s.perspective}</p></div>}<Primary disabled={!s.perspective.trim()} onClick={()=>flow.go('practice',{practiceTaken:false})}>Let this be my response</Primary><Quiet onClick={()=>flow.go('action')}>Choose an act of care instead</Quiet></Scene>}
      {s.stage==='practice' && <CompassionCore flow={flow}/>}
    </> : common}
  </CareFrame>;
}
