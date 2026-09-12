import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import AppShell from '@/components/AppShell';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { useSystemDarkMode } from '@/hooks/useSystemDarkMode';
import { AccessibilityProvider } from '@/lib/accessibility';
import { installFeedback } from '@/lib/feedback';
import { DirectionContext, useNavigationDirection } from '@/lib/navigationDirection';

// Route page components are loaded on demand to keep the initial bundle small.
// The tab pages (Home, Onboarding, RegulationProfile, Settings) are lazy-loaded
// inside AppShell so they can be kept mounted across tab switches.
const ResetFlow = lazy(() => import('@/pages/ResetFlow'));
const Crisis = lazy(() => import('@/pages/Crisis'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));

const TAB_PATHS = ["/", "/library", "/plan", "/profile", "/insights", "/settings"];

const PageSpinner = () => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-sm">
    <div className="h-8 w-8 rounded-full border-4 border-secondary border-t-primary animate-spin" />
  </div>
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
              <Route element={<AppShell />}>
                <Route path="/" element={<></>} />
                <Route path="/library" element={<></>} />
                <Route path="/plan" element={<></>} />
                <Route path="/profile" element={<></>} />
                <Route path="/insights" element={<></>} />
                <Route path="/settings" element={<></>} />
              </Route>
              <Route path="/reset" element={<ResetFlow />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/support" element={<Crisis />} />
              <Route path="/privacy" element={<Privacy />} />
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
        <AccessibilityProvider>
          <AppErrorBoundary>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <MenticationRoutes />
            </Router>
          </AppErrorBoundary>
        </AccessibilityProvider>
        <Toaster />
      </QueryClientProvider>
    </MotionConfig>
  )
}

export default App
