import { CompassionCore } from './care-practices/PracticeFirstCore';
import useCarePractice from './care-practices/useCarePractice';
import { CareFrame, Primary, Quiet, Scene, SharedScene, WordChoices } from './care-practices/CarePracticeFrame';
import { COMPASSION_STARTERS } from '@/lib/carePracticeDesign';

export default function SelfCompassionExperience(props) {
  const flow = useCarePractice('selfCompassion', props);
  const { s } = flow;
  return <CareFrame flow={flow}>
    {s.stage === 'notice' ? <Scene flow={flow} eyebrow="Notice the critic" title="What is the critical line?" body="Choose familiar words, or use your own.">
      <WordChoices label="The critical line" value={s.notice} choices={COMPASSION_STARTERS.map(item => item.line)} onChange={notice => flow.patch({ notice, perspective: '', responseRead: false, practiceTaken: false })}/>
      <Primary disabled={!s.notice.trim()} onClick={() => flow.go('practice')}>Try a voice on my side</Primary>
      <Quiet onClick={() => flow.go('practice', { notice: '', perspective: '', practiceTaken: false })}>Keep the line in my mind</Quiet>
    </Scene> : ['perspective', 'practice'].includes(s.stage) ? <CompassionCore flow={flow}/> : <SharedScene flow={flow}/>}
  </CareFrame>;
}
