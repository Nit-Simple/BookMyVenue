export interface NavLinkItem {
  to: string;
  label: string;
}

export const NAV_LINKS: NavLinkItem[] = [
  { to: '/', label: 'Home' },
  { to: '/why-join', label: 'Why Join' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/** The venue-manager portal (separate app) users land in after logging in. */
export const VENUE_PORTAL_URL = 'http://localhost:5174';
