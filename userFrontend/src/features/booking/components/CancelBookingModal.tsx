import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button, Select } from '@/components/ui';
import { CancellationPolicyCard } from './CancellationPolicyCard';
import { calculateRefund } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';
import { useCancelBooking } from '../queries';
import { useToast } from '@/app/store/uiStore';
import { getErrorMessage } from '@/api/axios';
import type { Booking } from '@/types';

const REASONS = [
  'Change of plans',
  'Found a different venue',
  'Event postponed',
  'Budget constraints',
  'Other',
];

export function CancelBookingModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}) {
  const cancel = useCancelBooking();
  const toast = useToast();
  const [reason, setReason] = useState(REASONS[0]);

  const amountPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
  const refund = useMemo(
    () => calculateRefund(booking.cancellationPolicyId, booking.eventDate, amountPaid, new Date()),
    [booking, amountPaid],
  );

  const confirm = () => {
    cancel.mutate(
      { id: booking.id, reason },
      {
        onSuccess: () => {
          toast({
            variant: 'success',
            title: 'Booking cancelled',
            description:
              refund.refundAmount > 0
                ? `${formatCurrency(refund.refundAmount)} will be refunded.`
                : 'No refund is applicable per the policy.',
          });
          onClose();
        },
        onError: (err) =>
          toast({ variant: 'error', title: 'Cancellation failed', description: getErrorMessage(err) }),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel booking"
      description={`Reference ${booking.reference}`}
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            Keep booking
          </Button>
          <Button variant="danger" fullWidth isLoading={cancel.isPending} onClick={confirm}>
            Confirm cancellation
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Cancelling is permanent. Your refund is calculated from how far ahead of the event you
            cancel, per the policy below.
          </p>
        </div>

        <Select
          label="Reason for cancellation"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={REASONS.map((r) => ({ value: r, label: r }))}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Cancellation policy</p>
          <CancellationPolicyCard policyId={booking.cancellationPolicyId} />
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Amount paid</span>
            <span className="font-medium text-slate-900">{formatCurrency(amountPaid)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-slate-500">Applicable refund ({refund.refundPct}%)</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(refund.refundAmount)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {refund.matchedTier.label} · {Math.max(0, Math.round(refund.hoursUntilEvent))} hours until event
          </p>
        </div>
      </div>
    </Modal>
  );
}
