import JourneyOptions from '@/components/journey/JourneyOptions';
import { pauseJourneyFrame } from '@/lib/journeyBridge';
import React, { useEffect, useRef } from 'react';

/** Keep the approved self-contained artwork, with a narrowly scoped bridge. */
export default function VectorShiftFrame({ answers, sessionId, onComplete }) {
  const frame = useRef(null);
  const completed = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    function receive(event) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type !== 'vector-shift:complete' || data.sessionId !== sessionId || completed.current) return;
      completed.current = true;
      const helpfulness = ['helpful', 'same', 'worse', 'unsure'].includes(data.helpfulness) ? data.helpfulness : null;
      const skippedStages = Array.isArray(data.outcome?.skippedStages)
        ? [...new Set(data.outcome.skippedStages.filter(value => Number.isInteger(value) && value >= 2 && value <= 6))] : [];
      complete.current?.({
        requireGoalReassessment: true,
        helpfulness,
        exitReason: data.exitReason === 'stopped' ? 'stopped' : 'completed',
        outcome: { skippedStages, easierMode: data.outcome?.easierMode === true, gameplayOnly: true },
      });
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [sessionId]);
  return <main className="fixed inset-0 flex flex-col" style={{ background:'#0f2f23' }} aria-label="Vector Shift">
    <div className="shrink-0 px-4 py-1 text-center text-white"><JourneyOptions id="vectorShift" onOpen={() => pauseJourneyFrame(frame.current)} /></div>
    <iframe ref={frame} title="Vector Shift activities" className="min-h-0 flex-1 w-full border-0"
      src={`/vector-shift/index.html?session=${encodeURIComponent(sessionId)}&audio=${answers?.audio === 'no' || answers?.noAudio || answers?.discreet ? 'off' : 'on'}`} />
  </main>;
}
