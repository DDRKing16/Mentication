import { useRef } from 'react';
import { checkpointFor, reconcilePracticeEvents } from '@/lib/practiceCheckpoints';
import PracticeIllustration from './PracticeIllustration';
import '@/styles/practice-checkpoint.css';

const OBJECTS = { thought: 'evidence', bump: 'light', scene: 'light', body: 'body', night: 'letter', step: 'path', senses: 'light', breath: 'breath', wave: 'wave', selfCompassion: 'care', unhook: 'evidence', makeRoom: 'care', plan: 'plan' };

/** The revealed object carries the two actual choices, never an inferred benefit. */
export default function PracticeCheckpoint({ events, title = 'Something to carry forward', variant = 'path', compact = false }) {
  const confirmed = useRef([]);
  confirmed.current = reconcilePracticeEvents(confirmed.current, events);
  const checkpoint = checkpointFor(confirmed.current);
  if (!checkpoint.pairs) return null;
  return <aside className={`practice-checkpoint practice-checkpoint--${variant}`} data-practice-count={checkpoint.count} data-checkpoint={checkpoint.pairs} data-compact={compact || undefined} aria-label="Your practice checkpoint">
    <div className="practice-checkpoint-mark" key={checkpoint.items.map(item => item.id).join('|')} aria-hidden="true"><PracticeIllustration kind={OBJECTS[variant] || 'plan'}/></div>
    <div className="practice-checkpoint-copy">
      <p className="practice-checkpoint-label">{title}</p>
      <div className="practice-checkpoint-pair" role="status" aria-live="polite" aria-atomic="true">{checkpoint.items.map(item => <p key={item.id}><span>{item.label}</span><strong>{item.detail}</strong></p>)}</div>
    </div>
  </aside>;
}
