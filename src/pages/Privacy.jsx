import React, { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLocalDataInventory, LOCAL_DATA_CHANGED_EVENT } from "@/lib/localData";

export default function Privacy() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState(() => getLocalDataInventory());

  useEffect(() => {
    const refresh = () => setInventory(getLocalDataInventory());
    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
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
        <div className="mt-6 rounded-2xl border border-primary/10 bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Zero ads. Zero trackers. Zero accounts.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Mentication does not send your session history to a remote database and does not run analytics or advertising SDKs at runtime.
          </p>
        </div>

        <div className="mt-8 space-y-6 text-[0.98rem] leading-relaxed text-foreground">
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What is stored</h2>
            <p className="mt-2 text-muted-foreground">We may remember which reset you used, how intense things felt before and after, how long you stayed, and the preferences you turn on for captions, sound, or accessibility.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What we never store in recommendation memory</h2>
            <p className="mt-2 text-muted-foreground">We do not keep the content of your reflections in recommendation memory, and the app does not need an account, inbox, or cloud profile to work.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What leaves the device</h2>
            <p className="mt-2 text-muted-foreground">Nothing leaves the device unless you choose to open an external support link or export your data file yourself. All fonts, visuals, and available narration are bundled with the app.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">What is on this device right now</h2>
            <div className="mt-3 space-y-3">
              {inventory.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
                    {item.count} {item.unit}{item.count === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-heading text-xl font-medium text-primary">Your control</h2>
            <p className="mt-2 text-muted-foreground">Use Settings to export or clear specific kinds of local data, or Profile to erase everything and start fresh.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
