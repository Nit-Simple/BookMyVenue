import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Logo } from './Logo';
import { ProfileMenu } from './ProfileMenu';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore } from '@/app/store/uiStore';
import { cn } from '@/utils/cn';

const navLinks = [
  { to: '/venues', label: 'Explore Venues' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/support', label: 'Support' },
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setMobileMenu = useUiStore((s) => s.setMobileMenu);
  const [query, setQuery] = useState('');

  const isHome = location.pathname === '/';

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/venues?query=${encodeURIComponent(q)}` : '/venues');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md',
      )}
    >
      <div className="container-app flex h-16 items-center gap-4">
        <button
          onClick={() => setMobileMenu(true)}
          className="focus-ring -ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Logo className="shrink-0" />

        {/* Compact search — hidden on the home hero which has its own */}
        {!isHome && (
          <form
            onSubmit={submitSearch}
            className="hidden flex-1 items-center md:flex md:max-w-md"
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search venues or cities…"
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </form>
        )}

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname.startsWith(link.to)
                  ? 'text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={cn('flex items-center gap-2', !isHome ? 'ml-2' : 'ml-auto')}>
          <Link
            to="/venues"
            className="focus-ring rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Search venues"
          >
            <Search className="h-5 w-5" />
          </Link>
          {isAuthenticated && user ? (
            <ProfileMenu user={user} />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden sm:inline-flex">
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
