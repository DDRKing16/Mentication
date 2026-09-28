// The Mentication Plus screen: what Plus includes, the two plans, the free
// trial, restore, and the links Apple requires on a subscription screen.
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, Map, Sparkles } from "lucide-react";
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

const INCLUDED = [
  { icon: BookOpen, title: "Dear 2100", text: "The full journey from what you keep putting off to one real first step, saved as your own book." },
  { icon: Map, title: "The Good Map", text: "Sort what makes life feel good, see your map, and close the biggest gap one small step at a time." },
  { icon: Sparkles, title: "Everything new", text: "New journeys and programmes as they're added." },
];

export default function Plus() {
  const navigate = useNavigate();
  const location = useLocation();
  const plus = usePlus();
  const [plan, setPlan] = useState("annual");
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
      const result = await purchasePlus(plan);
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
            <div className="mt-8 grid gap-3" role="radiogroup" aria-label="Choose a plan">
              {[
                { key: "annual", label: "Yearly", price: prices.annual, note: "Best value" },
                { key: "monthly", label: "Monthly", price: prices.monthly, note: "" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={plan === option.key}
                  onClick={() => setPlan(option.key)}
                  className={`flex min-h-[4.25rem] items-center justify-between rounded-[20px] border px-5 text-left transition ${plan === option.key ? "border-[#E0715C] bg-[#E0715C]/12" : "border-white/15 bg-white/[0.03]"}`}
                >
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-sm text-[#F6EFE2]/70">{option.price}</span>
                  </span>
                  {option.note && <span className="rounded-full bg-[#E0715C] px-3 py-1 text-xs font-semibold text-white">{option.note}</span>}
                </button>
              ))}
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
              {PLUS_TRIAL_DAYS} days free, then {plan === "annual" ? prices.annual : prices.monthly}. Renews automatically until cancelled. Cancel anytime in your iPhone's Settings, at least 24 hours before the trial ends, and you won't be charged.
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
