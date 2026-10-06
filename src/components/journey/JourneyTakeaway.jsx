import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';
import { takeawayStore } from '@/lib/localData';
import '@/styles/journey-tools.css';

export default function JourneyTakeaway({ id }) {
  const meta = JOURNEY_EXPERIENCES[id];
  const fieldId = useId();
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  if (!meta) return null;
  if (meta.archive) return <aside className="journey-takeaway"><p>{meta.prompt}</p><Link to={meta.archive}>Return to saved work</Link></aside>;
  return <details className="journey-takeaway">
    <summary>Keep something for later · optional</summary>
    <label htmlFor={fieldId}>{meta.prompt}</label>
    <textarea id={fieldId} maxLength={1500} value={text} onChange={event => { setText(event.target.value); setError(''); }} rows={3} />
    <p>Only saved when you choose Save. Stored in this browser or app on this device, not synced. Read or delete it in Return points. Unsaved text is lost when you leave.</p>
    <button type="button" disabled={!text.trim() || saved?.text === text.trim()} onClick={() => {
      try { setSaved(takeawayStore.save({ id: saved?.id, interventionId: id, text })); setError(''); }
      catch { setError('Could not save. Your note is still here. Try again or copy it before leaving.'); }
    }}>{saved ? 'Save changes on this device' : 'Save on this device'}</button>
    {saved && <><p role="status">{saved.text === text.trim() ? 'Saved on this device.' : 'Changes have not been saved.'}</p><button type="button" onClick={() => {
      try { takeawayStore.delete(saved.id); setSaved(null); setText(''); setError(''); }
      catch { setError('Could not delete. Your saved note is still on this device. Try again.'); }
    }}>Delete saved note</button></>}
    {error && <p role="alert">{error}</p>}
    <Link to="/return-points">Return points</Link>
  </details>;
}
