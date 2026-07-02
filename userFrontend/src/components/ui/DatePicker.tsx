import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Calendar } from './Calendar';
import { formatDate } from '@/utils/format';

export interface DatePickerProps {
  value?: string;
  onChange: (iso: string) => void;
  disabledDates?: string[];
  minDate?: Date;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  disabledDates,
  minDate,
  placeholder = 'Select date',
  label,
  error,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={cn('relative w-full', className)} ref={ref}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-sm transition-colors focus:outline-none focus:ring-4',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={cn(value ? 'text-slate-900' : 'text-slate-400')}>
          {value ? formatDate(value) : placeholder}
        </span>
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-30 mt-2 w-[300px] rounded-2xl border border-slate-200 bg-white p-4 shadow-elevated"
          >
            <Calendar
              value={value}
              onChange={(iso) => {
                onChange(iso);
                setOpen(false);
              }}
              disabledDates={disabledDates}
              minDate={minDate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
