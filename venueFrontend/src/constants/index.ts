import type {
  ApplicationStatus,
  BookingStatus,
  OnboardingStatus,
  PaymentStatus,
  RefundStatus,
} from '@/types';

/** shadcn-style Badge variant names from the reused UI kit. */
export type BadgeVariant =
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info';

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; variant: BadgeVariant; color: string }
> = {
  PENDING: { label: 'Pending', variant: 'warning', color: '#f59e0b' },
  CONFIRMED: { label: 'Confirmed', variant: 'success', color: '#0d9488' },
  COMPLETED: { label: 'Completed', variant: 'info', color: '#0284c7' },
  CANCELLED: { label: 'Cancelled', variant: 'danger', color: '#dc2626' },
  NO_SHOW: { label: 'No show', variant: 'neutral', color: '#64748b' },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  AUTHORIZED: { label: 'Authorized', variant: 'info' },
  CAPTURED: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  REFUNDED: { label: 'Refunded', variant: 'neutral' },
  PARTIALLY_REFUNDED: { label: 'Partial refund', variant: 'accent' },
};

export const REFUND_STATUS_META: Record<RefundStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  PROCESSED: { label: 'Processed', variant: 'info' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

export const ONBOARDING_STATUS_META: Record<
  OnboardingStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING_APPROVAL: { label: 'Pending approval', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING_REVIEW: { label: 'Pending review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
};

/** Free-form on the backend (`venue_type`), surfaced as "Category" in the UI. */
export const VENUE_CATEGORIES = [
  'Banquet Hall',
  'Conference Room',
  'Wedding Lawn',
  'Auditorium',
  'Rooftop',
  'Resort',
  'Party Hall',
  'Community Hall',
  'Studio',
  'Other',
] as const;

export const CURRENCIES = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
] as const;
