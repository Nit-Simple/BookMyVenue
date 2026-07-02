// ============================================================================
// Domain types for BookMyVenue customer platform.
// These mirror the shapes the Go/Gin + PostgreSQL backend will expose, so the
// mock services can be swapped for real HTTP calls without touching the UI.
// ============================================================================

export type ISODateString = string; // e.g. "2026-08-14"
export type ISODateTimeString = string; // e.g. "2026-08-14T10:30:00.000Z"

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export type EventCategory =
  | 'wedding'
  | 'birthday'
  | 'conference'
  | 'corporate'
  | 'meeting';

export interface CategoryMeta {
  id: EventCategory;
  label: string;
  description: string;
  icon: string; // lucide icon name
  /** Large events require advance-payment handling, small events full payment. */
  scale: 'large' | 'small';
}

// ---------------------------------------------------------------------------
// User & auth
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  createdAt: ISODateTimeString;
  preferences: UserPreferences;
  savedVenueIds: string[];
}

export interface UserPreferences {
  preferredCity: string;
  preferredCategories: EventCategory[];
  newsletter: boolean;
  smsAlerts: boolean;
  currency: 'INR';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch milliseconds when the access token expires. */
  expiresAt: number;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export type AuthMethod = 'password' | 'phone' | 'google';

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------
export interface Amenity {
  id: string;
  label: string;
  icon: string;
}

export interface VenuePackage {
  id: string;
  name: string;
  description: string;
  /** Per-event base price for this package, in INR. */
  pricePerEvent: number;
  /** Optional per-guest add-on (e.g. catering). 0 when not applicable. */
  pricePerGuest: number;
  inclusions: string[];
  popular: boolean;
}

export interface VenueLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface Offer {
  id: string;
  label: string;
  /** Percentage discount applied to the venue base price. */
  discountPct: number;
  code: string;
  expiresAt: ISODateString;
}

export type AvailabilityStatus = 'available' | 'limited' | 'booked';

export interface Venue {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: EventCategory;
  categories: EventCategory[];
  location: VenueLocation;
  images: string[];
  rating: number;
  reviewCount: number;
  capacityMin: number;
  capacityMax: number;
  /** Lowest package price — used for "starting from" labels and filtering. */
  startingPrice: number;
  amenities: Amenity[];
  packages: VenuePackage[];
  offer: Offer | null;
  availability: AvailabilityStatus;
  /** ISO dates that are fully booked and cannot be selected. */
  bookedDates: ISODateString[];
  trending: boolean;
  popular: boolean;
  recommended: boolean;
  cancellationPolicyId: string;
  createdAt: ISODateTimeString;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export interface Review {
  id: string;
  venueId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  createdAt: ISODateTimeString;
  eventCategory: EventCategory;
  helpfulCount: number;
}

// ---------------------------------------------------------------------------
// Bookings & payments
// ---------------------------------------------------------------------------
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'advance_paid'
  | 'fully_paid'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 'card' | 'upi' | 'wallet';

export type PaymentType = 'advance' | 'remaining' | 'full';

export interface PriceBreakdown {
  venuePrice: number;
  guestCharge: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  total: number;
  /** Advance amount due now for large events; equals total for small events. */
  advanceAmount: number;
  remainingAmount: number;
  /** True when the event category requires only a partial advance up front. */
  advanceEligible: boolean;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  reference: string;
  createdAt: ISODateTimeString;
}

export interface Invoice {
  id: string;
  bookingId: string;
  number: string;
  issuedAt: ISODateTimeString;
  breakdown: PriceBreakdown;
  amountPaid: number;
  amountDue: number;
}

export interface RefundRecord {
  id: string;
  bookingId: string;
  amount: number;
  refundPct: number;
  reason: string;
  status: 'processing' | 'completed';
  createdAt: ISODateTimeString;
  expectedBy: ISODateString;
}

export interface Booking {
  id: string;
  reference: string;
  venueId: string;
  venueName: string;
  venueImage: string;
  venueCity: string;
  userId: string;
  category: EventCategory;
  packageId: string;
  packageName: string;
  eventDate: ISODateString;
  startTime: string; // "10:00"
  endTime: string; // "22:00"
  guestCount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  pricing: PriceBreakdown;
  payments: PaymentRecord[];
  invoiceId: string;
  refund: RefundRecord | null;
  createdAt: ISODateTimeString;
  cancellationPolicyId: string;
}

// ---------------------------------------------------------------------------
// Cancellation policy
// ---------------------------------------------------------------------------
export interface CancellationTier {
  /** Cancel at least this many hours before the event to get this refund. */
  hoursBefore: number;
  refundPct: number;
  label: string;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  tiers: CancellationTier[];
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------
export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  reference: string;
  subject: string;
  category: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popular';

export interface VenueFilters {
  query?: string;
  city?: string;
  category?: EventCategory;
  dateFrom?: ISODateString;
  dateTo?: ISODateString;
  capacity?: number;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  offersOnly?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}
