import {useAppBack} from '@/hooks/useAppBack';
// Keep existing /plus links useful without selling access to free journeys.
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CalendarDays, Map, Sparkles } from "lucide-react";
import { clearTestPlus, managePlus, restorePlus, usePlus } from "@/lib/subscription";

const INCLUDED = [
  { icon: BookOpen, title: "Dear 2100", text: "The full journey from what you keep putting off to one real first step, saved as your own book." },
  { icon: Map, title: "The Good Map", text: "Sort what makes life feel good, see your map, and close the biggest gap one small step at a time." },
  { icon: CalendarDays, title: "Programmes", text: "Five days of small lifts, and Five better nights: one short practice a day." },
  { icon: Sparkles, title: "Everything new", text: "New journeys and programmes as they're added." },
];

export default function Plus() {
  const navigate = useNavigate();
  const goBack=useAppBack();
  const location = useLocation();
  const plus = usePlus();
  const [message, setMessage] = useState("");
  const from = new URLSearchParams(location.search).get("from");
  const returnTo = from && /^(good-map|dear-2100|foundations|programmes(?:\/[a-z0-9-]+)?)$/.test(from) ? `/${from}` : "/restructure";
  const restore = async () => {
    try {
      const result = await restorePlus();
      setMessage(result.active ? "An active Plus subscription is recorded on this device." : "No active Plus subscription is recorded on this device.");
    } catch {
      setMessage("Couldn't reach the App Store. Your free access is unchanged.");
    }
  };
  return (
    <div className="min-h-full bg-[#0A1F3D] text-[#F6EFE2]">
      <main className="mx-auto max-w-xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button onClick={goBack} className="flex min-h-11 items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h1 className="mt-6 font-serif text-3xl">All journeys are free</h1>
        <p className="mt-3">Dear 2100, The Good Map, Foundations and programmes are open to everyone. No purchase or trial is needed.</p>
        <button onClick={() => navigate(returnTo, { replace: true })} className="mt-6 min-h-11 rounded-full border px-5">Continue exploring</button>
        <ul className="mt-8 space-y-4">
          {INCLUDED.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-[20px] border border-white/10 p-4">
              <Icon className="h-5 w-5 shrink-0" />
              <span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-[#F6EFE2]/70">{text}</span></span>
            </li>
          ))}
        </ul>
        <section className="mt-8 rounded-2xl border border-white/20 p-5">
          <h2 className="font-semibold">Subscription status</h2>
          <p className="mt-2 text-sm">{plus.test ? "A development test purchase is recorded. This is not a paid subscription." : plus.active ? "An active Plus subscription is recorded on this device. Free access does not cancel an existing subscription." : "No active paid subscription is recorded on this device. Your journeys are still free."}</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {plus.test ? <button onClick={clearTestPlus} className="min-h-11 underline">End test purchase</button> : <button onClick={() => void managePlus()} className="min-h-11 underline">Manage existing subscription in the iPhone app</button>}
            <button onClick={restore} className="min-h-11 underline">Restore existing purchases</button>
          </div>
          {message && <p role="status" className="mt-3 text-sm">{message}</p>}
        </section>
        <button onClick={() => navigate("/privacy")} className="mt-6 min-h-11 underline">Privacy</button>
      </main>
    </div>
  );
}
