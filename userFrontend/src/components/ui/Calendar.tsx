import { useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CalendarProps {
  /** Selected date as ISO string (yyyy-MM-dd). */
  value?: string;
  onChange: (iso: string) => void;
  /** ISO dates that are disabled (e.g. already booked). */
  disabledDates?: string[];
  /** Earliest selectable day; defaults to today. */
  minDate?: Date;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function Calendar({
  value,
  onChange,
  disabledDates = [],
  minDate,
  className,
}: CalendarProps) {
  const selected = value ? parseISO(value) : undefined;
  const [cursor, setCursor] = useState<Date>(selected ?? new Date());
  const min = startOfDay(minDate ?? new Date());
  const disabledSet = new Set(disabledDates);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });

  return (
    <div className={cn('w-full select-none', className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(subMonths(cursor, 1))}
          className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-900">
          {format(cursor, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-slate-400">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const outside = !isSameMonth(day, cursor);
          const isDisabled = isBefore(day, min) || disabledSet.has(iso);
          const isSelected = selected && isSameDay(day, selected);
          return (
            <button
              type="button"
              key={iso}
              disabled={isDisabled}
              onClick={() => onChange(iso)}
              className={cn(
                'relative flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                outside && 'text-slate-300',
                !outside && !isDisabled && 'text-slate-700 hover:bg-brand-50',
                isDisabled && 'cursor-not-allowed text-slate-300 line-through',
                isSelected && 'bg-brand-700 font-semibold text-white hover:bg-brand-800',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
