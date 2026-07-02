import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarCheck,
  ChevronDown,
  Heart,
  LifeBuoy,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import type { User } from '@/types';

const items = [
  { to: '/profile', label: 'My Profile', icon: UserIcon },
  { to: '/my-bookings', label: 'My Bookings', icon: CalendarCheck },
  { to: '/profile/saved', label: 'Saved Venues', icon: Heart },
  { to: '/support', label: 'Help & Support', icon: LifeBuoy },
];

export function ProfileMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition-colors hover:shadow-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={user.avatarUrl} name={user.name} size={32} />
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-elevated"
          >
            <div className="border-b border-slate-100 px-4 pb-3 pt-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="py-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
