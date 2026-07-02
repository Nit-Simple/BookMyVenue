import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarCheck, Compass, Heart, Home, LifeBuoy, LogIn, User as UserIcon } from 'lucide-react';
import { Drawer } from '@/components/ui';
import { Logo } from './Logo';
import { useUiStore } from '@/app/store/uiStore';
import { useAuthStore } from '@/app/store/authStore';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/utils/cn';

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/venues', label: 'Explore', icon: Compass },
  { to: '/my-bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

/** Persistent bottom tab bar for mobile. */
export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden">
      <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-700' : 'text-slate-400',
              )
            }
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const drawerLinks = [
  { to: '/venues', label: 'Explore Venues', icon: Compass },
  { to: '/my-bookings', label: 'My Bookings', icon: CalendarCheck },
  { to: '/profile/saved', label: 'Saved Venues', icon: Heart },
  { to: '/profile', label: 'My Profile', icon: UserIcon },
  { to: '/support', label: 'Help & Support', icon: LifeBuoy },
];

/** Slide-in menu opened from the header hamburger. */
export function MobileMenuDrawer() {
  const open = useUiStore((s) => s.mobileMenuOpen);
  const setOpen = useUiStore((s) => s.setMobileMenu);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const close = () => setOpen(false);

  return (
    <Drawer open={open} onClose={close} title="Menu" side="left">
      <div className="flex flex-col gap-1">
        {isAuthenticated && user ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <img src={user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="mb-3 rounded-xl bg-brand-50 p-4">
            <Logo />
            <p className="mt-2 text-sm text-slate-600">Sign in to book venues and save favourites.</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  close();
                  navigate('/login');
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white"
              >
                <LogIn className="h-4 w-4" /> Log in
              </button>
              <button
                onClick={() => {
                  close();
                  navigate('/register');
                }}
                className="flex-1 rounded-lg border border-brand-200 bg-white py-2 text-sm font-semibold text-brand-700"
              >
                Sign up
              </button>
            </div>
          </div>
        )}

        {drawerLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={close}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <link.icon className="h-5 w-5 text-slate-400" />
            {link.label}
          </Link>
        ))}

        {isAuthenticated && (
          <button
            onClick={() => {
              close();
              logout();
            }}
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogIn className="h-5 w-5 rotate-180" />
            Sign out
          </button>
        )}
      </div>
    </Drawer>
  );
}
