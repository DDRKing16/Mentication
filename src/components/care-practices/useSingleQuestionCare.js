import { useProgressGate } from '@/hooks/useProgressGate';
import { useJourneyScreenHistory } from '@/hooks/useJourneyScreenHistory';
import { validCareScreenFor, CARE_SCREEN_STAGES } from '@/lib/careQuestionFlow';
import { useEffect } from 'react';
import { CARE_PRACTICES } from '@/lib/carePractices';
import { COMPASSION_STARTERS, CARE_ACTIONS } from '@/lib/carePracticeDesign';
import { UNHOOK_STEPS, ROOM_STEPS } from '@/lib/experientialCare';
import useCarePractice from './useCarePractice';
import { careScreen, careForwardPatch, careBackPatch, careScreenProgress, careScreenResumeLabel } from '@/lib/careQuestionFlow';

export default function useSingleQuestionCare(id, props) {
  const flow = useCarePractice(id, props);
  const acceptProgress = useProgressGate();
  const notices = id === 'selfCompassion' ? COMPASSION_STARTERS.map(item => item.line) : CARE_PRACTICES[id].notices;
  const actions = (id === 'selfCompassion' ? CARE_ACTIONS.selfCompassion : id === 'unhook' ? UNHOOK_STEPS : ROOM_STEPS).map(item => item.action);
  const screen = flow.viewingSaved && flow.s.careScreen !== 'options' ? 'card' : careScreen(id, flow.s, { notices, actions });
  useJourneyScreenHistory(id, flow.returning ? null : screen, next => {
    if (validCareScreenFor(id, next)) flow.go(CARE_SCREEN_STAGES[next], {careScreen:next});
  });
  const advance = (next, values = {}) => {
    if (!acceptProgress()) return;
    const patch = careForwardPatch(id, flow.s, screen, next, values);
    flow.go(patch.stage, patch);
  };
  const back = () => {
    if (flow.returning || screen === 'intro' || flow.viewingSaved && screen === 'card') return flow.exit();
    const patch = careBackPatch(id, flow.s, screen);
    flow.go(patch.stage, patch);
  };
  useEffect(() => {
    const editor = document.querySelector(`[data-care=${id}] [data-care-editor]`);
    (editor || flow.heading.current)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen, flow.heading, flow.returning, id]);
  return { ...flow, screen, advance, back, progress: careScreenProgress(id, flow.s, screen), resumeLabel: careScreenResumeLabel(id, screen) };
}
