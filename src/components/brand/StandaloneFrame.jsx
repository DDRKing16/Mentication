import React from "react";
import WithBrandThreshold from "@/components/brand/WithBrandThreshold";
import InterventionNav from "@/components/brand/InterventionNav";

/**
 * Runs a finished, self-contained intervention build (public/<name>/index.html)
 * inside Mentication: the brand Threshold first, then the build in a frame under
 * a slim top bar that carries the shared Back (left) and Home (right) buttons.
 * The bar is its own strip, so the buttons never cover the build's own controls.
 */
export default function StandaloneFrame({ id, name, src, background = "#02050B", tone = "dark", nav = {} }) {
  return (
    <WithBrandThreshold id={id} name={name}>
      <main className="fixed inset-0 flex flex-col" style={{ background }} aria-label={name}>
        <div className="relative shrink-0" style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }}>
          <InterventionNav position="absolute" tone={tone} back={nav.back !== false} home={nav.home !== false} />
        </div>
        <iframe title={name} src={src} className="min-h-0 w-full flex-1 border-0" allow="autoplay" />
      </main>
    </WithBrandThreshold>
  );
}
