// @ts-check
// Dear 2100 — updated build, 28 Sep. Replaces the earlier hand-ported flow
// with the owner's newer, finished build (public/dear2100-updated). It is
// a full, self-contained app: its own screens, its own state, its own
// on-device saving (localStorage, no account, no server — the only change
// from the supplied build, whose original saved to a signed-in ChatGPT
// account). Left visually and behaviourally exactly as supplied: no
// Mentication brand Threshold or shared header, matching how this flow
// looked before. A small Home button is added, floating in the top-right
// corner, so a person can always get back out — the one thing the original
// build didn't need, since it normally lives inside ChatGPT's own app frame.
import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import PlusGate from "@/components/plus/PlusGate";

export default function Dear2100() {
  const navigate = useNavigate();
  return (
    <PlusGate route="dear-2100" name="Dear 2100" background="#112b50"
      previewImage="/media/plus-preview/dear2100.jpg"
      promise="Understand the pattern behind what you keep postponing."
      detail="Then choose your next small step, and keep it in your own book.">
    <div className="fixed inset-0" aria-label="Dear 2100">
      <iframe title="Dear 2100" src="/dear2100-updated/index.html" className="h-full w-full border-0" allow="autoplay" />
      {/* The build's own header is busy edge-to-edge on every screen, so the
          shared Home button can't sit in a corner without covering one of
          its own controls. The middle of the right edge is clear on every
          screen of this flow, so Home lives there instead. */}
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Home"
        className="fixed right-2 top-1/2 z-[70] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/85 text-[#112b50] shadow-md backdrop-blur"
      >
        <Home className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </div>
    </PlusGate>
  );
}
