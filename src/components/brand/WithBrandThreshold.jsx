import React, { useState } from "react";
import BrandThreshold from "@/components/brand/BrandThreshold";

/**
 * Shows the brand Threshold, then hands over to the intervention.
 *
 * Handoff order: the threshold plays -> the intervention mounts UNDER the
 * still-opaque threshold (so it can paint and fade in without ever flashing
 * the page background) -> the threshold lifts. The intervention is not mounted
 * while the threshold plays, so its timers, audio and narration start only
 * as the door opens.
 *
 * Pass `id` and `name` of the single intervention being started.
 */
export default function WithBrandThreshold({ id, name, children }) {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);
  const skip = !id || !name;
  // The tree shape stays the same for the whole life of the component, so the
  // intervention is never remounted (which would restart its clocks).
  return (
    <>
      {skip || mounted ? children : null}
      {skip || done ? null : (
        <BrandThreshold id={id} name={name} onReady={() => setMounted(true)} onDone={() => setDone(true)} />
      )}
    </>
  );
}
