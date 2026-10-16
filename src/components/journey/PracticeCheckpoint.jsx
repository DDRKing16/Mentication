import { useEffect, useRef } from 'react';
import { checkpointFor, reconcilePracticeEvents, orderedPracticeEvents } from '@/lib/practiceCheckpoints';
import PracticeIllustration from './PracticeIllustration';
import '@/styles/practice-checkpoint.css';

const OBJECTS = { thought: 'evidence', bump: 'light', scene: 'light', body: 'body', night: 'letter', step: 'path', senses: 'light', breath: 'breath', wave: 'wave', selfCompassion: 'care', unhook: 'evidence', makeRoom: 'care', plan: 'plan' };

/** The revealed object carries the two actual choices, never an inferred benefit. */
export default function PracticeCheckpoint({ events, title = 'Something to carry forward', variant = 'path', compact = false, brief = false, connection, order, onOrderChange }) {
  const confirmed = useRef([]);
  confirmed.current = onOrderChange ? orderedPracticeEvents(events, order) : reconcilePracticeEvents(confirmed.current, events);
  const ids = confirmed.current.map(event => event.id);
  const signature = JSON.stringify(ids);
  useEffect(() => {
    if (onOrderChange && signature !== JSON.stringify(order || [])) onOrderChange(ids);
  }, [signature, order, onOrderChange]);
  const checkpoint = checkpointFor(confirmed.current);
  if (!checkpoint.pairs) return null;
  if (brief) return <aside className="practice-checkpoint-brief text-xs leading-relaxed text-cream/75" data-practice-count={checkpoint.count} data-checkpoint={checkpoint.pairs} aria-label="Your practice checkpoint" role="status" aria-live="polite" aria-atomic="true"><strong className="font-medium">{checkpoint.pairs * 2} guided rounds. </strong>Rejoin at the next inhale. Breathe naturally if holds feel uncomfortable.</aside>;
  return <aside className={`practice-checkpoint practice-checkpoint--${variant}`} data-practice-count={checkpoint.count} data-checkpoint={checkpoint.pairs} data-compact={compact || undefined} aria-label="Your practice checkpoint">
    <div className="practice-checkpoint-mark" key={checkpoint.items.map(item => item.id).join('|')} aria-hidden="true"><PracticeIllustration kind={OBJECTS[variant] || 'plan'}/></div>
    <div className="practice-checkpoint-copy">
      <p className="practice-checkpoint-label">{title}</p>
      <div className="practice-checkpoint-pair" role="status" aria-live="polite" aria-atomic="true">{checkpoint.items.map(item => <p key={item.id}><span>{item.label}</span><strong>{item.detail}</strong></p>)}</div>
      {connection && <p className="practice-checkpoint-connection">{connection}</p>}
    </div>
  </aside>;
}
