import { Star } from 'lucide-react';
import { Checkbox, Input } from '@/components/ui';
import { CATEGORIES, CITIES } from '@/utils/constants';
import { formatCurrencyCompact } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { EventCategory, VenueFilters } from '@/types';

interface FiltersPanelProps {
  filters: VenueFilters;
  onChange: (patch: Partial<VenueFilters>) => void;
  onReset: () => void;
}

const PRICE_PRESETS = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Under ₹50K', min: undefined, max: 50000 },
  { label: '₹50K–₹1L', min: 50000, max: 100000 },
  { label: '₹1L–₹2L', min: 100000, max: 200000 },
  { label: '₹2L+', min: 200000, max: undefined },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-5 first:pt-0 last:border-0">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

export function FiltersPanel({ filters, onChange, onReset }: FiltersPanelProps) {
  const activePriceIdx = PRICE_PRESETS.findIndex(
    (p) => p.min === filters.priceMin && p.max === filters.priceMax,
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Filters</h2>
        <button onClick={onReset} className="text-sm font-medium text-brand-700 hover:underline">
          Clear all
        </button>
      </div>

      <Section title="City">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange({ city: undefined })}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              !filters.city
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            All cities
          </button>
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => onChange({ city: filters.city === city ? undefined : city })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                filters.city === city
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Event category">
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <Checkbox
              key={cat.id}
              checked={filters.category === cat.id}
              onChange={(checked) =>
                onChange({ category: checked ? (cat.id as EventCategory) : undefined })
              }
              label={cat.label}
            />
          ))}
        </div>
      </Section>

      <Section title="Guest capacity">
        <Input
          type="number"
          min={1}
          placeholder="Minimum guests"
          value={filters.capacity ?? ''}
          onChange={(e) =>
            onChange({ capacity: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </Section>

      <Section title="Price range">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => onChange({ priceMin: preset.min, priceMax: preset.max })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                activePriceIdx === i
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {(filters.priceMin != null || filters.priceMax != null) && (
          <p className="mt-2 text-xs text-slate-500">
            {filters.priceMin ? formatCurrencyCompact(filters.priceMin) : '₹0'} —{' '}
            {filters.priceMax ? formatCurrencyCompact(filters.priceMax) : 'Any'}
          </p>
        )}
      </Section>

      <Section title="Minimum rating">
        <div className="flex flex-wrap gap-2">
          {[4.5, 4, 3.5, 0].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ minRating: r || undefined })}
              className={cn(
                'flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors',
                (filters.minRating ?? 0) === r
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              )}
            >
              {r === 0 ? (
                'Any'
              ) : (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Offers">
        <Checkbox
          checked={!!filters.offersOnly}
          onChange={(checked) => onChange({ offersOnly: checked || undefined })}
          label="Only show venues with offers"
        />
      </Section>
    </div>
  );
}
