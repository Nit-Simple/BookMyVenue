import { CheckCircle2, Circle } from 'lucide-react';
import { Drawer, Button } from '@/components/ui';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Refund } from '@/types';

export function RefundDetailsDrawer({
  refund,
  open,
  onClose,
  onApprove,
  onReject,
  isActing,
}: {
  refund: Refund | null;
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isActing: boolean;
}) {
  const canAct = refund?.status === 'PENDING';
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Refund details"
      footer={
        canAct ? (
          <div className="flex gap-2">
            <Button variant="danger" fullWidth onClick={onReject} isLoading={isActing}>
              Reject
            </Button>
            <Button fullWidth onClick={onApprove} isLoading={isActing}>
              Approve
            </Button>
          </div>
        ) : undefined
      }
    >
      {refund && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-brand-700">
              {refund.booking_reference}
            </span>
            <StatusBadge kind="refund" status={refund.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="text-sm font-medium text-slate-900">{refund.customer_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Refund amount</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(refund.refund_amount, refund.currency)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500">Reason</p>
            <p className="text-sm text-slate-700">{refund.reason}</p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">Timeline</p>
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {refund.timeline.map((e, i) => {
                const last = i === refund.timeline.length - 1;
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] top-0.5 bg-white">
                      {last ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-300" />
                      )}
                    </span>
                    <p className="text-sm font-medium text-slate-900">{e.label}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(e.timestamp)}</p>
                    {e.note && <p className="mt-0.5 text-xs text-slate-500">{e.note}</p>}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </Drawer>
  );
}
