import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';

/**
 * Gates authenticated routes. Requires a session AND the `venue_manager` role
 * (the portal is manager-only; the backend enforces this on `/manager/*` too).
 */
export function ProtectedRoute() {
  const { isAuthenticated, user, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) return <PageLoader label="Restoring your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && user.role !== 'venue_manager') {
    return <Navigate to="/login" replace state={{ error: 'not-a-manager' }} />;
  }

  return <Outlet />;
}
