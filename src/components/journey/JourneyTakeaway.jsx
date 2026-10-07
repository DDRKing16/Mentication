import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';
import { takeawayStore } from '@/lib/localData';
import { journeyTakeawayId } from '@/lib/confirmedJourneyTakeaway';
import '@/styles/journey-tools.css';

export default function JourneyTakeaway({ id, initialText = '' }) {
  const meta = JOURNEY_EXPERIENCES[id];
  const fieldId = useId();
  const [scope] = useState(() => journeyTakeawayId(id, window.history.state));
  const [text, setText] = useState(initialText.slice(0,1500));
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [readVersion, setReadVersion] = useState(0);
  const dirty = useRef(false);
  const currentSaved = useRef(null);
  useEffect(() => {
    if (!meta || meta.archive) return;
    const sync = () => {
      const noteId = scope || currentSaved.current?.id;
      if (!noteId) return;
      try {
        const latest = takeawayStore.list().find(note => note.id === noteId && note.interventionId === id) || null;
        if (!dirty.current && (latest || currentSaved.current)) setText(latest?.text || '');
        currentSaved.current = latest;
        setSaved(latest);
        setError(previous => previous.startsWith('Could not read') ? '' : previous);
      } catch { setError('Could not read your saved note. Nothing has been overwritten. Try again before leaving.'); }
    };
    const onStorage = event => { if (!event.key || event.key === 'mentation.takeaways.v1') sync(); };
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    sync();
    window.addEventListener('mentation:takeaways-changed', sync);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('mentation:takeaways-changed', sync);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [id, meta, scope, readVersion]);
  if (!meta) return null;
  if (meta.archive) return <aside className="journey-takeaway"><p>{meta.prompt}</p><Link to={meta.archive}>Return to saved work</Link></aside>;
  return <details className="journey-takeaway">
    <summary><span>{saved ? 'Review my saved note' : initialText ? 'Keep these practice choices' : 'Keep a cue for next time'}</span><small>Optional · in your own words</small></summary>
    <label htmlFor={fieldId}>{meta.prompt}</label>
    {initialText && !saved && <p>From your entries and confirmed choices. Edit or clear anything before saving.</p>}
    <p className="takeaway-coach">Name a moment you might need it, and one small thing you would choose then.</p>
    <textarea placeholder="When… I could…" id={fieldId} maxLength={1500} value={text} onChange={event => { dirty.current = true; setText(event.target.value); setError(''); }} rows={3} />
    <p>Only saved when you choose Save. Stored in this browser or app on this device, not synced. Read or delete it in Return points. Unsaved text is lost when you leave.</p>
    <button type="button" disabled={!text.trim() || saved?.text === text.trim()} onClick={() => {
      try { const record = takeawayStore.save({ id: saved?.id || scope, interventionId: id, text }); currentSaved.current = record; dirty.current = false; setSaved(record); setError(''); }
      catch { setError('Could not save. Your note is still here. Try again or copy it before leaving.'); }
    }}>{saved ? 'Save changes on this device' : 'Save on this device'}</button>
    {saved && <>{!error.startsWith('Could not read') && <p role="status">{saved.text === text.trim() ? 'Saved on this device.' : 'Changes have not been saved.'}</p>}<button type="button" onClick={() => {
      try { takeawayStore.delete(saved.id); currentSaved.current = null; dirty.current = false; setSaved(null); setText(''); setError(''); }
      catch { setError('Could not delete. Your saved note is still on this device. Try again.'); }
    }}>Delete saved note</button></>}
    {error && <p role="alert">{error}</p>}
    {error.startsWith('Could not read') && <button type="button" onClick={() => setReadVersion(value => value + 1)}>Try reading saved note again</button>}
    <Link to="/return-points">Return points</Link>
  </details>;
}
