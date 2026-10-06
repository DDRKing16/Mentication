import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NEED_ENTRIES, JOURNEY_EXPERIENCES } from '@/lib/journeyExperience';
import { INTERVENTIONS } from '@/lib/interventions';
import { standaloneRouteFor } from '@/lib/standaloneInterventions';

export default function NeedStart() {
  const [need, setNeed] = useState(null);
  const navigate = useNavigate();
  function begin() {
    const iv = INTERVENTIONS.find(item => item.id === need.practice);
    if (!iv) return;
    const route = standaloneRouteFor(iv.id);
    if (route) { navigate(route); return; }
    navigate('/reset', { state: { prebuilt:true, pathway:[iv.id], direction:iv.primaryDirection, directionLabel:iv.name, intensity:null, whereFelt:'both', timeMin:iv.durationMin, audio:'no' } });
  }
  return <main className="mx-auto max-w-xl px-5 py-10 safe-top-lg text-foreground">
    <Link className="inline-block min-h-11 underline" to="/">Home</Link>
    <h1 className="font-heading text-3xl">What would help you begin?</h1>
    <p className="my-4">Choose what sounds close. These are starting ideas; you can choose any practice instead.</p>
    <div className="grid gap-3" role="group" aria-label="What you need now">
      {NEED_ENTRIES.map(item => <button type="button" key={item.id} aria-pressed={need?.id === item.id} className={`min-h-14 rounded-2xl border p-4 text-left ${need?.id === item.id ? 'border-primary bg-secondary' : 'border-border bg-card'}`} onClick={() => setNeed(item)}>{item.label}</button>)}
    </div>
    {need && <section className="my-6 rounded-2xl border border-border p-5" aria-live="polite">
      <h2 className="font-heading text-2xl">You could try {JOURNEY_EXPERIENCES[need.practice].name}</h2>
      <p className="my-3">{need.reason}</p>
      <button type="button" className="min-h-12 rounded-full bg-primary px-6 text-primary-foreground" onClick={begin}>Explore this practice</button>
    </section>}
    <div className="my-5 flex flex-col gap-3"><Link className="min-h-11 underline" to="/library">Choose from all practices</Link><Link className="min-h-11 underline" to="/reset" state={{ unsure:true }}>I am not sure — guide me</Link><Link className="min-h-11 underline" to="/return-points">Return to something I saved</Link></div>
  </main>;
}
