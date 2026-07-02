import { Info } from 'lucide-react';
import type { PriceBreakdown } from '@/types';
import { formatCurrency } from '@/utils/format';

function Row({
  label,
  value,
  muted,
  negative,
}: {
  label: string;
  value: string;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? 'text-slate-500' : 'text-slate-600'}>{label}</span>
      <span className={negative ? 'font-medium text-emerald-600' : 'font-medium text-slate-900'}>
        {negative ? `– ${value}` : value}
      </span>
    </div>
  );
}

export function PriceSummary({
  pricing,
  showAdvance = true,
}: {
  pricing: PriceBreakdown;
  showAdvance?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <Row label="Venue / package price" value={formatCurrency(pricing.venuePrice)} />
      {pricing.guestCharge > 0 && (
        <Row label="Per-guest charges" value={formatCurrency(pricing.guestCharge)} />
      )}
      {pricing.discount > 0 && (
        <Row label="Offer discount" value={formatCurrency(pricing.discount)} negative />
      )}
      <Row label="Service charge (5%)" value={formatCurrency(pricing.serviceCharge)} muted />
      <Row label="GST (18%)" value={formatCurrency(pricing.tax)} muted />
      <div className="!mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="font-semibold text-slate-900">Total amount</span>
        <span className="font-display text-lg font-bold text-slate-900">
          {formatCurrency(pricing.total)}
        </span>
      </div>

      {showAdvance && pricing.advanceEligible && (
        <div className="!mt-3 space-y-2 rounded-xl bg-brand-50 p-3">
          <div className="flex items-start gap-2 text-xs text-brand-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>This is a large event — pay an advance now and the balance later.</span>
          </div>
          <Row label="Advance payable now (25%)" value={formatCurrency(pricing.advanceAmount)} />
          <Row label="Balance due later" value={formatCurrency(pricing.remainingAmount)} muted />
        </div>
      )}
    </div>
  );
}
