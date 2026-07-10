import { useState } from 'react';
import toast from 'react-hot-toast';
import { IndianRupee, Info } from 'lucide-react';
import { Card, Button, Input, Select, Checkbox } from '@/components/ui';
import { useSetBasePrice } from '@/hooks/useProfile';
import { selectBasePrice } from '@/api/pricing';
import { getErrorMessage } from '@/api/axios';
import { formatCurrency } from '@/utils/format';
import { CURRENCIES } from '@/constants';
import type { VenuePricing } from '@/types';

interface BasePriceCardProps {
  venueId: string;
  pricing: VenuePricing[] | undefined;
}

/**
 * MVP: a single base price per hour. No plans / day-wise / seasonal / discounts.
 * Persisted via POST /manager/venues/:id/pricing (creates a PRICING_UPDATE
 * application on the backend). Designed so a Plans module can be layered on later.
 */
export function BasePriceCard({ venueId, pricing }: BasePriceCardProps) {
  const base = selectBasePrice(pricing);
  const [price, setPrice] = useState<string>(base ? String(base.price_per_hour) : '');
  const [currency, setCurrency] = useState<string>(base?.currency ?? 'INR');
  // TODO(backend): "tax inclusive" has no backend field — kept as local UI only.
  const [taxInclusive, setTaxInclusive] = useState(false);

  const mutation = useSetBasePrice(venueId);

  const save = async () => {
    const value = Number(price);
    if (!value || value <= 0) {
      toast.error('Enter a valid price per hour.');
      return;
    }
    try {
      await mutation.mutateAsync({ price: value, currency });
      toast.success('Base price updated. A pricing update was submitted for review.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update price.'));
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Base price</h3>
        {base && (
          <span className="text-sm font-bold text-brand-700">
            {formatCurrency(base.price_per_hour, base.currency)}/hr
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            label="Price per hour"
            type="number"
            min={0}
            step="50"
            leftIcon={<IndianRupee className="h-4 w-4" />}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 4500"
          />
        </div>
        <Select
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Checkbox checked={taxInclusive} onChange={setTaxInclusive} label="Tax inclusive" />
        <Button onClick={save} isLoading={mutation.isPending}>
          Save price
        </Button>
      </div>

      <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Every booking uses this single base price. Multiple plans, day-wise and seasonal
        pricing are planned for a future release.
      </p>
    </Card>
  );
}
