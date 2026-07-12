import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';

/**
 * Gates authenticated routes. Requires a session AND the `admin` role. The
 * backend enforces `admin` on `/admin/*` too — this is UX, not the security
 * boundary.
 */
export function ProtectedRoute() {
  const { isAuthenticated, user, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) return <PageLoader label="Restoring your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ error: 'not-an-admin' }} />;
  }

  return <Outlet />;
}
