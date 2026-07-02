import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore } from '@/app/store/uiStore';
import { PageLoader } from '@/components/ui';

/** Guards routes that require authentication, preserving the intended path. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setAuthRedirect = useUiStore((s) => s.setAuthRedirect);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      setAuthRedirect(location.pathname + location.search);
    }
  }, [hydrated, isAuthenticated, location, setAuthRedirect]);

  // Wait for persisted auth to rehydrate before deciding.
  if (!hydrated) return <PageLoader label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
