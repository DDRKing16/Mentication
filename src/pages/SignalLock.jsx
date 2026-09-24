import React from "react";
import StandaloneFrame from "@/components/brand/StandaloneFrame";

// Signal Lock is an independently supplied, self-contained focus experience.
// Rendering its original static build keeps its tightly coupled visual/audio
// behavior intact while Mentication remains responsible for routing.
export default function SignalLock() {
  return <StandaloneFrame id="signalLock" name="Signal Lock" src="/signal-lock/index.html" background="#FFFEF5" tone="light" />;
}
