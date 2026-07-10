import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

// --- Avatar ----------------------------------------------------------------
export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}

// --- Card ------------------------------------------------------------------
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-100 bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// --- Stepper (counter) -----------------------------------------------------
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className="flex h-11 items-center justify-between rounded-xl border border-slate-300 px-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label="Decrease"
          className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          className="w-16 [appearance:textfield] border-0 text-center text-sm font-semibold text-slate-900 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label="Increase"
          className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// --- Tabs -------------------------------------------------------------------
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'focus-ring rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active === t.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {t.label}
          {t.count != null && (
            <span
              className={cn(
                'ml-1.5 rounded-full px-1.5 py-0.5 text-xs',
                active === t.value ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500',
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// --- Checkbox ---------------------------------------------------------------
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      {label}
    </label>
  );
}
