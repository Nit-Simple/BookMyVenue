import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  UserCircle,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/approvals', label: 'Venue Approvals', icon: ClipboardCheck, permission: 'venues:view' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
  { to: '/profile', label: 'Profile', icon: UserCircle },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings:manage' },
];
