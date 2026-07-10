import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { NAV_ITEMS } from '@/constants/nav';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/utils/cn';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ mobileOpen, onClose, onLogout }: SidebarProps) {
  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'focus-ring flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-100 p-3">
      <button
        onClick={onLogout}
        className="focus-ring flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo />
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-elevated animate-slide-down">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <Logo />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
