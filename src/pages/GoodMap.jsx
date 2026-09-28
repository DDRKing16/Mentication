import React from "react";
import StandaloneFrame from "@/components/brand/StandaloneFrame";
import PlusGate from "@/components/plus/PlusGate";

// The Good Map is a finished, self-contained build (public/good-map).
export default function GoodMap() {
  return (
    <PlusGate route="good-map" name="The Good Map" background="#12030A"
      promise="See what actually makes life feel good."
      detail="Sort what matters, see it on your map, then close the biggest gap one small step at a time.">
      <StandaloneFrame id="goodMap" name="The Good Map" src="/good-map/index.html" background="#12030A" />
    </PlusGate>
  );
}
