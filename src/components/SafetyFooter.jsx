// @ts-check
import React, { useState } from "react";
import { ShieldCheck, Accessibility } from "lucide-react";
import WellbeingNotice from "@/components/WellbeingNotice";
import AccessibilityPanel from "@/components/AccessibilityPanel";

export default function SafetyFooter({ dark = false }) {
  const [safety, setSafety] = useState(false);
  const [a11y, setA11y] = useState(false);
  const tone = dark ? "text-cream/72 hover:text-cream" : "text-muted-foreground hover:text-foreground";
  const dot = dark ? "text-cream/35" : "text-muted-foreground/40";

  return (
    <>
      <div className="mt-12 flex items-center justify-center gap-5 text-sm">
        <button onClick={() => setSafety(true)} className={"no-tap flex items-center gap-1.5 font-medium transition-colors " + tone}>
          <ShieldCheck className="h-4 w-4" strokeWidth={1.7} /> Crisis support
        </button>
        <span className={dot}>·</span>
        <button onClick={() => setA11y(true)} className={"no-tap flex items-center gap-1.5 font-medium transition-colors " + tone}>
          <Accessibility className="h-4 w-4" strokeWidth={1.7} /> Accessibility
        </button>
      </div>
      {safety && <WellbeingNotice onClose={() => setSafety(false)} dark={dark} />}
      {a11y && <AccessibilityPanel onClose={() => setA11y(false)} dark={dark} />}
    </>
  );
}