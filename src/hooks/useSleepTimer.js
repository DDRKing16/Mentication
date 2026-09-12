import { useState, useRef, useCallback, useEffect } from "react";

// Sleep timer: counts down, fires an onEnd callback, exposes remaining seconds.
export function useSleepTimer() {
  const [active, setActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const endRef = useRef(null);
  const onEndRef = useRef(null);
  const tickRef = useRef(null);

  const clear = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    endRef.current = null;
  };

  const cancel = useCallback(() => {
    clear();
    setActive(false);
    setSecondsLeft(0);
  }, []);

  const start = useCallback((seconds, onEnd) => {
    onEndRef.current = onEnd;
    endRef.current = Date.now() + seconds * 1000;
    setActive(true);
    setSecondsLeft(seconds);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clear();
        setActive(false);
        const cb = onEndRef.current;
        onEndRef.current = null;
        if (cb) cb();
      }
    }, 1000);
  }, []);

  useEffect(() => () => clear(), []);

  return { active, secondsLeft, start, cancel };
}