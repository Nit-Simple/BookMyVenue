import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useMyVenue } from '@/hooks/useVenue';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { venue, listItem } = useMyVenue();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login', { replace: true });
  };

  const venueName = venue?.venue_name ?? listItem?.venue_name;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          venueName={venueName}
          userEmail={user?.email}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
