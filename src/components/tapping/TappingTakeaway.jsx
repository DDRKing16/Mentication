import { useEffect, useId, useRef, useState } from 'react';
import { takeawayStore } from '@/lib/localData';
import { journeyTakeawayId } from '@/lib/confirmedJourneyTakeaway';

// A single-question presentation using the existing shared note store and
// reset scope. Only an explicit Save creates or replaces a Return point.
export default function TappingTakeaway({ active, initialText, draftText, savedId, onTextChange, onSaved, onSavedStateChange, onReadError, onSkip }) {
  const [scope, setScope] = useState(null);
  const [text, setText] = useState(draftText ?? initialText);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  // A restored edit is still a draft, even when a previous cue is saved.
  const dirty = useRef(draftText != null);
  const currentSaved = useRef(null);
  const callbacks = useRef({ onSavedStateChange, onReadError });
  callbacks.current = { onSavedStateChange, onReadError };
  const prompt = useId();
  const heading = useRef(null);
  useEffect(() => { setScope(journeyTakeawayId('eftTapping', window.history.state)); }, [active]);
  useEffect(() => { if (active) heading.current?.focus({ preventScroll: false }); }, [active]);
  useEffect(() => {
    if (!dirty.current && !currentSaved.current) setText(draftText ?? initialText);
  }, [draftText, initialText]);
  useEffect(() => {
    const sync = () => {
      const id = savedId || scope || currentSaved.current?.id;
      if (!id) return;
      try {
        const latest = takeawayStore.list().find(note => note.id === id) || null;
        if (latest && latest.interventionId !== 'eftTapping') throw new Error('Different practice');
        if (!dirty.current && (latest || currentSaved.current)) setText(latest?.text || '');
        currentSaved.current = latest; setSaved(latest);
        callbacks.current.onSavedStateChange?.(latest);
        setError(previous => previous.startsWith('Could not read') ? '' : previous);
      } catch { callbacks.current.onReadError?.(); setError('Could not read your saved cue. Nothing has been overwritten.'); }
    };
    sync();
    const storage = event => { if (!event.key || event.key === 'mentation.takeaways.v1') sync(); };
    const visible = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('mentation:takeaways-changed', sync);
    window.addEventListener('storage', storage);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('mentation:takeaways-changed', sync); window.removeEventListener('storage', storage); window.removeEventListener('focus', sync); document.removeEventListener('visibilitychange', visible); };
  }, [scope, savedId, retry]);
  function save() {
    try {
      const id = saved?.id || savedId || scope || journeyTakeawayId('eftTapping', window.history.state);
      const existing = id && takeawayStore.list().find(note => note.id === id);
      if (existing && existing.interventionId !== 'eftTapping') throw new Error('Different practice');
      const record = takeawayStore.save({ id, interventionId: 'eftTapping', text });
      currentSaved.current = record; dirty.current = false; setSaved(record); setError('');
      onSaved(record);
    } catch { setError('Could not save. Your cue is still here. Try again before leaving.'); }
  }
  return <main className="tap-note-screen" hidden={!active}>
    <p className="tap-eyebrow">OPTIONAL · A CUE FOR NEXT TIME</p>
    <h1 id={prompt} ref={heading} tabIndex={-1}>What would you<br/><em>like to keep?</em></h1>
    <p className="tap-lead">A tapping adjustment or grounding cue you would choose again.</p>
    <textarea aria-labelledby={prompt} maxLength={1500} rows={5} value={text} onChange={event => { dirty.current = true; setText(event.target.value); onTextChange(event.target.value); setError(''); }} placeholder="A cue I might use again…"/>
    <p className="tap-small">Your draft stays with this tapping visit. Save keeps it in Return points on this device.</p>
    {error && <p role="alert" className="tap-error-note">{error}</p>}
    {error.startsWith('Could not read') ? <button data-sfx="none" className="tap-primary" onClick={() => setRetry(value => value + 1)}>Try reading my cue again <span aria-hidden="true">→</span></button> : <button data-sfx="none" className="tap-primary" disabled={!text.trim()} onClick={save}>Save cue <span aria-hidden="true">→</span></button>}
    <button data-sfx="none" className="tap-text-button" onClick={onSkip}>Back without saving <span aria-hidden="true">→</span></button>
    {saved && <details className="tap-storage"><summary>Saved cue options</summary><p role="status">{saved.text === text.trim() ? 'Saved on this device.' : 'Changes have not been saved.'}</p><button data-sfx="none" onClick={() => { try { takeawayStore.delete(saved.id); currentSaved.current = null; dirty.current = false; setSaved(null); setText(''); onTextChange(''); callbacks.current.onSavedStateChange?.(null); setError(''); } catch { setError('Could not delete. Your saved cue is still on this device.'); } }}>Delete saved cue</button></details>}
  </main>;
}
