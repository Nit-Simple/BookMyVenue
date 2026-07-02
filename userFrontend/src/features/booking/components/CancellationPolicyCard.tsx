import { CalendarX2 } from 'lucide-react';
import { CANCELLATION_POLICY_MAP } from '@/utils/constants';

export function CancellationPolicyCard({ policyId }: { policyId: string }) {
  const policy = CANCELLATION_POLICY_MAP[policyId] ?? CANCELLATION_POLICY_MAP.standard;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CalendarX2 className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{policy.name}</span>
      </div>
      <ul className="space-y-2">
        {policy.tiers.map((tier) => (
          <li
            key={tier.hoursBefore}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 text-sm"
          >
            <span className="text-slate-600">{tier.label}</span>
            <span
              className={
                tier.refundPct >= 100
                  ? 'font-semibold text-emerald-600'
                  : tier.refundPct > 0
                    ? 'font-semibold text-amber-600'
                    : 'font-semibold text-red-600'
              }
            >
              {tier.refundPct}% refund
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
