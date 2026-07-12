import { Building2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
        <Building2 className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-extrabold text-slate-900">BookMyVenue</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            for Partners
          </span>
        </span>
      )}
    </div>
  );
}
