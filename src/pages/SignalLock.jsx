import React from "react";

// Signal Lock is an independently supplied, self-contained focus experience.
// Rendering its original static build keeps its tightly coupled visual/audio
// behavior intact while Mentication remains responsible for routing.
export default function SignalLock() {
  return (
    <main className="fixed inset-0 bg-[#FFFEF5]" aria-label="Signal Lock focus flow">
      <iframe
        title="Signal Lock"
        src="/signal-lock/index.html"
        className="h-full w-full border-0"
        allow="autoplay"
      />
    </main>
  );
}
