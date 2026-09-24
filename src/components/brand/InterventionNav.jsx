import React from "react";
import { ArrowLeft, Home } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

/**
 * The shared Back (top-left) and Home (top-right) buttons.
 *
 * Every intervention has both. Interventions that already draw their own back
 * or home/exit button keep it; this is for the ones that don't, so a person
 * can always get back out.
 *
 * - Back returns to the previous screen (the Library if there is no history).
 * - Home returns to the Mentication home screen.
 *
 * `tone` is "dark" for dark worlds and "light" for light worlds.
 */
const base =
  "no-tap pointer-events-auto brand-chrome-btn grid h-11 w-11 place-items-center rounded-full transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export function useFlowNav() {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) navigate(-1);
    else navigate("/library");
  };
  const goHome = () => navigate("/");
  return { goBack, goHome };
}

export default function InterventionNav({ back = true, home = true, tone = "dark", position = "fixed" }) {
  const { goBack, goHome } = useFlowNav();
  const chromeTone = tone === "light" ? "light" : "dark";
  // "fixed" floats over the screen; "absolute" sits inside a top bar the caller provides.
  const top = position === "fixed" ? "max(0.75rem, env(safe-area-inset-top))" : "calc(env(safe-area-inset-top) + 0.5rem)";
  const buttons = (
    <>
      {back && (
        <button type="button" onClick={goBack} aria-label="Back" data-sfx="none" data-tone={chromeTone} className={`${base} ${position} left-3 z-[70]`} style={{ top }}>
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
      )}
      {home && (
        <button type="button" onClick={goHome} aria-label="Home" data-sfx="none" data-tone={chromeTone} className={`${base} ${position} right-3 z-[70]`} style={{ top }}>
          <Home className="h-5 w-5" strokeWidth={1.8} />
        </button>
      )}
    </>
  );
  // Floating buttons are rendered on the page itself, outside the intervention,
  // so an intervention's own scoped button styles can never move or restyle them.
  return position === "fixed" && typeof document !== "undefined" ? createPortal(buttons, document.body) : buttons;
}
