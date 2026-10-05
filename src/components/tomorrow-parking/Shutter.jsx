import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import ThoughtLines from "./ThoughtLines";

// Closing and saving are one action. Both the gesture and button use finish;
// success is shown only after the storage adapter verifies the write.
export default function Shutter({ noteText, onClosed, onSettled, retry = false, disabled = false, reducedMotion = false }) {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const completedRef = useRef(false);
  const timer = useRef(null);
  const progressRef = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const finish = useCallback(() => {
    if (disabled || completedRef.current) return;
    completedRef.current = true;
    if (!onClosed()) {
      completedRef.current = false;
      setProgress(0);
      progressRef.current = 0;
      return;
    }
    setClosing(true);
    setProgress(1);
    timer.current = window.setTimeout(onSettled, reducedMotion ? 0 : 650);
  }, [disabled, onClosed, onSettled, reducedMotion]);

  const setFromPointer = useCallback((clientY) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const restingHeight = rect.height * 0.25;
    const travel = Math.max(1, rect.height - restingHeight);
    const next = (clientY - rect.top - restingHeight / 2) / travel;
    progressRef.current = Math.min(1, Math.max(0, next));
    setProgress(progressRef.current);
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (e) => setFromPointer(e.clientY);
    const up = () => {
      setDragging(false);
      if (progressRef.current >= 0.6) finish();
      else { progressRef.current = 0; setProgress(0); }
    };
    const cancel = () => { setDragging(false); progressRef.current = 0; setProgress(0); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
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
          aria-label="Slide down to close and save your note. Or press Enter."
          aria-orientation="vertical"
          aria-describedby="tpl-storage-summary"
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
            transition: dragging || reducedMotion ? "none" : "transform 860ms cubic-bezier(0.16,0.86,0.24,1)",
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
            <span className="tpl-handle__hint">{progress >= 1 ? "Saved" : "Pull to close & save"}</span>
          </div>
        </div>
      </div>

      <button type="button" className="tpl-btn tpl-btn--primary tpl-btn--block tpl-btn--lg" style={{ marginTop: "1rem" }} onClick={finish} disabled={disabled || closing} aria-describedby="tpl-storage-summary">{closing ? "Saved" : retry ? "Try again — close and save" : "Close and save"}</button>
      <p aria-live="polite" className="tpl-shutter-live">
        {progress >= 1 ? "Saved on this device." : progress > 0.05 ? "Keep sliding" : ""}
      </p>
    </div>
  );
}
