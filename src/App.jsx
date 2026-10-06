import { founderPreview } from "@/lib/subscription";
// @ts-check
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// A static, shareable build (VITE_HASH_ROUTER=1) is served from a sub-path
// with no server rewrites, so it routes with the URL hash instead.
const Router = import.meta.env.VITE_HASH_ROUTER === '1' ? HashRouter : BrowserRouter;
import { lazy, Suspense, useEffect } from 'react';
import { refreshPlus } from '@/lib/subscription';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import AppShell from '@/components/AppShell';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { useSystemDarkMode } from '@/hooks/useSystemDarkMode';
import { installFeedback } from '@/lib/feedback';
import { DirectionContext, useNavigationDirection } from '@/lib/navigationDirection';
import { hasCompletedOnboarding } from '@/lib/onboarding';

// Route page components are loaded on demand to keep the initial bundle small.
// The tab pages (Home, Onboarding, RegulationProfile, Settings) are lazy-loaded
// inside AppShell so they can be kept mounted across tab switches.
const NeedStart = lazy(() => import('@/pages/NeedStart'));
const ReturnPoints = lazy(() => import('@/pages/ReturnPoints'));
const ResetFlow = lazy(() => import('@/pages/ResetFlow'));
const ChangeSceneFollowup = lazy(() => import('@/pages/ChangeSceneFollowup'));
const LiftFollowup = lazy(() => import('@/pages/LiftFollowup'));
const Crisis = lazy(() => import('@/pages/Crisis'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Journal = lazy(() => import('@/pages/Journal'));
const Dear2100 = lazy(() => import('@/pages/Dear2100'));
const NightChannel = lazy(() => import('@/pages/NightChannel'));
const ParkingLot = lazy(() => import('@/pages/ParkingLot'));
const SignalLock = lazy(() => import('@/pages/SignalLock'));
const VectorShift = lazy(() => import('@/pages/VectorShift'));
const GoodMap = lazy(() => import('@/pages/GoodMap'));
const Foundations = lazy(() => import('@/pages/Foundations'));
const Restructure = lazy(() => import('@/pages/Restructure'));
const Plus = lazy(() => import('@/pages/Plus'));
const Palace = lazy(() => import('@/pages/Palace'));
const ProgrammeList = lazy(() => import('@/pages/Programmes').then((m) => ({ default: m.ProgrammeList })));
const ProgrammeDetail = lazy(() => import('@/pages/Programmes').then((m) => ({ default: m.ProgrammeDetail })));

const TAB_PATHS = ["/", "/library", "/plan", "/profile", "/insights", "/settings"];

const PageSpinner = () => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-sm">
    <div className="h-8 w-8 rounded-full border-4 border-secondary border-t-primary animate-spin" />
  </div>
);

const OnboardingGate = ({ children }) => (
  hasCompletedOnboarding() ? children : <Navigate to="/welcome" replace />
);

// Direction-aware page transitions: forward nav slides the new page in from the
// right; back/pop slides the outgoing page off to the right.
const pageVariants = {
  enter: (dir) => ({ x: dir >= 0 ? "20%" : "-10%", opacity: 0.5 }),
  center: { x: 0, opacity: 1 },
  // The outgoing page clears quickly (mode="wait" holds the new page until it
  // finishes), so navigation starts sooner — the enter still eases gently, so
  // the change reads smooth rather than abrupt.
  exit: (dir) => ({ x: dir >= 0 ? "-10%" : "20%", opacity: 0.4, transition: { duration: 0.06, ease: [0.22, 1, 0.36, 1] } }),
};

const MenticationRoutes = () => {
  const location = useLocation();
  const direction = useNavigationDirection(location.pathname);
  // Group the tab routes under one key so the AppShell (and its tab bar) stays
  // mounted while switching tabs; only leaving/entering the tab surface animates
  // the top-level group.
  const groupKey = TAB_PATHS.includes(location.pathname) ? "app" : location.pathname;

  return (
    <DirectionContext.Provider value={direction}>
      <AnimatePresence mode="sync" custom={direction} initial={false}>
        <motion.div
          key={groupKey}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-full"
        >
          <ErrorBoundary key={groupKey}>
            <Suspense fallback={<PageSpinner />}>
              <Routes location={location}>
                <Route element={<OnboardingGate><AppShell /></OnboardingGate>}>
                  <Route path="/" element={<></>} />
                  <Route path="/library" element={<></>} />
                  <Route path="/plan" element={<></>} />
                  <Route path="/profile" element={<></>} />
                  <Route path="/insights" element={<></>} />
                  <Route path="/settings" element={<></>} />
                </Route>
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/start" element={<NeedStart />} />
                <Route path="/return-points" element={<ReturnPoints />} />
                <Route path="/reset" element={<ResetFlow />} />
                <Route path="/scene-followup" element={<ChangeSceneFollowup />} />
                <Route path="/lift-followup" element={<LiftFollowup />} />
                <Route path="/tara-tactician" element={<Navigate to="/reset" replace state={{ prebuilt: true, pathway: ["taraTactician"], direction: "focus", intensity: null, timeMin: 5, audio: "no" }} />} />
                <Route path="/next-easiest-step" element={<Navigate to="/reset" replace state={{ prebuilt: true, pathway: ["nextAction"], direction: "focus", intensity: null, audio: "no" }} />} />
                <Route path="/next-easiest-step-v2" element={<Navigate to="/reset" replace state={{ prebuilt: true, pathway: ["nextAction"], direction: "focus", intensity: null, audio: "no" }} />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/dear-2100" element={<Dear2100 />} />
                <Route path="/night-channel" element={<NightChannel />} />
                <Route path="/parking-lot" element={<ParkingLot />} />
                <Route path="/support" element={<Crisis />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/plus" element={<Plus />} />
                <Route path="/palace" element={<OnboardingGate><Palace /></OnboardingGate>} />
                <Route path="/programmes" element={<ProgrammeList />} />
                <Route path="/programmes/:id" element={<ProgrammeDetail />} />
                <Route path="/signal-lock" element={<OnboardingGate><SignalLock /></OnboardingGate>} />
                <Route path="/vector-shift" element={<OnboardingGate><VectorShift /></OnboardingGate>} />
                <Route path="/good-map" element={<OnboardingGate><GoodMap /></OnboardingGate>} />
                <Route path="/foundations" element={<OnboardingGate><Foundations /></OnboardingGate>} />
                <Route path="/restructure" element={<OnboardingGate><Restructure /></OnboardingGate>} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </DirectionContext.Provider>
  );
};

function App() {
  const { prefs } = useAccessibilityPrefs();
  useSystemDarkMode();
  useEffect(() => installFeedback(), []);
  // Ask Apple once per launch whether Plus is active (kept on the device for offline use).
  useEffect(() => { void refreshPlus(); }, []);
  // Warm every lazy route's module while the app sits idle, so the first tap
  // on any destination resolves instantly instead of waiting on a chunk fetch
  // behind the route transition.
  useEffect(() => {
    const warm = () => {
      import("@/pages/ResetFlow");
      import("@/components/NextEasiestStepExperience");
      import("@/pages/Crisis");
      import("@/pages/Privacy");
      import("@/pages/Welcome");
      import("@/pages/Journal");
      import("@/pages/Dear2100");
      import("@/pages/NightChannel");
      import("@/pages/ParkingLot");
      import("@/pages/SignalLock");
      import("@/pages/VectorShift");
      import("@/pages/GoodMap");
      import("@/pages/Foundations");
      import("@/pages/Restructure");
      import("@/pages/Plus");
      import("@/pages/Palace");
      import("@/pages/Programmes");
      import("@/pages/InterventionLibrary");
      import("@/pages/RegulationProfile");
      import("@/pages/MyPlan");
      import("@/pages/EffectivenessDashboard");
      import("@/pages/Settings");
    };
    const idle = (cb) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 4000 }) : window.setTimeout(cb, 1200));
    idle(warm);
  }, []);
  return (
    <MotionConfig reducedMotion={prefs.reducedMotion ? "always" : "user"}>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <MenticationRoutes />
        </Router>
        {founderPreview && <div role="status" style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none", borderRadius: "0 0 8px 8px", padding: "2px 10px", background: "#0A1F3D", color: "#F6EFE2", fontSize: 10, whiteSpace: "nowrap" }}>Founder preview · testing access · no subscription</div>}
        <Toaster />
      </QueryClientProvider>
    </MotionConfig>
  )
}

export default App
