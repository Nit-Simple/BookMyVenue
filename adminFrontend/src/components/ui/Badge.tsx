import { cn } from '@/utils/cn';

type BadgeVariant =
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info';

const variants: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  accent: 'bg-accent-50 text-accent-700 ring-accent-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({ variant = 'neutral', children, className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
