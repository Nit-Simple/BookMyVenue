import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { Logo } from './Logo';
import { CATEGORIES, CITIES } from '@/utils/constants';

const columns = [
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/support' },
      { label: 'How it works', to: '/faq' },
      { label: 'Careers', to: '/support' },
      { label: 'Contact', to: '/support' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/support' },
      { label: 'FAQs', to: '/faq' },
      { label: 'Cancellation Policy', to: '/faq' },
      { label: 'My Bookings', to: '/my-bookings' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-app py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Discover and book premium venues for weddings, conferences, parties and
              corporate events — all in one place.
            </p>
            <div className="mt-4 flex gap-2">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-brand-100 hover:text-brand-700"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Categories</h4>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/venues?category=${c.id}`}
                    className="text-sm text-slate-500 hover:text-brand-700"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Top Cities</h4>
            <ul className="mt-3 space-y-2">
              {CITIES.slice(0, 5).map((city) => (
                <li key={city}>
                  <Link
                    to={`/venues?city=${encodeURIComponent(city)}`}
                    className="text-sm text-slate-500 hover:text-brand-700"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BookMyVenue. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="mailto:hello@bookmyvenue.app" className="flex items-center gap-1.5 hover:text-brand-700">
              <Mail className="h-4 w-4" /> hello@bookmyvenue.app
            </a>
            <a href="tel:+911800123456" className="flex items-center gap-1.5 hover:text-brand-700">
              <Phone className="h-4 w-4" /> 1800-123-456
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
