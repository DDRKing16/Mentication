import PlusGate from '@/components/plus/PlusGate';
import TappingExperience from './TappingExperience';

// Keep the tapping question separate from the host's goal assessment. A stopped
// or skipped round is an exit, and never receives full practice credit.
export default function GentleTappingExperience({ onComplete, onAttemptEvent, onExit, answers = {} }) {
  return <PlusGate route="eft-tapping" name="Gentle Tapping" promise="A gentle tapping round, one point at a time." detail="Keep your eyes open, skip points, or stop whenever you want." background="#0b302c"><TappingExperience silent={!!answers.noAudio || !!answers.discreet} onExit={onExit} onComplete={result => {
    onAttemptEvent?.({ interventionId: 'eftTapping', action: 'completed', exitReason: result.completed ? 'completed' : 'exited', completedPercentage: result.completed ? 1 : 0, timestamp: Date.now() });
    return onComplete?.({ requireGoalReassessment: true, exitReason: result.completed ? 'completed' : 'exited', completedPercentage: result.completed ? 1 : 0, outcome: result });
  }} /></PlusGate>;
}
