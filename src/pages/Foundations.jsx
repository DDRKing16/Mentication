// Foundations — the approved Midnight Mineral weekly-plan intervention.
// It is a self-contained document in public/interventions/foundations,
// shown in an isolated frame, so its own styles and scripts never touch the
// app. Draft answers, plans and reviews stay on this device only.
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StandaloneFrame from "@/components/brand/StandaloneFrame";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";

export default function Foundations() {
  const navigate = useNavigate();
  const { prefs } = useAccessibilityPrefs();
  useEffect(() => {
    const frame = () => document.querySelector('iframe[title="Foundations"]');
    const sendPreferences = () => frame()?.contentWindow?.postMessage({ type: 'foundations:preferences', prefs }, window.location.origin);
    const handleMessage = event => {
      if (event.origin !== window.location.origin || event.source !== frame()?.contentWindow) return;
      if (event.data?.type === 'foundations:ready') sendPreferences();
      if (event.data?.type === 'foundations:exit') navigate('/restructure');
    };
    window.addEventListener('message', handleMessage);
    sendPreferences();
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, prefs]);
  return (
    <StandaloneFrame
      id="foundations"
      name="Foundations"
      src="/interventions/foundations/index.html"
      background="#020712"
      nav={{ back: false, home: false }}
    />
  );
}
