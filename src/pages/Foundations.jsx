// Foundations — the approved Midnight Mineral weekly-plan intervention.
// It is a finished, self-contained document (public/interventions/foundations,
// copied unchanged from the supplied package) shown in an isolated frame, so
// its own styles and scripts never touch the app. It saves one plan on this
// device only (localStorage); nothing is sent anywhere.
import React from "react";
import StandaloneFrame from "@/components/brand/StandaloneFrame";

export default function Foundations() {
  return (
    <StandaloneFrame
      id="foundations"
      name="Foundations"
      src="/interventions/foundations/index.html"
      background="#020712"
    />
  );
}
