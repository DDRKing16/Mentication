import { useStandaloneScreenHistory } from "@/hooks/useStandaloneScreenHistory";
import { useStandaloneDataReset } from '@/hooks/useStandaloneDataReset';
import React, { useRef } from "react";
import JourneyOptions from "@/components/journey/JourneyOptions";
import { pauseJourneyFrame } from "@/lib/journeyBridge";
import WithBrandThreshold from "@/components/brand/WithBrandThreshold";
import InterventionNav from "@/components/brand/InterventionNav";

/**
 * Runs a finished, self-contained intervention build (public/<name>/index.html)
 * inside Mentication: the brand Threshold first, then the build in a frame under
 * a slim top bar that carries the shared Back (left) and Home (right) buttons.
 * The bar is its own strip, so the buttons never cover the build's own controls.
 */
export default function StandaloneFrame({ id, name, src, background = "#02050B", tone = "dark", nav = {}, allow = "autoplay" }) {
  const frame = useRef(null);
  const resetError = useStandaloneDataReset(frame, id, src);
  const historyError = useStandaloneScreenHistory(frame,id);
  return (
    <WithBrandThreshold id={id} name={name}>
      <main className="fixed inset-0 flex flex-col" style={{ background }} aria-label={name}>
        {(nav.back !== false || nav.home !== false) && <div className="relative shrink-0" style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }}>
          <InterventionNav position="absolute" tone={tone} back={nav.back !== false} home={nav.home !== false} />
        </div>}
        <iframe ref={frame} title={name} src={src} className="min-h-0 w-full flex-1 border-0" allow={allow} style={{ width: "100%", maxWidth: "none" }} />
        <footer className="journey-frame-footer" style={{ color: tone === 'light' ? '#172d32' : '#fffdf7' }}>
          {resetError && <p role="alert">{resetError}</p>}
          {historyError && <p role="alert">{historyError}</p>}
          <JourneyOptions id={id} onOpen={() => pauseJourneyFrame(frame.current)} />
        </footer>
      </main>
    </WithBrandThreshold>
  );
}
