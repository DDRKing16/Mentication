import SelfCompassionExperience from '../SelfCompassionExperience';
import UnhookExperience from '../UnhookExperience';
import MakeRoomExperience from '../MakeRoomExperience';
export default function CarePracticeExperience({ id, ...props }) {
  const Component = { selfCompassion: SelfCompassionExperience, unhook: UnhookExperience, makeRoom: MakeRoomExperience }[id];
  return Component ? <Component key={id} {...props} /> : null;
}
