import React, { useEffect, useRef } from "react";
import { useActivation } from "@/components/grounding54321/useActivation";
import { hapticPattern } from "@/lib/feedback";
import {
  SEE_ORB_GLOWS,
  FEEL_POINTS,
  HEAR_WAVES,
  SMELL_WISPS,
  TASTE_DROP,
} from "@/lib/grounding54321Layout";

// 5-4-3-2-1 Grounding V2 — sense-specific CSS overlays.
//
// Sits alongside the stable central PNG (never redraws, replaces, or
// reloads it). Each sense renders lightweight, pointer-events:none overlays.
// A single mapped orb glow is active per stage, while FEEL/HEAR/SMELL/TASTE
// keep their own stage-specific sensory overlays.

const STAGE_ORB_ID = {
  sight: "upper-right",
  touch: "lower-right",
  hearing: "bottom-center",
  smell: "lower-left",
  taste: "upper-left",
};

const BODY_CENTER = { left: 50, top: 52 };

function RecenterEnergyOverlay() {
  return (
    <>
      <div className="grounding-recenter-energy" aria-hidden="true">
        {SEE_ORB_GLOWS.map((orb, i) => {
          const dx = BODY_CENTER.left - orb.left;
          const dy = BODY_CENTER.top - orb.top;
          const length = Math.sqrt((dx * dx) + (dy * dy));
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <span
              key={orb.id}
              className="grounding-recenter-beam"
              style={{
                left: `${orb.left}%`,
                top: `${orb.top}%`,
                width: `${length}%`,
                "--beam-angle": `${angle}deg`,
                "--beam-color": orb.color,
                animationDelay: `${i * 150}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="grounding-recenter-body-light" aria-hidden="true" />
    </>
  );
}

function StageOrbHighlight({ sense, progress = 0 }) {
  const activeId = STAGE_ORB_ID[sense];
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  // Reach strong illumination early in each phase (~1-2s across current holds).
  const ramp = Math.min(1, p / 0.14);
  const power = ramp * ramp * (3 - 2 * ramp);
  return (
    <>
      {SEE_ORB_GLOWS.map((o) => (
        <span
          key={o.id}
          className={"grounding-stage-orb" + (sense === "recenter" || o.id === activeId ? " grounding-stage-orb--active" : "")}
          style={{ left: `${o.left}%`, top: `${o.top}%`, "--stage-orb-color": o.color, "--stage-orb-power": sense === "recenter" || o.id === activeId ? power : 0 }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

function FeelRippleOverlay({ progress }) {
  const { activated } = useActivation(FEEL_POINTS.length, progress);
  return (
    <>
      {FEEL_POINTS.map(
        (p, i) =>
          activated[i] && (
            <span
              key={p.id}
              className="grounding-feel-ripple"
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.3}s` }}
              aria-hidden="true"
            />
          )
      )}
    </>
  );
}

function HearPulseOverlay({ progress }) {
  const { activated } = useActivation(HEAR_WAVES.length, progress);
  return (
    <>
      {HEAR_WAVES.map(
        (w, i) =>
          activated[i] && (
            <span
              key={w.id}
              className="grounding-hear-pulse"
              style={{ left: `${w.x}%`, top: `${w.y}%`, animationDelay: `${i * 0.4}s` }}
              aria-hidden="true"
            />
          )
      )}
    </>
  );
}

function SmellWispOverlay({ progress }) {
  const { activated } = useActivation(SMELL_WISPS.length, progress);
  return (
    <>
      {SMELL_WISPS.map(
        (p, i) =>
          activated[i] && (
            <span
              key={p.id}
              className="grounding-smell-wisp"
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.6}s` }}
              aria-hidden="true"
            />
          )
      )}
    </>
  );
}

function TasteGlowOverlay({ progress }) {
  const p = Math.min(1, Math.max(0, progress));
  const travel = Math.min(1, p / 0.7);
  const left = TASTE_DROP.x + (TASTE_DROP.target.x - TASTE_DROP.x) * travel;
  const top = TASTE_DROP.y + (TASTE_DROP.target.y - TASTE_DROP.y) * travel;
  const settled = p > 0.7;
  return (
    <span
      className={"grounding-taste-glow" + (settled ? " grounding-taste-glow--settled" : "")}
      style={{ left: `${left}%`, top: `${top}%` }}
      aria-hidden="true"
    />
  );
}

export default function SenseOverlay({ sense, progress = 0 }) {
  const orbHapticFiredRef = useRef(false);

  useEffect(() => {
    orbHapticFiredRef.current = false;
  }, [sense]);

  useEffect(() => {
    if (!sense || orbHapticFiredRef.current) return;
    if (progress < 0.12) return;
    orbHapticFiredRef.current = true;
    switch (sense) {
      case "sight":
        hapticPattern([6]);
        break;
      case "touch":
        hapticPattern([6, 14, 5]);
        break;
      case "hearing":
        hapticPattern([5, 20, 4]);
        break;
      case "smell":
        hapticPattern([6, 12, 5]);
        break;
      case "taste":
        hapticPattern([8]);
        break;
      default:
        break;
    }
  }, [sense, progress]);

  let stageOverlay = null;

  switch (sense) {
    case "touch":
      stageOverlay = <FeelRippleOverlay progress={progress} />;
      break;
    case "hearing":
      stageOverlay = <HearPulseOverlay progress={progress} />;
      break;
    case "smell":
      stageOverlay = <SmellWispOverlay progress={progress} />;
      break;
    case "taste":
      stageOverlay = <TasteGlowOverlay progress={progress} />;
      break;
    default:
      stageOverlay = null;
  }

  return (
    <>
      <StageOrbHighlight sense={sense} progress={progress} />
      {sense === "recenter" && <RecenterEnergyOverlay />}
      {stageOverlay}
    </>
  );
}
