import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done
                    ? 'bg-brand-700 text-white'
                    : active
                      ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                      : 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-center text-xs font-medium sm:block',
                  active ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn('mx-2 h-0.5 flex-1 rounded', done ? 'bg-brand-600' : 'bg-slate-200')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
