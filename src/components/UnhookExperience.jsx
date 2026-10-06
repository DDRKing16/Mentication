import { UnhookCore } from './care-practices/PracticeFirstCore';
import useCarePractice from './care-practices/useCarePractice';
import { CareFrame, Primary, Quiet, Scene, SharedScene, WordChoices } from './care-practices/CarePracticeFrame';

export default function UnhookExperience(props) {
  const flow = useCarePractice('unhook', props);
  const { s } = flow;
  return <CareFrame flow={flow}>
    {s.stage === 'notice' ? <Scene flow={flow} eyebrow="The thought in the foreground" title="Which words keep pulling you in?" body="Keep the words. We will not decide if they are true.">
      <WordChoices label="The sticky thought" value={s.notice} choices={['Something will go wrong.', 'I cannot do this.', 'They will judge me.']} onChange={notice => flow.patch({ notice, perspective: '', defusionStep: 0, distance: 'near', anchorType: null, anchorText: '', anchorNoticed: false, practiceTaken: false })}/>
      <Primary disabled={!s.notice.trim()} onClick={() => flow.go('practice')}>Work with this thought</Primary>
      <Quiet onClick={() => flow.go('practice', { notice: '', perspective: '', defusionStep: 0, anchorType: null, anchorText: '', practiceTaken: false })}>Keep the words in my mind</Quiet>
    </Scene> : ['perspective', 'practice'].includes(s.stage) ? <UnhookCore flow={flow}/> : <SharedScene flow={flow}/>}
  </CareFrame>;
}
