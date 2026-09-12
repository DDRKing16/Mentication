import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "@/components/TabBar";
const Home = lazy(() => import("@/pages/Home"));

// Only the core tabs stay mounted after first visit so users keep in-tab state
// where it matters without retaining every heavier secondary screen forever.
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

const TAB_COMPONENTS = {
  "/": Home,
  "/library": InterventionLibrary,
  "/plan": MyPlan,
  "/profile": RegulationProfile,
  "/insights": EffectivenessDashboard,
  "/settings": Settings,
};
const PERSISTED_TAB_PATHS = new Set(["/", "/library", "/plan", "/profile", "/insights", "/settings"]);

const hidden = { display: "none" };
const visible = { display: "block" };

export default function AppShell() {
  const { pathname } = useLocation();
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(TAB_COMPONENTS[pathname] && PERSISTED_TAB_PATHS.has(pathname) ? [pathname] : []));

  useEffect(() => {
    if (!TAB_COMPONENTS[pathname] || !PERSISTED_TAB_PATHS.has(pathname)) return;
    setVisitedTabs((current) => {
      if (current.has(pathname)) return current;
      return new Set([...current, pathname]);
    });
  }, [pathname]);

  const renderedTabs = [...visitedTabs];

  return (
    <div className="relative min-h-full">
      {renderedTabs.map((tabPath) => {
        const Component = TAB_COMPONENTS[tabPath];
        if (!Component) return null;
        return (
          <div key={tabPath} style={pathname === tabPath ? visible : hidden} className="min-h-full">
            <Suspense fallback={<PageSpinner />}>
              <Component />
            </Suspense>
          </div>
        );
      })}
      <TabBar />
    </div>
  );
}
