import { useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasCompletedOnboarding } from '@/lib/onboarding';

export default function OnboardingGate({ children }) {
  const location = useLocation();
  const admittedProfileVisit = useRef(null);
  const completed = hasCompletedOnboarding();
  // Clearing onboarding is part of Profile erasure. Keep only this already
  // admitted visit visible so its verified result, partial-failure retry and
  // separate notification warning are not lost to an automatic redirect.
  // A new route, history entry or reload must still pass the ordinary gate.
  if (location.pathname !== '/profile') admittedProfileVisit.current = null;
  else if (completed) admittedProfileVisit.current = location.key;
  const retainResult = location.pathname === '/profile' && admittedProfileVisit.current === location.key;
  return completed || retainResult ? children : <Navigate to="/welcome" replace />;
}
