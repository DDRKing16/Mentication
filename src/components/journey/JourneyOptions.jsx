import React, { useRef, useState } from 'react';
import { JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';
import JourneyTakeaway from './JourneyTakeaway';
import JourneyDialog from './JourneyDialog';
import '@/styles/journey-tools.css';

// An in-place alternative retains the mounted practice and its valid answers.
// Timed players supply onOpen to pause; closing never resumes without consent.
export default function JourneyOptions({ id, onOpen, label = 'Another way' }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const meta = JOURNEY_EXPERIENCES[id];
  if (!meta) return null;
  return <>
    <div className="journey-secondary">
    <button ref={trigger} type="button" className="journey-options-button" disabled={waiting} onClick={async () => {
      setWaiting(true); setError('');
      try { await onOpen?.(); setOpen(true); }
      catch (failure) { setError(failure?.message || 'Could not pause the practice. Please try again.'); }
      finally { setWaiting(false); }
    }}>{waiting ? 'Pausing…' : label}</button>
    {error && <p role="alert">{error}</p>}
    </div>
    <JourneyDialog open={open} opener={trigger} onClose={() => setOpen(false)} className="journey-options-dialog" aria-label={`Another way · ${meta.name}`}>
      <h2>Try a different approach</h2>
      <p>{meta.alternative}</p>
      <p>Your practice stays open underneath. You can return to it or leave using its exit controls. This alternative does not mark any steps complete.</p>
      <JourneyTakeaway id={id} />
      <button type="button" autoFocus onClick={() => setOpen(false)}>Return to {meta.name}</button>
    </JourneyDialog>
  </>;
}
