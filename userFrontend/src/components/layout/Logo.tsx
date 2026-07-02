import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)} aria-label="BookMyVenue home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 20V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v12l-7-4-7 4Z" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
          Book<span className="text-brand-700">MyVenue</span>
        </span>
      )}
    </Link>
  );
}
