import React from "react";
import { useNavigate } from "react-router-dom";
import { LifeBuoy, ArrowRight } from "lucide-react";

export default function CrisisSupportCard({
  title = "Need urgent support?",
  body = "If this feels bigger than a reset, reach a crisis line now.",
  actionLabel = "Crisis support",
  compact = false,
  dark = false,
  className = "",
}) {
  const navigate = useNavigate();
  const titleId = React.useId();
  const bodyId = React.useId();
  const shell = dark
    ? "border-cream/15 bg-white/5 text-cream"
    : "border-destructive/20 bg-destructive/5 text-foreground";
  const sub = dark ? "text-cream/70" : "text-muted-foreground";
  const button = dark
    ? "border-cream/15 bg-transparent text-cream hover:bg-white/10"
    : "border-destructive/30 bg-white/70 text-destructive hover:bg-destructive/10";
  const padding = compact ? "p-4" : "p-5";

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className={`rounded-2xl border ${padding} ${shell} ${className}`}
    >
      <p id={titleId} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
        <LifeBuoy className="h-4 w-4" /> {title}
      </p>
      <p id={bodyId} className={`mt-2 text-sm leading-relaxed ${sub}`}>{body}</p>
      <button
        type="button"
        onClick={() => navigate("/support")}
        aria-describedby={bodyId}
        className={`no-tap mt-4 inline-flex min-h-12 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${button}`}
      >
        {actionLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
