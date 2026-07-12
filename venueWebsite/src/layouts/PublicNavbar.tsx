import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui';
import { NAV_LINKS } from '@/constants/nav';
import { cn } from '@/utils/cn';

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  const links = NAV_LINKS.map((l) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={l.to === '/'}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        cn(
          'text-sm font-medium transition-colors',
          isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900',
        )
      }
    >
      {l.label}
    </NavLink>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">{links}</nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login">
            <Button variant="ghost">Venue Login</Button>
          </Link>
          <Link to="/register">
            <Button>List your venue</Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="focus-ring rounded-lg p-2 text-slate-600 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="container-app flex flex-col gap-4 py-4">
            {links}
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" fullWidth>
                  Venue Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button fullWidth>List your venue</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
