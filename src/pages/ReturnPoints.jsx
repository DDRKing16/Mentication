import { CARE_PRACTICES } from '@/lib/carePractices';
import { readCareCards, deleteCareSaved } from '@/lib/carePracticeStorage';
import { INTERVENTIONS } from '@/lib/interventions';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { takeawayStore } from '@/lib/localData';
import { JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';

const THOUGHT_KEY = 'mentation.thought-or-fact.records.v1';
function readThoughts() {
  const records = JSON.parse(localStorage.getItem(THOUGHT_KEY) || '[]');
  if (!Array.isArray(records)) throw new Error('Unreadable saved perspectives');
  if (records.some(record => !record || typeof record.id !== 'string')) throw new Error('Unreadable saved perspectives');
  return records;
}
export default function ReturnPoints() {
  const [cards, setCards] = useState(() => { try { const saved = readCareCards(); return Object.keys(CARE_PRACTICES).map(id => ({ id, state: saved[id] })).filter(card => card.state); } catch { return null; } });
  const [error, setError] = useState('');
  const [notes, setNotes] = useState(() => { try { return takeawayStore.list(); } catch { return null; } });
  const [thoughts, setThoughts] = useState(() => { try { return readThoughts(); } catch { return null; } });
  const refresh = () => {
    try { setNotes(takeawayStore.list()); setThoughts(readThoughts()); const saved = readCareCards(); setCards(Object.keys(CARE_PRACTICES).map(id => ({ id, state: saved[id] })).filter(card => card.state)); setError(''); }
    catch { setError('Saved work could not be read. Nothing has been removed. Try again.'); }
  };
  const archives = Object.entries(JOURNEY_EXPERIENCES).filter(([, meta]) => meta.archive && meta.archive !== '/return-points');
  return <main className="mx-auto max-w-2xl px-5 py-10 safe-top-lg text-foreground">
    <Link className="inline-block min-h-11 underline" to="/">Home</Link>
    <h1 className="font-heading text-3xl">Return points</h1>
    <p className="my-4">Notes you chose to keep, and the practices that hold your saved work. Stored in this browser or app on this device; not synced across devices.</p>
    {(error || notes === null || thoughts === null || cards === null) && <div role="alert"><p>{error || 'Some saved work could not be read. Nothing has been removed.'}</p><button type="button" className="min-h-11 underline" onClick={refresh}>Try again</button></div>}
    <h2 className="mt-6 font-heading text-2xl">Your notes</h2>
    {notes?.length === 0 && <p className="my-3">No saved notes yet. Saving a takeaway is always optional.</p>}
    {notes?.map(note => <article key={note.id} className="my-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-medium">{JOURNEY_EXPERIENCES[note.interventionId]?.name || 'Practice note'}</h3>
      <p className="my-3 whitespace-pre-wrap break-words">{note.text}</p>
      <button type="button" className="min-h-11 underline" onClick={() => {
        try { takeawayStore.delete(note.id); setNotes(takeawayStore.list()); setError(''); }
        catch { setError('Could not delete this note. It is still saved. Try again.'); }
      }}>Delete this note</button>
    </article>)}
    {!!thoughts?.length && <h2 className="mt-6 font-heading text-2xl">Thought or Fact · saved perspectives</h2>}
    {thoughts?.map(record => <article key={record.id} className="my-4 rounded-2xl border border-border bg-card p-5">
      {typeof record.thought === 'string' && <p className="whitespace-pre-wrap break-words">Your thought: {record.thought}</p>}
      {record.balancedConfirmed === true && typeof record.ruling === 'string' && <p className="mt-3 whitespace-pre-wrap break-words">Your confirmed perspective: {record.ruling}</p>}
      {typeof record.returnPhrase === 'string' && record.returnPhrase.trim() && <p className="mt-3 whitespace-pre-wrap break-words">Your return phrase: {record.returnPhrase}</p>}
      <button type="button" className="mt-3 min-h-11 underline" onClick={() => {
        try { localStorage.setItem(THOUGHT_KEY, JSON.stringify(readThoughts().filter(item => item.id !== record.id))); setThoughts(readThoughts()); setError(''); }
        catch { setError('Could not delete this perspective. It is still saved. Try again.'); }
      }}>Delete this perspective</button>
    </article>)}
    {cards?.map(({ id, state }) => <article key={id} className="my-4 rounded-2xl border border-border bg-card p-5">
      <h2>{CARE_PRACTICES[id].title} · saved card</h2>
      {state.perspective && <p className="my-3 whitespace-pre-wrap break-words">{state.perspective}</p>}
      {state.action && <p className="my-3 whitespace-pre-wrap break-words">Your chosen action: {state.action}</p>}
      <Link className="min-h-11 inline-block underline mr-4" to="/reset" state={{ prebuilt: true, pathway: [id], direction: INTERVENTIONS.find(iv => iv.id === id)?.primaryDirection, intensity: null, timeMin: 3, audio: "no" }}>Open practice and saved card</Link>
      <button className="min-h-11 underline" onClick={() => { if (deleteCareSaved(id)) { setCards(current => current.filter(card => card.id !== id)); setError(""); } else setError("Could not delete this saved card. Try again."); }}>Delete saved card</button>
    </article>)}
    <h2 className="mt-8 font-heading text-2xl">Saved work inside your practices</h2>
    <p className="my-3">Open a practice to review or manage what you saved there. These links do not mean a record already exists.</p>
    <div className="grid gap-3">{archives.map(([id, meta]) => <Link key={id} className="min-h-14 rounded-2xl border border-border p-4 underline" to={meta.archive}>{meta.name}</Link>)}</div>
    <Link className="mt-5 block min-h-11 underline" to="/settings">Device data and deletion settings</Link>
  </main>;
}
