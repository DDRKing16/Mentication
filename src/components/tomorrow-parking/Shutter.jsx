import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import ThoughtLines from "./ThoughtLines";

// The glass shutter. One weighted downward gesture closes the door over the
// note. Closing prepares the note; the separate button remains the deliberate
// confirmation that writes it to storage.
//
// Accessibility: an ARIA slider with keyboard support (Arrow/Page/Home/End,
// Enter or Space to complete). Drag is never the only route — the parent always
// renders an equally prominent button.
export default function Shutter({ noteText, onClosed, disabled = false, reducedMotion = false }) {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setClosing(true);
    setProgress(1);
    window.setTimeout(onClosed, reducedMotion ? 20 : 860);
  }, [onClosed, reducedMotion]);

  const setFromPointer = useCallback((clientY) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const restingHeight = rect.height * 0.25;
    const travel = Math.max(1, rect.height - restingHeight);
    const next = (clientY - rect.top - restingHeight / 2) / travel;
    setProgress(Math.min(1, Math.max(0, next)));
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (e) => setFromPointer(e.clientY);
    const up = () => {
      setDragging(false);
      // Predictable threshold: an incomplete drag returns to rest.
      setProgress((p) => {
        if (p >= 0.6) {
          finish();
          return 1;
        }
        return 0;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging, setFromPointer, finish]);

  const nudge = (delta) => setProgress((p) => Math.min(1, Math.max(0, Number((p + delta).toFixed(3)))));

  const onKeyDown = (e) => {
    if (disabled) return;
    const map = { ArrowDown: 0.1, ArrowRight: 0.1, ArrowUp: -0.1, ArrowLeft: -0.1, PageDown: 0.25, PageUp: -0.25 };
    if (e.key in map) {
      e.preventDefault();
      nudge(map[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setProgress(0);
    } else if (e.key === "End" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      finish();
    }
  };

  const pct = Math.round(progress * 100);

  return (
    <div>
      <div ref={trackRef} className="tpl-shutter-track">
        <ThoughtLines still={closing} intensity={1 - progress * 0.7} />
        <div aria-hidden="true" className="tpl-rail tpl-rail--left" />
        <div aria-hidden="true" className="tpl-rail tpl-rail--right" />

        <div
          className="tpl-shutter-note"
          style={{ opacity: 1 - progress * 0.6, filter: `blur(${(progress * 3.4).toFixed(2)}px)` }}
        >
          {noteText}
        </div>

        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Glass shutter. Slide down to close before parking your note."
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% closed`}
          aria-disabled={disabled}
          onPointerDown={(e) => {
            if (disabled) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragging(true);
            setFromPointer(e.clientY);
          }}
          onKeyDown={onKeyDown}
          className="tpl-shutter-door"
          style={{
            transform: `translateY(${((progress - 1) * 75).toFixed(2)}%)`,
            transition: dragging ? "none" : "transform 860ms cubic-bezier(0.16,0.86,0.24,1)",
          }}
        >
          <div aria-hidden="true" className="tpl-shutter-door__sheen" />
          <div aria-hidden="true" className="tpl-shutter-door__seams" />
          <div aria-hidden="true" className="tpl-shutter-door__top" />
          <div aria-hidden="true" className="tpl-shutter-door__lip" />

          <div className="tpl-handle-wrap">
            <div className="tpl-handle">
              {[0, 1, 2, 3].map((i) => <span key={i} aria-hidden="true" className="tpl-handle__grip" />)}
              {progress < 0.05 && <ChevronDown aria-hidden="true" style={{ marginLeft: 6, width: 16, height: 16, color: "var(--tpl-shutter-fg)" }} />}
            </div>
            <span className="tpl-handle__hint">{progress >= 1 ? "Closed" : "Slide down to close"}</span>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="tpl-shutter-live">
        {progress >= 1 ? "Closed. Park it when you're ready." : progress > 0.05 ? "Keep sliding" : ""}
      </p>
    </div>
  );
}
