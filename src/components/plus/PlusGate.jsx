// Wraps a Plus-only journey. Plus members go straight in; everyone else sees
// a short, honest preview of what it is, and a way to start the free trial.
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Lock } from "lucide-react";
import { usePlus } from "@/lib/subscription";

export default function PlusGate({ route, name, promise, detail, background = "#0A1F3D", previewImage, children }) {
  const plus = usePlus();
  const navigate = useNavigate();
  if (plus.hasAccess) return children;
  return (
    <div className="fixed inset-0 overflow-y-auto text-[#F6EFE2]" style={{ background }}>
      {previewImage && (
        // A real screenshot of this journey, not a mockup - a genuine
        // glimpse of what "Try it free" actually leads to, fading into the
        // lock screen rather than a flat locked door with nothing behind it.
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[46vh] overflow-hidden">
          <img src={previewImage} alt="" className="h-full w-full scale-105 object-cover object-top blur-[1.5px] opacity-70" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 35%, ${background} 96%)` }} />
        </div>
      )}
      <div className="relative flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate(-1)} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => navigate("/")} aria-label="Home" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm"><Home className="h-5 w-5" /></button>
      </div>
      <main className="relative mx-auto flex min-h-[80%] max-w-md flex-col justify-end px-6 pb-16 pt-[40vh] text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E0715C]/15 text-[#E0715C]"><Lock className="h-6 w-6" /></span>
        <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#E0715C]">Mentication Plus</p>
        <h1 className="mt-2 text-[2.1rem] italic leading-tight" style={{ fontFamily: "var(--font-editorial)" }}>{name}</h1>
        <p className="mt-3 text-lg leading-relaxed">{promise}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#F6EFE2]/70">{detail}</p>
        <button
          onClick={() => navigate(`/plus?from=${route}`)}
          className="mt-8 min-h-[3.5rem] w-full rounded-full bg-[linear-gradient(135deg,#F6EFE2,#F2C9B8)] text-base font-semibold text-[#0A1F3D] shadow-[0_18px_40px_-18px_rgba(224,113,92,0.8)]"
        >
          Try it free
        </button>
        <p className="mt-3 text-xs text-[#F6EFE2]/60">Part of Mentication Plus. The everyday tools stay free.</p>
      </main>
    </div>
  );
}
