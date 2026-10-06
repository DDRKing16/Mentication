import {readThoughtRecords as readThoughts, deleteThoughtRecord} from '@/lib/thoughtOrFactStorage';
import ThoughtEvidence from '@/components/thought-or-fact/ThoughtEvidence';
import { savedWorkMatches, taraReportedResult, validSavedDate } from '@/lib/savedWorkPresentation';
import { getBrandAtmosphere, getBrandInk } from '@/lib/interventionBrand';
import { loadTara, deleteTaraRecap } from '@/lib/taraTacticianStorage';
import { CARE_PRACTICES } from '@/lib/carePractices';
import { careSavedWorkRows } from '@/lib/careSavedWork';
import { readCareCards, deleteCareSaved } from '@/lib/carePracticeStorage';
import { INTERVENTIONS } from '@/lib/interventions';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { takeawayStore } from '@/lib/localData';
import { JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';

function SavedHeading({id,children,date}) {
  const world=getBrandAtmosphere(id), saved=validSavedDate(date);
  return <header className="-mx-5 -mt-5 mb-4 rounded-t-2xl border-b border-border p-5" style={{background:world.background,color:getBrandInk(id)}}><h3 className="font-heading text-xl leading-snug">{children}</h3>{saved && <time className="mt-1 block text-sm opacity-80" dateTime={date}>{saved.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</time>}</header>;
}
export default function ReturnPoints() {
  const [query,setQuery]=useState('');
  const [taraRecaps, setTaraRecaps] = useState(() => { try { return loadTara().recaps; } catch { return null; } });
  const [cards, setCards] = useState(() => { try { const saved = readCareCards(); return Object.keys(CARE_PRACTICES).map(id => ({ id, state: saved[id] })).filter(card => card.state); } catch { return null; } });
  const [error, setError] = useState('');
  const [notes, setNotes] = useState(() => { try { return takeawayStore.list(); } catch { return null; } });
  const [thoughts, setThoughts] = useState(() => { try { return readThoughts(); } catch { return null; } });
  const refresh = useCallback(() => {
    let failed=false;
    for(const read of [()=>setNotes(takeawayStore.list()),()=>setTaraRecaps(loadTara().recaps),()=>setThoughts(readThoughts()),()=>{const saved=readCareCards();setCards(Object.keys(CARE_PRACTICES).map(id=>({id,state:saved[id]})).filter(card=>card.state));}]) {
      try { read(); } catch { failed=true; }
    }
    setError(failed?'Some saved work could not be read. Nothing has been removed. Try again.':'');
  }, []);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('mentation:takeaways-changed', refresh);
    window.addEventListener('mentation:thoughts-changed', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('mentation:takeaways-changed', refresh);
      window.removeEventListener('mentation:thoughts-changed', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);
  const archives = Object.entries(JOURNEY_EXPERIENCES).filter(([, meta]) => meta.archive && meta.archive !== '/return-points');
  const visibleNotes=notes?.filter(note=>savedWorkMatches(query,[note.text,JOURNEY_EXPERIENCES[note.interventionId]?.name]));
  const visibleThoughts=thoughts?.filter(record=>savedWorkMatches(query,['Thought or Fact',record.thought,record.balancedConfirmed?record.ruling:'',record.returnPhrase,...(Array.isArray(record.support)?record.support:[]),...(Array.isArray(record.evidenceAgainst)?record.evidenceAgainst:[])]));
  const visibleTara=taraRecaps?.filter(record=>savedWorkMatches(query,['Tara Tactician',record.prediction,record.actual,record.learning,record.nextStep,taraReportedResult(record)?.text]));
  const visibleCards=cards?.filter(({id,state})=>savedWorkMatches(query,[CARE_PRACTICES[id].title,...careSavedWorkRows(id,state).map(row=>row.value)]));
  const count=[visibleNotes,visibleThoughts,visibleTara,visibleCards].reduce((sum,list)=>sum+(list?.length||0),0);
  return <main className="mx-auto max-w-2xl px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-10 safe-top-lg text-foreground">
    <Link className="inline-block min-h-11 underline" to="/">Home</Link>
    <p className="mt-3 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">Your own words, kept close</p><h1 className="mt-2 font-heading text-4xl">Return points</h1>
    <p className="my-4">Notes you chose to keep, and the practices that hold your saved work. Stored in this browser or app on this device; not synced across devices.</p>
    {(error || notes === null || thoughts === null || cards === null || taraRecaps === null) && <div role="alert"><p>{error || 'Some saved work could not be read. Nothing has been removed.'}</p><button type="button" className="min-h-11 underline" onClick={refresh}>Try again</button></div>}
    <div className="my-6 rounded-2xl border border-border bg-card p-4"><label htmlFor="saved-work-search" className="block text-sm font-medium">Find saved work</label><input id="saved-work-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="A phrase, action or practice" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-foreground" /><p className="mt-2 text-sm text-muted-foreground" role="status">{count} saved {count===1?'item':'items'} shown</p>{query && <button className="mt-2 min-h-11 underline" type="button" onClick={()=>setQuery('')}>Clear saved-work search</button>}</div>
    {query && count===0 && <p className="my-5">No saved work contains those words. Clear the search to see your collection.</p>}
    {(!!visibleNotes?.length || !query && notes?.length===0) && <h2 className="mt-6 font-heading text-2xl">Your notes</h2>}
    {notes?.length === 0 && <p className="my-3">No saved notes yet. Saving a takeaway is always optional.</p>}
    {visibleNotes?.map(note => <article key={note.id} className="my-4 rounded-2xl border border-border bg-card p-5">
      <SavedHeading id={note.interventionId} date={note.createdAt}>{JOURNEY_EXPERIENCES[note.interventionId]?.name || 'Practice note'}</SavedHeading>
      <p className="my-3 whitespace-pre-wrap break-words">{note.text}</p>
      <button type="button" className="min-h-11 underline" onClick={() => {
        try { takeawayStore.delete(note.id); setNotes(takeawayStore.list()); setError(''); }
        catch { setError('Could not delete this note. It is still saved. Try again.'); }
      }}>Delete this note</button>
    </article>)}
    {!!visibleThoughts?.length && <h2 className="mt-6 font-heading text-2xl">Thought or Fact · saved perspectives</h2>}
    {visibleThoughts?.map(record => <article key={record.id} className="my-4 rounded-2xl border border-border bg-card p-5">
      <SavedHeading id="factCheck" date={record.createdAt}>Thought or Fact</SavedHeading>
      {typeof record.thought === 'string' && <p className="whitespace-pre-wrap break-words">Your thought: {record.thought}</p>}
      {record.balancedConfirmed === true && typeof record.ruling === 'string' && <p className="mt-3 whitespace-pre-wrap break-words">Your confirmed perspective: {record.ruling}</p>}
      {record.balancedConfirmed === false && <p className="mt-3">You chose to leave this unresolved.</p>}
      <ThoughtEvidence support={record.support} against={record.evidenceAgainst}/>
      {typeof record.returnPhrase === 'string' && record.returnPhrase.trim() && <p className="mt-3 whitespace-pre-wrap break-words">Your return phrase: {record.returnPhrase}</p>}
      <button type="button" className="mt-3 min-h-11 underline" onClick={() => {
        try { deleteThoughtRecord(record.id); setThoughts(readThoughts()); setError(''); }
        catch { setError('Could not delete this perspective. It is still saved. Try again.'); }
      }}>Delete this perspective</button>
    </article>)}
    {visibleTara?.map(recap => <article key={recap.id} className="my-4 rounded-2xl border border-border bg-card p-5">
      <SavedHeading id="taraTactician">Tara Tactician · saved reflection</SavedHeading>
      {recap.prediction && <p className="my-3 whitespace-pre-wrap break-words">Your prediction: {recap.prediction}</p>}
      {recap.actual && <p className="my-3 whitespace-pre-wrap break-words">What you observed: {recap.actual}</p>}
      {taraReportedResult(recap) && <p className="my-3">{taraReportedResult(recap).label}: {taraReportedResult(recap).text}</p>}
      {recap.learning && <p className="my-3 whitespace-pre-wrap break-words">What you want to remember: {recap.learning}</p>}
      {recap.nextStep && <p className="my-3 whitespace-pre-wrap break-words">Your next step: {recap.nextStep}</p>}
      <Link className="min-h-11 inline-block underline mr-4" to="/tara-tactician">Open Tara and saved reflections</Link>
      <button className="min-h-11 underline" onClick={() => { try { setTaraRecaps(deleteTaraRecap(recap.id).recaps); setError(''); } catch { setError('Could not delete this saved reflection. Try again.'); } }}>Delete Tara reflection</button>
    </article>)}
    {visibleCards?.map(({ id, state }) => <article key={id} className="my-4 rounded-2xl border border-border bg-card p-5">
      <SavedHeading id={id}>{CARE_PRACTICES[id].title} · saved card</SavedHeading>
      {careSavedWorkRows(id,state).map(row=><div key={row.kind} className="my-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</p><p className="mt-1 whitespace-pre-wrap break-words">{row.kind==='action'?'Your chosen action: ':''}{row.value}</p></div>)}
      <Link className="min-h-11 inline-block underline mr-4" to="/reset" state={{ prebuilt: true, pathway: [id], direction: INTERVENTIONS.find(iv => iv.id === id)?.primaryDirection, intensity: null, timeMin: 3, audio: "no" }}>Open practice and saved card</Link>
      <button className="min-h-11 underline" onClick={() => { if (deleteCareSaved(id)) { setCards(current => current.filter(card => card.id !== id)); setError(""); } else setError("Could not delete this saved card. Try again."); }}>Delete saved card</button>
    </article>)}
    <details className="mt-8 rounded-2xl border border-border bg-card p-5"><summary className="min-h-11 cursor-pointer font-heading text-xl">Saved work inside your practices</summary>
    <p className="my-3">Open a practice to review or manage what you saved there. These links do not mean a record already exists.</p>
    <div className="grid gap-3">{archives.map(([id, meta]) => <Link key={id} className="min-h-14 rounded-2xl border border-border p-4 underline" to={meta.archive}>{meta.name}</Link>)}</div>
    </details>
    <Link className="mt-5 block min-h-11 underline" to="/settings">Device data and deletion settings</Link>
  </main>;
}
