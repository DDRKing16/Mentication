import { createContext, useRef } from "react";

/**
 * Shared direction of the most recent navigation: +1 for a forward/push
 * transition, -1 for a pop/back. Consumed by the page-transition AnimatePresence
 * layers so pages slide in from the right on forward nav and slide out to the
 * right on back.
 */
export const DirectionContext = createContext(1);

/**
 * Derives the navigation direction from a pathname history stack, computed
 * synchronously during render (so the entering page reads the correct
 * direction before it animates in). Idempotent across re-renders of the same
 * pathname (StrictMode-safe).
 */
export function useNavigationDirection(pathname) {
  const stackRef = useRef([pathname]);
  const idxRef = useRef(0);
  const dirRef = useRef(1);
  const lastRef = useRef(pathname);

  if (pathname !== lastRef.current) {
    const stack = stackRef.current;
    const idx = idxRef.current;
    if (stack[idx - 1] === pathname) {
      idxRef.current = idx - 1;
      dirRef.current = -1;
    } else if (stack[idx + 1] === pathname) {
      idxRef.current = idx + 1;
      dirRef.current = 1;
    } else {
      stackRef.current = stack.slice(0, idx + 1);
      stackRef.current.push(pathname);
      idxRef.current = stackRef.current.length - 1;
      dirRef.current = 1;
    }
    lastRef.current = pathname;
  }
  return dirRef.current;
}