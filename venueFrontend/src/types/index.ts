/**
 * Domain types for the Venue Portal.
 *
 * Types under "BACKED BY BACKEND" mirror the Go/Gin DTOs verbatim (snake_case,
 * as the API returns them). Types under "ANTICIPATED (mock only)" describe
 * shapes the UI needs but the backend does NOT yet expose — each is wired to
 * the mock adapter and marked `// TODO(backend)` at its call site.
 */

// ─────────────────────────────────────────────────────────────────────────
// Enums (from backend source of truth)
// ─────────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'venue_manager' | 'user';

export type OnboardingStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type ApplicationStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type ApplicationType = 'NEW_VENUE' | 'PRICING_UPDATE';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'EMI' | 'PAY_LATER';

// Backend has no refund-status enum; it uses free strings on this axis.
export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED';

// ─────────────────────────────────────────────────────────────────────────
// Auth — BACKED BY BACKEND
// ─────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
  role?: Role;
}

/** Response of POST /auth/login and /auth/refresh. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/** Synthesized client-side from decoded JWT claims (no /me endpoint exists). */
export interface AuthUser {
  id: string;
  role: Role;
  /** Captured from the login/register payload (backend exposes no /me). */
  email?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Venue — BACKED BY BACKEND (venue_dto.go)
// ─────────────────────────────────────────────────────────────────────────

export interface VenueMedia {
  media_id: string;
  venue_id: string;
  url: string;
  primary: boolean;
  metadata?: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface VenuePricing {
  id: string;
  venue_id: string;
  price_per_hour: number;
  is_weekend: boolean;
  currency: string;
  is_active: boolean;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueListItem {
  venue_id: string;
  venue_name: string;
  owner_id: string;
  city: string;
  district: string;
  state: string;
  onboarding_status: OnboardingStatus;
  primary_image?: string | null;
  price_per_hour?: number | null;
  weekend_price_per_hour?: number | null;
  currency?: string;
  created_at: string;
}

export interface VenueDetail {
  venue_id: string;
  owner_id: string;
  onboarding_status: OnboardingStatus;
  reviewed_by?: string | null;
  admin_notes?: string | null;
  venue_name: string;
  addressline_1: string;
  addressline_2?: string | null;
  phone: string;
  phone_private?: string | null;
  email: string;
  city: string;
  district: string;
  state: string;
  postal_code: string;
  country_code: string;
  latitude?: string | null;
  longitude?: string | null;
  seating_capacity: number;
  min_booking_duration: string;
  opening_period: string;
  closing_period: string;
  relaxation_period: string;
  is_air_conditioned: boolean;
  venue_type: string;
  media: VenueMedia[];
  pricing?: VenuePricing[];
  created_at: string;
  updated_at: string;
}

export interface CreateMediaItem {
  url: string;
  primary: boolean;
  metadata?: Record<string, unknown>;
  sort_order: number;
}

export interface CreatePricingItem {
  price_per_hour: number;
  is_weekend: boolean;
  currency: string;
  start_date: string; // "YYYY-MM-DD"
  end_date?: string | null;
}

export interface CreateVenueRequest {
  venue_name: string;
  addressline_1: string;
  addressline_2?: string;
  phone: string;
  phone_private?: string;
  email: string;
  city: string;
  district: string;
  state: string;
  postal_code: string;
  country_code: string;
  latitude?: string;
  longitude?: string;
  seating_capacity: number;
  min_booking_duration: string; // Go duration string, e.g. "2h"
  opening_period: string;
  closing_period: string;
  relaxation_period: string;
  is_air_conditioned: boolean;
  venue_type: string;
  media: CreateMediaItem[];
  pricing: CreatePricingItem[];
}

export interface VenueApplication {
  application_id: string;
  venue_id: string;
  owner_id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  reviewed_by?: string | null;
  admin_notes?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard analytics — ANTICIPATED (mock only). TODO(backend)
// ─────────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  total_bookings: number;
  monthly_bookings: number;
  yearly_bookings: number;
  total_revenue: number;
  monthly_revenue: number;
  pending_requests: number;
  cancelled_bookings: number;
  currency: string;
}

export interface MonthlyPoint {
  month: string; // "Jan", "Feb", ...
  revenue: number;
  bookings: number;
}

export interface StatusSlice {
  status: BookingStatus;
  count: number;
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'upcoming';
  title: string;
  subtitle: string;
  amount?: number;
  status?: BookingStatus | PaymentStatus;
  timestamp: string;
}

export interface DashboardAnalytics {
  metrics: DashboardMetrics;
  monthly: MonthlyPoint[];
  statusBreakdown: StatusSlice[];
  recentBookings: ActivityItem[];
  recentPayments: ActivityItem[];
  upcomingBookings: ActivityItem[];
}

// ─────────────────────────────────────────────────────────────────────────
// Calendar bookings + maintenance — ANTICIPATED (mock only). TODO(backend)
// ─────────────────────────────────────────────────────────────────────────
export interface ManagerBookingItem {
  id: string;
  venue_id: string;
  venue_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  start_time: string;
  end_time: string;
  total_amount: string; // backend returns money as a string
  currency: string;
  status: BookingStatus;
  guest_count: number;
  booking_reference: string;
  created_at: string;
}

export interface VenueBooking {
  booking_id: string;
  booking_reference: string;
  venue_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  status: BookingStatus;
  total_amount: number;
  currency: string;
  special_requests?: string;
}

export interface MaintenanceDay {
  id: string;
  venue_id: string;
  date: string; // "YYYY-MM-DD"
  reason?: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Transactions — ANTICIPATED (mock only). TODO(backend)
// ─────────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  invoice_number: string;
  booking_reference: string;
  booking_id: string;
  customer_name: string;
  amount: number;
  advance_paid: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  currency: string;
  date: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Refunds — ANTICIPATED (mock only). TODO(backend)
// ─────────────────────────────────────────────────────────────────────────

export interface RefundTimelineEvent {
  label: string;
  timestamp: string;
  note?: string;
}

export interface Refund {
  id: string;
  booking_reference: string;
  booking_id: string;
  customer_name: string;
  refund_amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  requested_at: string;
  approved_at?: string | null;
  timeline: RefundTimelineEvent[];
}

// ─────────────────────────────────────────────────────────────────────────
// Cancellation policy — ANTICIPATED (mock only). TODO(backend)
// ─────────────────────────────────────────────────────────────────────────

export interface CancellationRule {
  id: string;
  hours_before: number;
  refund_percentage: number;
}

export interface CancellationPolicy {
  venue_id: string;
  rules: CancellationRule[];
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Shared API helpers
// ─────────────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  message?: string;
  error?: string;
}
