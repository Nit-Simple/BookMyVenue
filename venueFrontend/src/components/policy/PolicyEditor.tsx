import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { makeRule } from './policyUtils';
import { cn } from '@/utils/cn';
import type { CancellationRule } from '@/types';

interface PolicyEditorProps {
  rules: CancellationRule[];
  onChange: (rules: CancellationRule[]) => void;
  errors: Record<string, string>;
}

export function PolicyEditor({ rules, onChange, errors }: PolicyEditorProps) {
  const update = (id: string, patch: Partial<CancellationRule>) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rules];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <div
          key={rule.id}
          className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-nowrap sm:items-center"
        >
          <div className="hidden text-slate-300 sm:block">
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex flex-1 flex-col">
            <label className="mb-1 text-xs font-medium text-slate-500">Hours before event</label>
            <input
              type="number"
              min={0}
              value={rule.hours_before}
              onChange={(e) => update(rule.id, { hours_before: Number(e.target.value) })}
              className={cn(
                'h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-4',
                errors[`${rule.id}.hours`]
                  ? 'border-red-400 focus:ring-red-100'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
              )}
            />
            {errors[`${rule.id}.hours`] && (
              <span className="mt-1 text-xs text-red-600">{errors[`${rule.id}.hours`]}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col">
            <label className="mb-1 text-xs font-medium text-slate-500">Refund %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={rule.refund_percentage}
              onChange={(e) => update(rule.id, { refund_percentage: Number(e.target.value) })}
              className={cn(
                'h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-4',
                errors[`${rule.id}.refund`]
                  ? 'border-red-400 focus:ring-red-100'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
              )}
            />
            {errors[`${rule.id}.refund`] && (
              <span className="mt-1 text-xs text-red-600">{errors[`${rule.id}.refund`]}</span>
            )}
          </div>

          <div className="flex items-center gap-1 self-center pt-4 sm:pt-0">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === rules.length - 1}
              aria-label="Move down"
              className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => remove(rule.id)}
              aria-label="Delete rule"
              className="focus-ring rounded-lg p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={() => onChange([...rules, makeRule()])}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Add rule
      </Button>
    </div>
  );
}
