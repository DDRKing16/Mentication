import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { goalPointChange } from "@/lib/goalAssessment";
import StandaloneFrame from "@/components/brand/StandaloneFrame";

// Night Channel is a finished, self-contained build (public/night-channel).
export default function NightChannel() {
  const { state } = useLocation();
  useEffect(() => {
    const receive = event => {
      const frame = document.querySelector('iframe[title="Night Channel"]');
      if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'night-baseline-request') return;
      const baseline = state?.goal_baseline;
      if (goalPointChange(baseline, state?.direction, baseline?.value) === 0) {
        event.source.postMessage({type:'night-baseline', baseline}, {targetOrigin:location.origin});
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [state]);
  return <StandaloneFrame id="nightChannel" name="Night Channel" src="/night-channel/index.html" background="#02050B" allow="autoplay; encrypted-media" />;
}
