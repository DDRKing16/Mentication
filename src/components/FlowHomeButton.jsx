import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

// A subtle, always-available way back to the home screen from any step of the
// reset flow. Rendered alongside (or instead of) the step "Back" control.
export default function FlowHomeButton({ className = "" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className={
        "no-tap flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground " +
        className
      }
    >
      <Home className="h-4 w-4" strokeWidth={1.8} /> Home
    </button>
  );
}
