import React from "react";
import StandaloneFrame from "@/components/brand/StandaloneFrame";

// Signal Lock is a local external-focus grounding game. The standalone document
// owns its resumable scene; Mentication owns routing and the shared exit controls.
export default function SignalLock() {
  return <StandaloneFrame id="signalLock" name="Signal Lock" src="/signal-lock/index.html" background="#f6f3e9" tone="light" />;
}
