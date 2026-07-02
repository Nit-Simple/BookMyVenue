import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PageLoader } from '@/components/ui';

// Route-level code splitting keeps the initial bundle small.
const HomePage = lazy(() => import('@/features/home/HomePage').then((m) => ({ default: m.HomePage })));
const VenuesPage = lazy(() => import('@/features/venues/VenuesPage').then((m) => ({ default: m.VenuesPage })));
const VenueDetailsPage = lazy(() =>
  import('@/features/venues/VenueDetailsPage').then((m) => ({ default: m.VenueDetailsPage })),
);
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const BookingPage = lazy(() => import('@/features/booking/BookingPage').then((m) => ({ default: m.BookingPage })));
const MyBookingsPage = lazy(() =>
  import('@/features/booking/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage })),
);
const OrderDetailsPage = lazy(() =>
  import('@/features/booking/OrderDetailsPage').then((m) => ({ default: m.OrderDetailsPage })),
);
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SupportPage = lazy(() => import('@/features/support/SupportPage').then((m) => ({ default: m.SupportPage })));
const FaqPage = lazy(() => import('@/features/support/FaqPage').then((m) => ({ default: m.FaqPage })));
const NotFoundPage = lazy(() => import('@/features/misc/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Auth routes live outside the main layout (full-screen split view). */}
      <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
      <Route path="/register" element={<Lazy><RegisterPage /></Lazy>} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Lazy><HomePage /></Lazy>} />
        <Route path="/venues" element={<Lazy><VenuesPage /></Lazy>} />
        <Route path="/venues/:id" element={<Lazy><VenueDetailsPage /></Lazy>} />
        <Route path="/faq" element={<Lazy><FaqPage /></Lazy>} />
        <Route path="/support" element={<Lazy><SupportPage /></Lazy>} />

        {/* Authenticated routes */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Lazy><BookingPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute>
              <Lazy><OrderDetailsPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <Lazy><MyBookingsPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Lazy><ProfilePage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/saved"
          element={
            <ProtectedRoute>
              <Lazy><ProfilePage /></Lazy>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
      </Route>
    </Routes>
  );
}
