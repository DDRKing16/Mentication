import { ArrowRight } from 'lucide-react';

/** Reuse the actual saved ladder; no new note store or inferred task outcome. */
export default function NextStepReturn({ state, onResume, saved = true }) {
  if (!state.task || !state.ladder.length) return null;
  const next = state.ladder.find(step => !step.status);
  const marked = state.ladder.filter(step => step.status);
  return <section className="nes-task-return" aria-label="My task and next step">
    <p className="nes-task-label">My task</p><h2>{state.task}</h2>
    {next ? <><p className="nes-task-label">A step to return to</p><h3>{next.title}</h3><p>{next.micro}</p><button type="button" onClick={onResume}>Resume this step<ArrowRight size={18} aria-hidden="true" /></button></> : <p>No unmarked steps remain in this ladder. Its checkmarks describe only the steps you marked done.</p>}
    {!!marked.length && <details><summary>Review my marked steps</summary><ol>{marked.map(step => <li key={step.id}><span>{step.status === 'done' ? 'Marked done' : 'Skipped'}</span>{step.title}</li>)}</ol></details>}
    <p className="nes-task-storage">{!saved ? 'Your task is here for this visit. Saving is unavailable; copy what you need before leaving.' : state.submitted ? 'This practice visit has ended. Resuming an unfinished step starts a new visit and keeps earlier checkmarks.' : 'Your task and checkmarks stay on this device when you leave.'} Not synced across devices.</p>
  </section>;
}
