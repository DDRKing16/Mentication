import React, { Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "@/components/TabBar";
const Home = lazy(() => import("@/pages/Home"));

// Tab pages are lazy-loaded and only the active tab route is rendered so hidden
// tabs do not stay mounted in memory.
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

export default function AppShell() {
  const { pathname } = useLocation();
  const tabPage = pathname === "/"
    ? <Home />
    : pathname === "/library"
      ? <InterventionLibrary />
      : pathname === "/plan"
        ? <MyPlan />
        : pathname === "/profile"
          ? <RegulationProfile />
          : pathname === "/insights"
            ? <EffectivenessDashboard />
            : pathname === "/settings"
              ? <Settings />
              : null;

  return (
    <div className="relative min-h-full">
      <div className="min-h-full">
        <Suspense fallback={<PageSpinner />}>
          {tabPage}
        </Suspense>
      </div>
      <TabBar />
    </div>
  );
}
