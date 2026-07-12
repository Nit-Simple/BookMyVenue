import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { NAV_LINKS } from '@/constants/nav';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-app grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-slate-500">
            BookMyVenue helps venue owners reach thousands of customers, manage bookings, and grow
            revenue — all from one dashboard.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-slate-900">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Get started</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link to="/register" className="hover:text-slate-900">
                List your venue
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-slate-900">
                Venue login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} BookMyVenue. All rights reserved.</p>
          <p>Made for venue partners across India.</p>
        </div>
      </div>
    </footer>
  );
}
