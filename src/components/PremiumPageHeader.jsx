import React from "react";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PremiumTrustStrip from "@/components/PremiumTrustStrip";

export default function PremiumPageHeader({
  eyebrow,
  title,
  body,
  trustItems = [],
  dark = false,
  homeHref = "/",
  backHref = "/",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const button = dark
    ? "text-cream/70 hover:bg-white/10 hover:text-cream"
    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground";
  const eyebrowTone = dark ? "text-[#DDB977]" : "text-[#7A572E]";
  const titleTone = dark ? "text-cream" : "text-primary";
  const bodyTone = dark ? "text-cream/70" : "text-muted-foreground";

  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (location.key !== "default" ? navigate(-1) : navigate(backHref, { replace: true }))}
          className={`no-tap flex min-h-11 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${button}`}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => navigate(homeHref)}
          className={`no-tap flex min-h-11 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${button}`}
        >
          <Home className="h-4 w-4" /> Home
        </button>
      </div>

      <div className="mt-8">
        {eyebrow && <p className={`text-[0.72rem] font-medium uppercase tracking-[0.22em] ${eyebrowTone}`}>{eyebrow}</p>}
        <h1 className={`mt-2 font-heading text-3xl font-medium tracking-tight text-balance ${titleTone}`}>{title}</h1>
        {body && <p className={`mt-3 max-w-xl text-base leading-relaxed text-balance ${bodyTone}`}>{body}</p>}
      </div>

      {!!trustItems.length && (
        <div className="mt-5">
          <PremiumTrustStrip items={trustItems} dark={dark} />
        </div>
      )}
    </header>
  );
}
