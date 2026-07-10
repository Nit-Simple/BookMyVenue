import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, Menu, LogOut, Building2 } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { NAV_ITEMS } from '@/constants/nav';
import { cn } from '@/utils/cn';

interface NavbarProps {
  venueName?: string;
  userEmail?: string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

function useBreadcrumb() {
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.to));
  return current?.label ?? 'Dashboard';
}

export function Navbar({ venueName, userEmail, onOpenMobileMenu, onLogout }: NavbarProps) {
  const crumb = useBreadcrumb();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Portal</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-slate-600">{crumb}</span>
          </nav>
          {/* Venue name */}
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="truncate text-sm font-bold text-slate-900">
              {venueName ?? 'Your Venue'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification placeholder */}
        <button
          aria-label="Notifications"
          title="Notifications (coming soon)"
          className="focus-ring relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="focus-ring flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100"
          >
            <Avatar name={userEmail ?? 'Venue Manager'} size={34} />
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {userEmail?.split('@')[0] ?? 'Manager'}
            </span>
          </button>

          {menuOpen && (
            <div
              className={cn(
                'absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-elevated',
                'animate-scale-in origin-top-right',
              )}
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Venue Manager</p>
                <p className="truncate text-xs text-slate-500">{userEmail ?? '—'}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4" />
                Venue profile
              </Link>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
