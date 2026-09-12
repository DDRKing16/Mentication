import React, { Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import TabBar from "@/components/TabBar";
import Home from "@/pages/Home";

// Each tab is mounted once and kept alive (hidden via display:none) so state
// survives tab switches.
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

  return (
    <div className="relative min-h-full">
      <div style={pathname === "/" ? visible : hidden} className="min-h-full">
        <Home />
      </div>
      <div style={pathname === "/library" ? visible : hidden} className="min-h-full">
        <Suspense fallback={<PageSpinner />}>
          <InterventionLibrary />
        </Suspense>
      </div>
      <>
          <div style={pathname === "/plan" ? visible : hidden} className="min-h-full">
            <Suspense fallback={<PageSpinner />}>
              <MyPlan />
            </Suspense>
          </div>
          <div style={pathname === "/profile" ? visible : hidden} className="min-h-full">
            <Suspense fallback={<PageSpinner />}>
              <RegulationProfile />
            </Suspense>
          </div>
          <div style={pathname === "/insights" ? visible : hidden} className="min-h-full">
            <Suspense fallback={<PageSpinner />}>
              <EffectivenessDashboard />
            </Suspense>
          </div>
          <div style={pathname === "/settings" ? visible : hidden} className="min-h-full">
            <Suspense fallback={<PageSpinner />}>
              <Settings />
            </Suspense>
          </div>
      </>
      <TabBar />
    </div>
  );
}
