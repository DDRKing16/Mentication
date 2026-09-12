import React from "react";
import BoxBreathingV2Pacer from "@/components/BoxBreathingV2Pacer";
import BoxBreathingV2InstructionFrame from "@/components/BoxBreathingV2InstructionFrame";

// The Box Breathing V2 backdrop is defined in src/index.css and rendered once
// by ResetPlayer, outside the per-step transition.
export default function BoxBreathingV2Stage({
  step,
  running,
  discreet,
  onComplete,
  paced = false,
  showBody = true,
  isOpening = false,
  isClosing = false,
  narrate = false,
  rate = 0.82,
  leadMs = 0,
  onNarrationEnd,
}) {
  const isTextStage = !paced && (isOpening || isClosing);

  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-1 bg-transparent px-0 py-0">
      <div className={isTextStage ? "pointer-events-none relative z-10 flex w-full items-center justify-center" : "relative z-10 w-full"}>
        {paced ? (
          <div className="relative z-10 flex w-full flex-col items-center justify-center">
            <BoxBreathingV2Pacer
              running={running}
              discreet={discreet}
              onComplete={onComplete}
            />
          </div>
        ) : (
          <BoxBreathingV2InstructionFrame
            step={step}
            showBody={showBody}
            isOpening={isOpening}
            isClosing={isClosing}
            narrate={narrate}
            running={running}
            rate={rate}
            leadMs={leadMs}
            onNarrationEnd={onNarrationEnd}
          />
        )}
      </div>
    </div>
  );
}
