import React, { useEffect, useMemo, useRef } from "react";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useWordReveal } from "@/hooks/useWordReveal";
import { hapticPattern } from "@/lib/feedback";

const BODY_ASSET = "/media/images/pmr-body-neutral-cutout.png";

const PMR_POSE_ASSETS = {
  hands: "/media/images/pmr-motion/pmr-hands-tense.png",
  shoulders: "/media/images/pmr-motion/pmr-shoulders-tense.png",
  face: "/media/images/pmr-motion/pmr-face-tense.png",
  torso: "/media/images/pmr-motion/pmr-torso-tense.png",
  hips: "/media/images/pmr-motion/pmr-hips-tense.png",
  thighs: "/media/images/pmr-motion/pmr-thighs-tense.png",
  lowerLegs: "/media/images/pmr-motion/pmr-lower-legs-tense.png",
};

function normalisePMRWord(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function findPMRReleaseCue(tokens = []) {
  const releaseWords = new Set([
    "let",
    "release",
    "soften",
    "drop",
  ]);

  for (const token of tokens) {
    if (token?.wordIndex == null) continue;

    const word = normalisePMRWord(token.text);

    if (releaseWords.has(word)) {
      return token.wordIndex;
    }
  }

  return null;
}

function findPMRCue(tokens = [], cueWords = []) {
  const cues = new Set(cueWords);

  for (const token of tokens) {
    if (token?.wordIndex == null) continue;
    if (cues.has(normalisePMRWord(token.text))) return token.wordIndex;
  }

  return null;
}

const TENSION_CUES = {
  hands: ["tense", "squeeze", "clench"],
  shoulders: ["lift", "raise"],
  face: ["tense", "tighten", "clench"],
  torso: ["tighten", "brace", "tense"],
  hips: ["tense", "squeeze"],
  thighs: ["tense", "tighten"],
  lowerLegs: ["tense", "press"],
};

const BODY_REGIONS = [
  "hands",
  "shoulders",
  "face",
  "torso",
  "hips",
  "thighs",
  "lowerLegs",
];

const REGION_LABELS = {
  hands: "Hands & forearms",
  shoulders: "Upper arms & shoulders",
  face: "Jaw & face",
  torso: "Chest & abdomen",
  hips: "Glutes & hips",
  thighs: "Thighs",
  lowerLegs: "Calves & feet",
  whole: "Whole body",
};

const SECTION_LABELS = ["Upper body", "Centre", "Lower body", "Rest"];

const SECTION_FOR_REGION = {
  hands: 0,
  shoulders: 0,
  face: 0,
  torso: 1,
  hips: 1,
  thighs: 2,
  lowerLegs: 2,
  whole: 3,
};

// Placement is expressed as a percentage of the actual body image box.
// The light is clipped to a real-alpha PNG, so no rectangular glow leaks
// outside the figure even when the radial fields overlap.
const REGION_BOX = {
  face: { top: "11%", left: "40%", width: "20%", height: "8%" },
  shoulders: [
    { top: "14%", left: "15%", width: "34%", height: "24%" },
    { top: "14%", left: "51%", width: "34%", height: "24%" },
  ],
  torso: { top: "30%", left: "32%", width: "36%", height: "20%" },
  hands: [
    { top: "35%", left: "3%", width: "26%", height: "23%" },
    { top: "35%", left: "71%", width: "26%", height: "23%" },
  ],
  hips: { top: "43%", left: "31%", width: "38%", height: "17%" },
  thighs: [
    { top: "53%", left: "26%", width: "22%", height: "27%" },
    { top: "53%", left: "52%", width: "22%", height: "27%" },
  ],
  lowerLegs: [
    { top: "74%", left: "26%", width: "22%", height: "25%" },
    { top: "74%", left: "52%", width: "22%", height: "25%" },
  ],
  whole: { top: "1%", left: "7%", width: "86%", height: "98%" },
};

const REGION_MARKERS = {
  hands: [
    { top: "50%", left: "20%" },
    { top: "50%", left: "80%" },
  ],
  shoulders: [
    { top: "21%", left: "36%" },
    { top: "21%", left: "64%" },
  ],
  face: [{ top: "15.5%", left: "50%" }],
  torso: [{ top: "38%", left: "50%" }],
  hips: [
    { top: "51%", left: "42%" },
    { top: "51%", left: "58%" },
  ],
  thighs: [
    { top: "62%", left: "41%" },
    { top: "62%", left: "59%" },
  ],
  lowerLegs: [
    { top: "80%", left: "42%" },
    { top: "80%", left: "58%" },
  ],
  whole: [{ top: "50%", left: "50%" }],
};

const FACE_FOCUS_MARKERS = {
  jaw: [{ top: "15.5%", left: "50%" }],
  eyes: [{ top: "11.8%", left: "50%" }],
  forehead: [{ top: "8.4%", left: "50%" }],
};

const PHASE_COPY = {
  intro: "SETTLE IN",
  tense: "TENSE",
  release: "LET GO",
  rest: "REST",
  return: "RETURN",
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function releasedRegionsBefore(steps, stepIndex) {
  if (!Array.isArray(steps)) return [];
  const released = new Set();
  steps.slice(0, stepIndex).forEach((item) => {
    if (item?.phase === "release" && BODY_REGIONS.includes(item.region)) {
      released.add(item.region);
    }
  });
  return [...released];
}

function GlowBoxes({ name, active, phase, settled }) {
  const boxes = REGION_BOX[name];
  if (!boxes) return null;
  const list = Array.isArray(boxes) ? boxes : [boxes];
  const isActive = active === name;

  const className = [
    "pmr-v2-glow",
    `pmr-v2-glow--${name}`,
    isActive ? "is-active" : "",
    isActive ? `is-${phase}` : "",
    settled ? "is-settled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return list.map((box, index) => (
    <div key={`${name}-${index}`} className={className} style={box} aria-hidden="true">
      <span className="pmr-v2-glow-core" />
    </div>
  ));
}

function MarkerPoints({ region, phase, stepIndex, reducedMotion, points: suppliedPoints }) {
  const points = suppliedPoints || REGION_MARKERS[region] || [];

  return points.map((point, index) => (
    <div
      key={`focus-${region}-${stepIndex}-${index}`}
      className={[
        "pmr-v2-tension-focus",
        `is-${phase}`,
        reducedMotion ? "is-reduced-motion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={point}
      aria-hidden="true"
    />
  ));
}

function RipplePoints({ region, stepIndex }) {
  const points = REGION_MARKERS[region] || [];

  return points.map((point, index) => (
    <div
      key={`ripple-${region}-${stepIndex}-${index}`}
      className="pmr-v2-ripple"
      style={{ ...point, animationDelay: `${index * 90}ms` }}
      aria-hidden="true"
    />
  ));
}

function IntroArrival({ stepIndex, backReached, handsReached, settledReached, readyReached }) {
  return (
    <div key={`intro-arrival-${stepIndex}`} className="pmr-v2-intro-arrival" aria-hidden="true">
      <div className="pmr-v2-intro-scan" />

      {backReached && <div className="pmr-v2-intro-support pmr-v2-intro-support--back" />}

      {handsReached && (
        <>
          <div className="pmr-v2-intro-support pmr-v2-intro-support--left-hand" />
          <div className="pmr-v2-intro-support pmr-v2-intro-support--right-hand" />
        </>
      )}

      {settledReached && (
        <>
          <div className="pmr-v2-intro-support pmr-v2-intro-support--hips" />
          <div className="pmr-v2-intro-support pmr-v2-intro-support--left-foot" />
          <div className="pmr-v2-intro-support pmr-v2-intro-support--right-foot" />
          <div className="pmr-v2-intro-whole-pulse" />
        </>
      )}

      {readyReached && (
        <>
          <div className="pmr-v2-intro-ready pmr-v2-intro-ready--left" />
          <div className="pmr-v2-intro-ready pmr-v2-intro-ready--right" />
        </>
      )}
    </div>
  );
}

function BodyFigure({
  region,
  phase,
  movementPhase,
  released,
  reducedMotion,
  stepIndex,
  markerPoints,
  introState,
}) {
  const activeRegion = region === "whole" ? null : region;
  const settled = new Set(released);

  const isTensing =
    movementPhase === "tense" &&
    activeRegion &&
    Boolean(PMR_POSE_ASSETS[activeRegion]);

  const isReleasing =
    movementPhase === "release" &&
    activeRegion &&
    Boolean(PMR_POSE_ASSETS[activeRegion]);

  const isWholeRelease =
    region === "whole" &&
    (phase === "release" || phase === "rest");

  const showReleaseRipple =
    movementPhase === "release" &&
    region !== "whole" &&
    !reducedMotion;

  const glowPhase =
    phase === "release" || movementPhase === "release" ? "release" : "tense";

  // While a muscle group is moving, clip its light to the matching pose.
  // This keeps raised shoulders, closed hands and other changed silhouettes
  // illuminated without letting the glow spill outside the body.
  const maskAsset =
    activeRegion && PMR_POSE_ASSETS[activeRegion] && (isTensing || isReleasing)
      ? PMR_POSE_ASSETS[activeRegion]
      : BODY_ASSET;

  return (
    <div
      className={[
        "pmr-v2-figure",
        `is-${phase}`,
        activeRegion ? `movement-${activeRegion}` : "",
        isTensing ? "is-body-tensing" : "",
        isReleasing ? "is-body-releasing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-region={region}
      data-movement-phase={movementPhase}
      aria-hidden="true"
    >
      <div className="pmr-v2-figure-halo" />
      <div className="pmr-v2-floor-glow" />

      <div className="pmr-v2-body-wrap">
        <img
          src={BODY_ASSET}
          alt=""
          className={[
            "pmr-v2-body-img",
            "pmr-v2-body-img--neutral",
            isTensing || isReleasing ? "is-pose-covered" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          draggable={false}
        />

        {Object.entries(PMR_POSE_ASSETS).map(([poseRegion, src]) => {
          const isCurrent = poseRegion === activeRegion;

          return (
            <img
              key={poseRegion}
              src={src}
              alt=""
              className={[
                "pmr-v2-body-img",
                "pmr-v2-motion-pose",
                `pmr-v2-motion-pose--${poseRegion}`,
                isCurrent ? "is-current" : "",
                isCurrent && isTensing ? "is-tense" : "",
                isCurrent && isReleasing ? "is-release" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              draggable={false}
            />
          );
        })}

        {activeRegion === "hands" && (
          <div className="pmr-v2-hand-motion" aria-hidden="true">
            <span className="pmr-v2-hand-clench pmr-v2-hand-clench--left" />
            <span className="pmr-v2-hand-clench pmr-v2-hand-clench--right" />
          </div>
        )}

        {activeRegion === "face" && (
          <div className="pmr-v2-face-motion" aria-hidden="true">
            <span className="pmr-v2-face-brow" />
            <span className="pmr-v2-face-eyes" />
            <span className="pmr-v2-face-jaw" />
          </div>
        )}

        <div
          className="pmr-v2-body-light-mask"
          style={{
            WebkitMaskImage: `url(${maskAsset})`,
            maskImage: `url(${maskAsset})`,
          }}
        >
          <div className="pmr-v2-base-light" />

          {phase === "intro" && !reducedMotion && (
            <IntroArrival stepIndex={stepIndex} {...introState} />
          )}

          {BODY_REGIONS.map((name) => (
            <GlowBoxes
              key={name}
              name={name}
              active={activeRegion}
              phase={glowPhase}
              settled={settled.has(name)}
            />
          ))}

          {isWholeRelease && (
            <div
              key={`whole-${stepIndex}`}
              className="pmr-v2-whole-wash"
              style={REGION_BOX.whole}
            />
          )}

          {isWholeRelease && !reducedMotion && (
            <div key={`sweep-${stepIndex}`} className="pmr-v2-whole-sweep" />
          )}

          {showReleaseRipple && (
            <RipplePoints region={region} stepIndex={stepIndex} />
          )}
        </div>

        {activeRegion && (
          <MarkerPoints
            region={activeRegion}
            phase={movementPhase}
            stepIndex={stepIndex}
            reducedMotion={reducedMotion}
            points={markerPoints}
          />
        )}
      </div>
    </div>
  );
}

function SectionProgress({ region, phase }) {
  const activeSection = phase === "intro" ? -1 : SECTION_FOR_REGION[region] ?? 3;
  const progressLabel =
    activeSection >= 0 ? `${SECTION_LABELS[activeSection]} stage` : "Preparing to begin";

  return (
    <div className="pmr-v2-section-progress" aria-label={progressLabel}>
      {SECTION_LABELS.map((label, index) => (
        <div
          key={label}
          className={`pmr-v2-section ${index < activeSection ? "is-complete" : ""} ${index === activeSection ? "is-active" : ""}`}
        >
          <span className="pmr-v2-section-dot" aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PMRV2Stage({
  step,
  steps = [],
  stepIndex,
  running,
  showBody = true,
  narrate = false,
  rate = 0.82,
  leadMs = 0,
  spoken = "",
  elapsed = 0,
  onNarrationEnd,
  onNextBodyPart,
  nextBodyPartLabel = "Next body part",
}) {
  const a11y = useAccessibilityPrefs();
  const previousStep = useRef(null);
  const region = step?.region || "whole";
  const phase = step?.phase || "rest";
  const released = useMemo(() => releasedRegionsBefore(steps, stepIndex), [steps, stepIndex]);
  const duration = Math.max(1, Number(step?.holdSec) || 1);
  const phaseProgress = clamp01(elapsed / duration);

  const { tokens, visibleCount, revealAll } = useWordReveal({
    body: step?.body,
    spoken,
    rate,
    leadMs,
    narrate,
    running,
    onEnd: onNarrationEnd,
    allowRemoteFallback: false,
  });

  const releaseCueWordIndex = useMemo(
    () => findPMRReleaseCue(tokens),
    [tokens]
  );

  const tensionCueWordIndex = useMemo(
    () => findPMRCue(tokens, TENSION_CUES[region] || []),
    [tokens, region]
  );

  const narrationHasReachedRelease =
    narrate &&
    releaseCueWordIndex != null &&
    visibleCount > releaseCueWordIndex;

  const narrationHasReachedTension =
    narrate &&
    tensionCueWordIndex != null &&
    visibleCount > tensionCueWordIndex;

  const fallbackTensionReached =
    phase === "tense" &&
    (!narrate || tensionCueWordIndex == null) &&
    phaseProgress >= 0.12;

  const fallbackReleaseReached =
    !narrate &&
    phase === "tense" &&
    phaseProgress >= 0.72;

  let movementPhase = phase;

  if (phase === "tense") {
    if (narrationHasReachedRelease || fallbackReleaseReached) {
      movementPhase = "release";
    } else if (narrationHasReachedTension || fallbackTensionReached) {
      movementPhase = "tense";
    } else {
      movementPhase = "idle";
    }
  } else if (phase === "release") {
    // The physical release occurs on the final release cue in the preceding
    // tension line. The dedicated release stage stays visually settled while
    // attention moves through the released area.
    movementPhase = "settled";
  }

  const eyesCueWordIndex = useMemo(
    () => findPMRCue(tokens, ["eyes"]),
    [tokens]
  );

  const foreheadCueWordIndex = useMemo(
    () => findPMRCue(tokens, ["forehead"]),
    [tokens]
  );

  const introBackCueWordIndex = useMemo(
    () => findPMRCue(tokens, ["back", "supported"]),
    [tokens]
  );

  const introHandsCueWordIndex = useMemo(
    () => findPMRCue(tokens, ["hands"]),
    [tokens]
  );

  const introLapCueWordIndex = useMemo(
    () => findPMRCue(tokens, ["lap"]),
    [tokens]
  );

  const faceFocus = useMemo(() => {
    if (region !== "face" || phase !== "release") return "jaw";

    if (!narrate) {
      if (phaseProgress >= 0.64) return "forehead";
      if (phaseProgress >= 0.34) return "eyes";
      return "jaw";
    }

    if (foreheadCueWordIndex != null && visibleCount > foreheadCueWordIndex) {
      return "forehead";
    }

    if (eyesCueWordIndex != null && visibleCount > eyesCueWordIndex) {
      return "eyes";
    }

    return "jaw";
  }, [
    region,
    phase,
    narrate,
    phaseProgress,
    foreheadCueWordIndex,
    eyesCueWordIndex,
    visibleCount,
  ]);

  const markerPoints =
    region === "face" ? FACE_FOCUS_MARKERS[faceFocus] : REGION_MARKERS[region];

  const introState = useMemo(() => {
    const narratedCueReached = (cueIndex, fallbackProgress) => {
      if (!narrate || cueIndex == null) return phaseProgress >= fallbackProgress;
      return visibleCount > cueIndex;
    };

    return {
      backReached:
        phase === "intro" && narratedCueReached(introBackCueWordIndex, 0.2),
      handsReached:
        phase === "intro" && narratedCueReached(introHandsCueWordIndex, 0.36),
      settledReached:
        phase === "intro" && narratedCueReached(introLapCueWordIndex, 0.56),
      readyReached: phase === "intro" && phaseProgress >= 0.82,
    };
  }, [
    phase,
    narrate,
    phaseProgress,
    visibleCount,
    introBackCueWordIndex,
    introHandsCueWordIndex,
    introLapCueWordIndex,
  ]);

  useEffect(() => {
    const key = `${stepIndex}:${phase}:${region}`;
    if (previousStep.current === key) return;
    previousStep.current = key;
    if (a11y.prefs.reducedMotion) return;

    if (phase === "tense") hapticPattern([9]);
    if (phase === "release") hapticPattern([5, 24, 4]);
    if (phase === "rest") hapticPattern([4, 32, 4]);
  }, [stepIndex, phase, region, a11y.prefs.reducedMotion]);

  return (
    <div className={`pmr-v2-stage is-${phase}`} data-phase-progress={phaseProgress.toFixed(3)}>
      <div className="pmr-v2-overline">Progressive Muscle Relaxation</div>

      <BodyFigure
        region={region}
        phase={phase}
        movementPhase={movementPhase}
        released={released}
        reducedMotion={a11y.prefs.reducedMotion}
        stepIndex={stepIndex}
        markerPoints={markerPoints}
        introState={introState}
      />

      <div key={`pmr-copy-${stepIndex}`} className="pmr-v2-copy">
        <div className="pmr-v2-phase-row">
          <div className={`pmr-v2-phase-chip is-${phase}`}>
            {PHASE_COPY[phase] || "REST"}
          </div>

          {onNextBodyPart && (
            <button
              type="button"
              className="pmr-v2-next-body"
              onClick={onNextBodyPart}
              aria-label={nextBodyPartLabel}
            >
              <span>{nextBodyPartLabel}</span>
              <span className="pmr-v2-next-body-arrow" aria-hidden="true">
                →
              </span>
            </button>
          )}
        </div>
        <h2 className="pmr-v2-instruction">{step?.title}</h2>
        <p className="pmr-v2-region-label">{REGION_LABELS[region]}</p>

        {showBody && (
          <p className="pmr-v2-caption" aria-live="polite">
            {tokens.map((token, index) => {
              if (token.space) return <span key={index}>{token.text}</span>;
              const visible = revealAll || (token.wordIndex != null && token.wordIndex < visibleCount);
              return (
                <span key={index} style={{ opacity: visible ? 1 : 0 }}>
                  {token.text}
                </span>
              );
            })}
          </p>
        )}

        <SectionProgress region={region} phase={phase} />

        <div className="pmr-v2-safety">
          <span aria-hidden="true">⌁</span>
          Skip any area that feels painful or uncomfortable.
        </div>
      </div>
    </div>
  );
}
