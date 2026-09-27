import { useEffect } from "react";

// Lets Escape close a floating panel (sheet, popover, dialog) the same way
// tapping its own close control does — keyboard users get no other way out
// of these since they float over the player rather than replacing the page.
export function useEscapeToClose(active, onClose) {
  useEffect(() => {
    if (!active || typeof onClose !== "function") return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onClose]);
}
