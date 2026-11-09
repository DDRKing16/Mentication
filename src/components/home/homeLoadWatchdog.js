export const HOME_LOAD_TIMEOUT_MS = 12000;
export function watchHomeLoad({ ready, onTimeout, setTimer = setTimeout, clearTimer = clearTimeout }) {
  if (ready) return undefined;
  const timer = setTimer(onTimeout, HOME_LOAD_TIMEOUT_MS);
  return () => clearTimer(timer);
}
