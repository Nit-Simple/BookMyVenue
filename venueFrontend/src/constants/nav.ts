import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Receipt,
  RotateCcw,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: Building2 },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/refunds', label: 'Refunds', icon: RotateCcw },
  { to: '/cancellation-policy', label: 'Cancellation Policy', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
];
