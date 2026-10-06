import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StandaloneFrame from "@/components/brand/StandaloneFrame";
import PlusGate from "@/components/plus/PlusGate";

// The Good Map is a finished, self-contained build (public/good-map).
export default function GoodMap() {
  const navigate = useNavigate();
  useEffect(() => {
    const receive = event => {
      const frame = document.querySelector('iframe[title="The Good Map"]');
      if (event.origin === window.location.origin && event.source === frame?.contentWindow && event.data?.type === "good-map:exit") navigate("/");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
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
