import React, { Suspense, lazy, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "@/components/TabBar";
import Home from "@/pages/Home";

// Each tab loads on first visit, then stays mounted (hidden via display:none)
// so subsequent switches preserve its state without front-loading every chunk.
const InterventionLibrary = lazy(() => import("@/pages/InterventionLibrary"));
const RegulationProfile = lazy(() => import("@/pages/RegulationProfile"));
const MyPlan = lazy(() => import("@/pages/MyPlan"));
const EffectivenessDashboard = lazy(() => import("@/pages/EffectivenessDashboard"));
const Settings = lazy(() => import("@/pages/Settings"));

const PageSpinner = () => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-sm">
    <div className="h-3 w-3 rounded-full bg-primary/70 animate-breathe" />
  </div>
);

const hidden = { display: "none" };
const visible = { display: "block" };
const TAB_PATHS = ["/library", "/plan", "/profile", "/insights", "/settings"];

export default function AppShell() {
  const { pathname } = useLocation();
  const [mountedTabs, setMountedTabs] = useState(() => new Set([pathname]));

  useLayoutEffect(() => {
    if (!TAB_PATHS.includes(pathname) || mountedTabs.has(pathname)) return;
    setMountedTabs((previous) => new Set(previous).add(pathname));
  }, [mountedTabs, pathname]);

  return (
    <div className="relative min-h-full">
      <div style={pathname === "/" ? visible : hidden} className="min-h-full">
        <Home />
      </div>
      {mountedTabs.has("/library") && (
        <div style={pathname === "/library" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <InterventionLibrary />
          </Suspense>
        </div>
      )}
      {mountedTabs.has("/plan") && (
        <div style={pathname === "/plan" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <MyPlan />
          </Suspense>
        </div>
      )}
      {mountedTabs.has("/profile") && (
        <div style={pathname === "/profile" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <RegulationProfile />
          </Suspense>
        </div>
      )}
      {mountedTabs.has("/insights") && (
        <div style={pathname === "/insights" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <EffectivenessDashboard />
          </Suspense>
        </div>
      )}
      {mountedTabs.has("/settings") && (
        <div style={pathname === "/settings" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <Settings />
          </Suspense>
        </div>
      )}
      <TabBar />
    </div>
  );
}
