import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "@/components/TabBar";
import Home from "@/pages/Home";

// Each tab is mounted on first visit and kept alive so state survives tab
// switches without eagerly downloading every tab on app launch.
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

export default function AppShell() {
  const { pathname } = useLocation();
  const [visitedPaths, setVisitedPaths] = useState(() => new Set(["/", pathname]));

  useEffect(() => {
    setVisitedPaths((current) => {
      if (current.has(pathname)) return current;
      const next = new Set(current);
      next.add(pathname);
      return next;
    });
  }, [pathname]);

  const shouldMount = (path) => pathname === path || visitedPaths.has(path);

  return (
    <div className="relative min-h-full">
      <div style={pathname === "/" ? visible : hidden} className="min-h-full">
        <Home />
      </div>
      {shouldMount("/library") && (
        <div style={pathname === "/library" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <InterventionLibrary />
          </Suspense>
        </div>
      )}
      {shouldMount("/plan") && (
        <div style={pathname === "/plan" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <MyPlan />
          </Suspense>
        </div>
      )}
      {shouldMount("/profile") && (
        <div style={pathname === "/profile" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <RegulationProfile />
          </Suspense>
        </div>
      )}
      {shouldMount("/insights") && (
        <div style={pathname === "/insights" ? visible : hidden} className="min-h-full">
          <Suspense fallback={<PageSpinner />}>
            <EffectivenessDashboard />
          </Suspense>
        </div>
      )}
      {shouldMount("/settings") && (
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
