import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import {
  PaymentMethodForm,
  emptyPaymentDetails,
  isPaymentValid,
  type PaymentDetails,
} from './PaymentMethodForm';
import { PaymentProcessing, type PaymentPhase } from './PaymentProcessing';
import { usePayBooking } from '@/features/booking/queries';
import { formatCurrency } from '@/utils/format';
import { getErrorMessage } from '@/api/axios';
import { useToast } from '@/app/store/uiStore';
import type { Booking } from '@/types';

/** Lets a customer settle the remaining balance on an advance-paid booking. */
export function PayBalanceModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}) {
  const pay = usePayBooking();
  const toast = useToast();
  const [details, setDetails] = useState<PaymentDetails>(emptyPaymentDetails);
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [error, setError] = useState<string>();

  const amount = booking.pricing.remainingAmount;

  const run = () => {
    setPhase('processing');
    setError(undefined);
    pay.mutate(
      { id: booking.id, payload: { type: 'remaining', method: details.method, amount } },
      {
        onSuccess: () => {
          setPhase('success');
          setTimeout(() => {
            setPhase('idle');
            toast({ variant: 'success', title: 'Balance paid', description: 'Your booking is now fully paid.' });
            onClose();
          }, 1200);
        },
        onError: (err) => {
          setError(getErrorMessage(err));
          setPhase('failed');
        },
      },
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Pay remaining balance"
        description={`${formatCurrency(amount)} due for ${booking.reference}`}
        footer={
          <Button fullWidth size="lg" disabled={!isPaymentValid(details)} onClick={run}>
            Pay {formatCurrency(amount)}
          </Button>
        }
      >
        <PaymentMethodForm value={details} onChange={setDetails} />
      </Modal>
      <PaymentProcessing
        phase={phase}
        amount={amount}
        errorMessage={error}
        onRetry={run}
        onClose={() => setPhase('idle')}
      />
    </>
  );
}
