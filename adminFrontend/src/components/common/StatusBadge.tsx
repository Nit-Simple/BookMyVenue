import { Badge } from '@/components/ui';
import {
  APPLICATION_STATUS_META,
  BOOKING_STATUS_META,
  ONBOARDING_STATUS_META,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
} from '@/constants';
import type {
  ApplicationStatus,
  BookingStatus,
  OnboardingStatus,
  PaymentStatus,
  RefundStatus,
} from '@/types';

type Kind = 'booking' | 'payment' | 'refund' | 'onboarding' | 'application';

const MAPS = {
  booking: BOOKING_STATUS_META,
  payment: PAYMENT_STATUS_META,
  refund: REFUND_STATUS_META,
  onboarding: ONBOARDING_STATUS_META,
  application: APPLICATION_STATUS_META,
} as const;

type StatusFor<K extends Kind> = K extends 'booking'
  ? BookingStatus
  : K extends 'payment'
    ? PaymentStatus
    : K extends 'refund'
      ? RefundStatus
      : K extends 'onboarding'
        ? OnboardingStatus
        : ApplicationStatus;

export function StatusBadge<K extends Kind>({ kind, status }: { kind: K; status: StatusFor<K> }) {
  const meta = (MAPS[kind] as Record<string, { label: string; variant: never }>)[status];
  if (!meta) return <Badge variant="neutral">{status}</Badge>;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
