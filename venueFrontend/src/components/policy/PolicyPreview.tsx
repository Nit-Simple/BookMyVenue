import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CancellationRule } from '@/types';

/** Human-readable preview, sorted from earliest cancellation to latest. */
export function PolicyPreview({ rules }: { rules: CancellationRule[] }) {
  const sorted = [...rules].sort((a, b) => b.hours_before - a.hours_before);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">Add rules to see a preview.</p>;
  }

  return (
    <ul className="space-y-2">
      {sorted.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2 text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            {r.hours_before === 0
              ? 'Less than the earliest window / no notice'
              : `${r.hours_before}h or more before`}
          </span>
          <span
            className={cn(
              'font-semibold',
              r.refund_percentage >= 100
                ? 'text-emerald-600'
                : r.refund_percentage === 0
                  ? 'text-red-600'
                  : 'text-amber-600',
            )}
          >
            {r.refund_percentage}% refund
          </span>
        </li>
      ))}
    </ul>
  );
}
