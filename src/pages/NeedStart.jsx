import { practiceLaunchEntry } from '@/lib/practiceLaunch';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NEED_ENTRIES, JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';
import { INTERVENTIONS } from '@/lib/interventions';
import { standaloneRouteFor } from '@/lib/standaloneInterventions';

export default function NeedStart() {
  const [need, setNeed] = useState(null);
  const navigate = useNavigate();
  const preview=useRef(null), choices=useRef(null), lastChoice=useRef(null);
  const {prefs}=useAccessibilityPrefs();
  useEffect(()=>{
    if(!need)return;
    preview.current?.focus({preventScroll:true});
    preview.current?.scrollIntoView({block:'center',behavior:prefs.reducedMotion?'instant':'smooth'});
  },[need,prefs.reducedMotion]);
  function begin() {
    const iv = INTERVENTIONS.find(item => item.id === need.practice);
    if (!iv) return;
    const route = standaloneRouteFor(iv.id);
    if (route) { navigate(route); return; }
    navigate('/reset', { state: practiceLaunchEntry(iv) });
  }
  return <main className="mx-auto max-w-xl px-5 py-10 safe-top-lg text-foreground">
    <Link className="inline-block min-h-11 underline" to="/">Home</Link>
    <h1 className="font-heading text-3xl">What would help you begin?</h1>
    <p className="my-4">Choose what sounds close. These are starting ideas; you can choose any practice instead.</p>
    <div ref={choices} className="grid gap-3" role="group" aria-label="What you need now">
      {NEED_ENTRIES.map(item => <button type="button" key={item.id} aria-pressed={need?.id === item.id} className={`min-h-14 rounded-2xl border p-4 text-left ${need?.id === item.id ? 'border-primary bg-secondary' : 'border-border bg-card'}`} onClick={event => { lastChoice.current=event.currentTarget; setNeed(item); }}>{item.label}</button>)}
    </div>
    {need && <section className="my-6 rounded-2xl border border-border p-5" aria-live="polite">
      <h2 ref={preview} tabIndex={-1} className="font-heading text-2xl">You could try {JOURNEY_EXPERIENCES[need.practice].name}</h2>
      <p className="my-3">{need.reason}</p>
      <p className="mb-4 text-sm text-muted-foreground">You chose: {need.label}. You can explore this, change your choice, or leave.</p>
      <button type="button" className="min-h-12 rounded-full bg-primary px-6 text-primary-foreground" onClick={begin}>Explore this practice</button>
      <button type="button" className="mt-3 block min-h-11 underline" onClick={() => { lastChoice.current?.focus({preventScroll:true}); lastChoice.current?.scrollIntoView({block:'center',behavior:prefs.reducedMotion?'instant':'smooth'}); }}>Choose another starting point</button>
    </section>}
    <div className="my-5 flex flex-col gap-3"><Link className="min-h-11 underline" to="/library">Choose from all practices</Link><Link className="min-h-11 underline" to="/reset" state={{ unsure:true }}>I am not sure — guide me</Link><Link className="min-h-11 underline" to="/return-points">Return to something I saved</Link></div>
  </main>;
}
