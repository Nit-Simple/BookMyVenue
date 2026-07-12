import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, Menu, LogOut, UserCircle } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import { NAV_ITEMS } from '@/constants/nav';
import { usePermissions } from '@/hooks/usePermissions';

interface NavbarProps {
  userEmail?: string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OPERATIONS_ADMIN: 'Operations Admin',
  SUPPORT_ADMIN: 'Support Admin',
  READ_ONLY: 'Read Only',
};

export function Navbar({ userEmail, onOpenMobileMenu, onLogout }: NavbarProps) {
  const { pathname } = useLocation();
  const crumb = NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label ?? 'Dashboard';
  const { adminRole } = usePermissions();
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
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <span>Admin</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-slate-800">{crumb}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          title="Notifications (coming soon)"
          className="focus-ring relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="focus-ring flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100"
          >
            <Avatar name={userEmail ?? 'Admin'} size={34} />
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {userEmail?.split('@')[0] ?? 'Admin'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-slate-100 bg-white shadow-elevated">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Administrator</p>
                  <Badge variant="brand">{ROLE_LABEL[adminRole]}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{userEmail ?? '—'}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserCircle className="h-4 w-4" />
                Profile
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
