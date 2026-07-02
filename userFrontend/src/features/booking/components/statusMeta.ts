import type { BookingStatus, PaymentStatus } from '@/types';
import type { BadgeProps } from '@/components/ui/Badge';

export const bookingStatusMeta: Record<
  BookingStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'info' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

export const paymentStatusMeta: Record<
  PaymentStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  unpaid: { label: 'Unpaid', variant: 'neutral' },
  advance_paid: { label: 'Advance paid', variant: 'warning' },
  fully_paid: { label: 'Fully paid', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'info' },
  partially_refunded: { label: 'Partially refunded', variant: 'info' },
};
