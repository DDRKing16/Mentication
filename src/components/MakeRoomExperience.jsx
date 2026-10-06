import { MakeRoomCore } from './care-practices/PracticeFirstCore';
import useCarePractice from './care-practices/useCarePractice';
import { CareFrame, Primary, Quiet, Scene, SharedScene, WordChoices } from './care-practices/CarePracticeFrame';

export default function MakeRoomExperience(props) {
  const flow = useCarePractice('makeRoom', props);
  const { s } = flow;
  return <CareFrame flow={flow}>
    {s.stage === 'notice' ? <Scene flow={flow} eyebrow="Name just a little" title="What feeling is here?" body="Choose something manageable. No need to revisit how it began.">
      <WordChoices label="The feeling" value={s.notice} choices={['Worry', 'Sadness', 'Frustration', 'Hard to name']} onChange={notice => flow.patch({ notice, perspective: '', allowance: null, attentionFocused: false, practiceTaken: false })}/>
      <Primary disabled={!s.notice.trim()} onClick={() => flow.go('practice')}>Find a steady point nearby</Primary>
      <Quiet onClick={() => flow.go('practice', { notice: '', perspective: '', allowance: null, practiceTaken: false })}>Leave the feeling unnamed</Quiet>
    </Scene> : ['perspective', 'practice'].includes(s.stage) ? <MakeRoomCore flow={flow}/> : <SharedScene flow={flow}/>}
  </CareFrame>;
}
