// @ts-check
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import AppShell from '@/components/AppShell';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { useSystemDarkMode } from '@/hooks/useSystemDarkMode';
import { installFeedback } from '@/lib/feedback';
import { DirectionContext, useNavigationDirection } from '@/lib/navigationDirection';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import WithBrandThreshold from '@/components/brand/WithBrandThreshold';

// Route page components are loaded on demand to keep the initial bundle small.
// The tab pages (Home, Onboarding, RegulationProfile, Settings) are lazy-loaded
// inside AppShell so they can be kept mounted across tab switches.
const ResetFlow = lazy(() => import('@/pages/ResetFlow'));
const NextEasiestStepExperience = lazy(() => import('@/components/NextEasiestStepExperience'));
const Crisis = lazy(() => import('@/pages/Crisis'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Journal = lazy(() => import('@/pages/Journal'));
const Dear2100 = lazy(() => import('@/pages/Dear2100'));
const NightChannel = lazy(() => import('@/pages/NightChannel'));
const ParkingLot = lazy(() => import('@/pages/ParkingLot'));
const SignalLock = lazy(() => import('@/pages/SignalLock'));
const VectorShift = lazy(() => import('@/pages/VectorShift'));

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
  exit: (dir) => ({ x: dir >= 0 ? "-10%" : "20%", opacity: 0.4 }),
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
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={groupKey}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-full"
        >
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
              <Route path="/reset" element={<ResetFlow />} />
              <Route path="/next-easiest-step" element={<WithBrandThreshold id="nextAction" name="Next Easiest Step"><NextEasiestStepExperience onComplete={() => window.location.href = '/'} onExit={() => window.location.href = '/'} /></WithBrandThreshold>} />
              <Route path="/next-easiest-step-v2" element={<WithBrandThreshold id="nextAction" name="Next Easiest Step"><NextEasiestStepExperience onComplete={() => window.location.href = '/'} onExit={() => window.location.href = '/'} /></WithBrandThreshold>} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/dear-2100" element={<Dear2100 />} />
              <Route path="/night-channel" element={<NightChannel />} />
              <Route path="/parking-lot" element={<ParkingLot />} />
              <Route path="/support" element={<Crisis />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/signal-lock" element={<OnboardingGate><SignalLock /></OnboardingGate>} />
              <Route path="/vector-shift" element={<OnboardingGate><VectorShift /></OnboardingGate>} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </DirectionContext.Provider>
  );
};

function App() {
  const { prefs } = useAccessibilityPrefs();
  useSystemDarkMode();
  useEffect(() => installFeedback(), []);
  return (
    <MotionConfig reducedMotion={prefs.reducedMotion ? "always" : "user"}>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <MenticationRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </MotionConfig>
  )
}

export default App
