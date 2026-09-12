import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "@/components/TabBar";
const Home = lazy(() => import("@/pages/Home"));

// Tab pages are lazy-loaded on first visit, then kept mounted after that so
// users keep in-tab state without paying the eager upfront cost for every tab.
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
const PERSISTED_TAB_PATHS = new Set(["/", "/library", "/plan"]);

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

  const activePath = TAB_COMPONENTS[pathname] ? pathname : "/";
  const renderedTabs = Array.from(new Set([...visitedTabs, activePath]));

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
