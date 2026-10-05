// The Mentication Plus screen: what Plus includes, the two plans, the free
// trial, restore, and the links Apple requires on a subscription screen.
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CalendarDays, Check, Map, Sparkles } from "lucide-react";
import {
  FALLBACK_PRICES,
  PLUS_TRIAL_DAYS,
  clearTestPlus,
  loadPlusPrices,
  managePlus,
  purchasePlus,
  restorePlus,
  usePlus,
} from "@/lib/subscription";

const APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
// Shown only if the real price genuinely couldn't be confirmed from the App
// Store (never a specific number, which could be the wrong currency).
const PRICE_UNKNOWN = "Price shown at checkout";

const INCLUDED = [
  { icon: BookOpen, title: "Dear 2100", text: "The full journey from what you keep putting off to one real first step, saved as your own book." },
  { icon: Map, title: "The Good Map", text: "Sort what makes life feel good, see your map, and close the biggest gap one small step at a time." },
  { icon: CalendarDays, title: "Programmes", text: "Five days of small lifts, and Five better nights: one short practice a day." },
  { icon: Sparkles, title: "Everything new", text: "New journeys and programmes as they're added." },
];

export default function Plus() {
  const navigate = useNavigate();
  const location = useLocation();
  const plus = usePlus();
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  // Where to go once someone subscribes: back to what they were trying to open.
  const returnTo = new URLSearchParams(location.search).get("from");

  useEffect(() => {
    let alive = true;
    loadPlusPrices().then((p) => { if (alive) setPrices(p); });
    return () => { alive = false; };
  }, []);

  const start = async () => {
    setBusy("buy");
    setMessage("");
    try {
      const result = await purchasePlus("monthly");
      if (result.active && returnTo) navigate(`/${returnTo}`, { replace: true });
    } catch (e) {
      // Cancelling the Apple sheet isn't an error worth shouting about.
      const text = e instanceof Error ? e.message : "";
      if (!/cancel/i.test(text)) setMessage(text || "The purchase didn't go through. Nothing was charged.");
    } finally {
      setBusy("");
    }
  };

  const restore = async () => {
    setBusy("restore");
    setMessage("");
    try {
      const result = await restorePlus();
      setMessage(result.active ? "Welcome back. Plus is active." : "No active Plus subscription was found for this Apple ID.");
    } catch {
      setMessage("Couldn't reach the App Store. Check your connection and try again.");
    } finally {
      setBusy("");
    }
  };

  if (plus.founderPreview) return (
    <div className="min-h-full bg-[#0A1F3D] px-5 py-12 text-[#F6EFE2]">
      <main className="mx-auto max-w-xl">
        <h1 className="text-2xl">Founder testing preview</h1>
        <p className="mt-4">All experiences are open for testing on this preview. This is not a paid subscription; no purchase is needed.</p>
        <button onClick={() => navigate(returnTo ? `/${returnTo}` : "/restructure")} className="mt-6 min-h-11 rounded-full border px-5">Continue exploring</button>
      </main>
    </div>
  );

  return (
    <div className="min-h-full bg-[#0A1F3D] text-[#F6EFE2]">
      <main className="mx-auto max-w-xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate(-1)} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-[#F6EFE2]/70 hover:text-[#F6EFE2]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#E0715C]">Mentication Plus</p>
        <h1 className="mt-2 font-serif text-[2.15rem] italic leading-[1.1]" style={{ fontFamily: "var(--font-editorial)" }}>
          Go deeper than a quick reset.
        </h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-[#F6EFE2]/75">
          The everyday tools stay free, always. Plus opens the longer journeys, the ones built to change something over weeks, not minutes.
        </p>

        {plus.active ? (
          <section className="mt-8 rounded-[24px] border border-[#8AECC7]/30 bg-[#8AECC7]/10 p-5">
            <p className="flex items-center gap-2 font-semibold text-[#8AECC7]"><Check className="h-5 w-5" /> You're a Plus member</p>
            <p className="mt-2 text-sm text-[#F6EFE2]/75">Everything below is open to you.{plus.test ? " (Test purchase: development only.)" : ""}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {returnTo && <button onClick={() => navigate(`/${returnTo}`, { replace: true })} className="min-h-11 rounded-full bg-[#F6EFE2] px-5 text-sm font-semibold text-[#0A1F3D]">Continue</button>}
              {plus.test
                ? <button onClick={clearTestPlus} className="min-h-11 rounded-full border border-white/25 px-5 text-sm">End test purchase</button>
                : <button onClick={() => void managePlus()} className="min-h-11 rounded-full border border-white/25 px-5 text-sm">Manage subscription</button>}
            </div>
          </section>
        ) : null}

        <ul className="mt-8 space-y-4">
          {INCLUDED.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#E0715C]/15 text-[#E0715C]"><Icon className="h-5 w-5" /></span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[#F6EFE2]/70">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        {!plus.active && (
          <>
            <div className="mt-8 rounded-[20px] border border-[#E0715C] bg-[#E0715C]/12 px-5 py-4 text-left" aria-label="Plus plan">
              <span className="flex items-center justify-between gap-3">
                <span>
                  <span className="block font-semibold">Monthly</span>
                  <span className="mt-0.5 block text-sm text-[#F6EFE2]/70">{prices.monthly ?? PRICE_UNKNOWN}</span>
                </span>
                <span className="rounded-full bg-[#E0715C] px-3 py-1 text-xs font-semibold text-white">{PLUS_TRIAL_DAYS}-day free trial</span>
              </span>
            </div>

            <button
              type="button"
              onClick={start}
              disabled={Boolean(busy)}
              className="mt-6 min-h-[3.5rem] w-full rounded-full bg-[linear-gradient(135deg,#F6EFE2,#F2C9B8)] text-base font-semibold text-[#0A1F3D] shadow-[0_18px_40px_-18px_rgba(224,113,92,0.8)] disabled:opacity-60"
            >
              {busy === "buy" ? "Opening the App Store…" : `Start ${PLUS_TRIAL_DAYS}-day free trial`}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-[#F6EFE2]/60">
              {PLUS_TRIAL_DAYS} days free, then {(prices.monthly ?? "your local price (shown at checkout)")}. Renews automatically until cancelled. Cancel anytime in your iPhone's Settings, at least 24 hours before the trial ends, and you won't be charged.
            </p>
          </>
        )}

        {message && <p role="status" className="mt-4 rounded-2xl bg-white/[0.06] p-3 text-center text-sm">{message}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#F6EFE2]/60">
          {!plus.active && <button onClick={restore} disabled={Boolean(busy)} className="min-h-11 underline underline-offset-4">{busy === "restore" ? "Restoring…" : "Restore purchases"}</button>}
          <a href={APPLE_EULA} target="_blank" rel="noreferrer" className="min-h-11 content-center underline underline-offset-4">Terms of Use</a>
          <button onClick={() => navigate("/privacy")} className="min-h-11 underline underline-offset-4">Privacy</button>
        </div>
      </main>
    </div>
  );
}
