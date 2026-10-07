import { checkpointFor } from '@/lib/practiceCheckpoints';
import '@/styles/practice-checkpoint.css';

/** Quiet, inline evidence of practice. No score, inferred change, or extra button. */
export default function PracticeCheckpoint({ events, title = 'Something to carry forward', variant = 'path', compact = false }) {
  const checkpoint = checkpointFor(events);
  if (!checkpoint.pairs) return null;
  return <aside className={`practice-checkpoint practice-checkpoint--${variant}`} data-practice-count={checkpoint.count} data-checkpoint={checkpoint.pairs} data-compact={compact || undefined} aria-label="Your practice checkpoint">
    <div className="practice-checkpoint-mark" aria-hidden="true"><svg viewBox="0 0 80 56"><path d="M8 43 Q25 43 31 28 T70 13"/><circle cx="16" cy="41" r="5"/><circle cx="64" cy="14" r="5"/></svg></div>
    <div className="practice-checkpoint-copy" key={checkpoint.items.map(item => `${item.id}:${item.detail}`).join('|')}>
      <p className="practice-checkpoint-label">{title}</p>
      <div className="practice-checkpoint-pair" role="status" aria-live="polite" aria-atomic="true">{checkpoint.items.map(item => <p key={item.id}><span>{item.label}</span><strong>{item.detail}</strong></p>)}</div>
    </div>
  </aside>;
}
