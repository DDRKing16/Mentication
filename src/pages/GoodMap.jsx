import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StandaloneFrame from "@/components/brand/StandaloneFrame";
import PlusGate from "@/components/plus/PlusGate";
import { bindJourneyScreenHistory } from "@/lib/journeyScreenHistory";

// The Good Map is a finished, self-contained build (public/good-map).
export default function GoodMap() {
  const navigate = useNavigate();
  useEffect(() => {
    const getFrame = () => document.querySelector('iframe[title="The Good Map"]');
    const cleanupHistory = bindJourneyScreenHistory({
      id: 'goodMap', getFrame, onExit: () => navigate('/'),
      onError: () => getFrame()?.contentWindow?.postMessage({ type: 'mentication:screen-history-error', journeyId: 'goodMap' }, window.location.origin),
      screenIds: ['intro', 'sort', 'rate', 'map', 'type', 'sat', 'focus', 'help', 'way', 'up', 'step', 'ownStep', 'when', 'whenTime', 'set', 'home', 'chk', 'win', 'helpfulness', 'result', 'adjust', 'missed', 'contextLoss', 'contextRhythm', 'remap', 'clinician', 'sharePreview', 'compare', 'care', 'menu', 'paused', 'empty'],
      cursorNames: ['moment', 'satisfaction'],
    });
    const receive = event => {
      if (event.origin === window.location.origin && event.source === getFrame()?.contentWindow && event.data?.type === 'good-map:exit') navigate('/');
    };
    window.addEventListener('message', receive);
    return () => { cleanupHistory(); window.removeEventListener('message', receive); };
  }, [navigate]);
  return (
    <PlusGate route="good-map" name="The Good Map" background="#12030A"
      previewImage="/media/plus-preview/good-map.jpg"
      promise="See what actually makes life feel good."
      detail="Sort what matters, see it on your map, then close the biggest gap one small step at a time.">
      <StandaloneFrame id="goodMap" name="The Good Map" src="/good-map/index.html" background="#12030A" nav={{ back: false, home: false }} />
    </PlusGate>
  );
}
