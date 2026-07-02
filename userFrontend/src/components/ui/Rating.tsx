import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}

/** Read-only star rating display with optional review count. */
export function Rating({ value, count, size = 'sm', showValue = true, className }: RatingProps) {
  const px = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Star className={cn(px, 'fill-amber-400 text-amber-400')} />
      {showValue && <span className="text-sm font-semibold text-slate-800">{value.toFixed(1)}</span>}
      {count != null && <span className="text-sm text-slate-500">({count})</span>}
    </div>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Interactive star picker for writing reviews. */
export function StarInput({ value, onChange, size = 32 }: StarInputProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="inline-flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          className="focus-ring rounded transition-transform hover:scale-110"
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              'transition-colors',
              n <= active ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200',
            )}
          />
        </button>
      ))}
    </div>
  );
}
