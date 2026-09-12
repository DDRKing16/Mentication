import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <main className="mx-auto max-w-xl px-5 pb-20 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate(-1)} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <ShieldCheck className="mt-8 h-10 w-10 text-primary" strokeWidth={1.5} />
        <h1 className="mt-4 font-heading text-3xl font-medium tracking-tight text-primary">Privacy in Mentication</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          V1 works without an account. Your session history, ratings, preferences and intervention memory stay on this device.
        </p>

        <div className="mt-8 space-y-6 text-[0.98rem] leading-relaxed text-foreground">
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What is stored</h2>
            <p className="mt-2 text-muted-foreground">Completed intervention IDs, timing, coarse context choices and optional outcome ratings. Sensitive free-text is not included in recommendation memory.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What leaves the device</h2>
            <p className="mt-2 text-muted-foreground">Mentication has no analytics, advertising, account server or runtime narration service. All app fonts, visuals and available narration are bundled with the app.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">External choices</h2>
            <p className="mt-2 text-muted-foreground">A support link or an audio source opens only after you choose it. The destination then operates under its own privacy terms.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">Your control</h2>
            <p className="mt-2 text-muted-foreground">Use Profile → Delete all my data to erase session history and intervention memory from this device.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
