import {useAppBack} from '@/hooks/useAppBack';
import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function Privacy() {
  const goBack=useAppBack();
  return (
    <div className="calmbg min-h-full">
      <main className="mx-auto max-w-xl break-words px-5 pb-20 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <button onClick={goBack} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <ShieldCheck className="mt-8 h-10 w-10 text-primary" strokeWidth={1.5} />
        <h1 className="mt-4 font-heading text-3xl font-medium tracking-tight text-primary">Privacy in Mentication</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Mentication works without an account. Your practice history, optional ratings, preferences, and saved notes and plans are stored on this device.
        </p>

        <div className="mt-8 space-y-6 text-[0.98rem] leading-relaxed text-foreground">
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What is stored</h2>
            <p className="mt-2 text-muted-foreground">Practice history includes intervention IDs, timing, context choices and optional ratings. Journeys can also store your own words, journal entries, plans and unfinished drafts so you can return to them. Sensitive free-text is not included in recommendation memory.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">Backups you choose</h2>
            <p className="mt-2 text-muted-foreground">A backup can contain your personal notes and plans. You choose where to save or share the file, which may be a cloud service with its own privacy terms. Keep it somewhere you trust. Browser notification ownership is not included in new backups and is not imported from older backups. Deleting data in Mentication does not delete copies you exported.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">Optional notifications</h2>
            <p className="mt-2 text-muted-foreground">In the iPhone app, reminders and plan check-ins are scheduled on your device after you allow notifications. Website background check-ins, when available and enabled by you, use a server and your browser’s notification provider. The server receives a random plan ID, check-in timing, push-subscription details and a random token used to manage the schedule—not your situation, answers or plan text. Hosting and notification providers also process network and delivery metadata.</p>
            <p className="mt-2 text-muted-foreground">If cancellation cannot reach the server, Mentication keeps the local information needed to retry when you reconnect. Schedule expiry does not mean every provider log or backup is immediately erased.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">Apple and external choices</h2>
            <p className="mt-2 text-muted-foreground">All journeys are free. The iPhone app can check or restore an existing subscription through Apple; Apple handles subscription management. Free access does not cancel an existing subscription. A support link or optional external source opens only after you choose it and operates under its own privacy terms.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">Your control</h2>
            <p className="mt-2 text-muted-foreground">Use Profile → Delete all my data to remove your app history, saved notes, plans and preferences from this device. Pending web-notification cancellation may need a connection to finish; the minimum cancellation information is retained until then. Manage previously exported files separately.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
