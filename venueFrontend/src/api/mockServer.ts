/**
 * In-browser mock backend for the Venue Portal.
 *
 * It serves two kinds of routes:
 *   1. REAL-shaped routes (auth, manager venues, pricing, applications) that
 *      mirror the Go/Gin backend response contracts exactly, so switching to
 *      the live server (VITE_USE_MOCK=false) is a drop-in.
 *   2. ANTICIPATED routes (analytics, bookings, maintenance, transactions,
 *      refunds, cancellation policy) that the backend does NOT yet expose.
 *      These let the UI be fully demoable today; each caller is marked
 *      `// TODO(backend)`.
 *
 * To go live: set VITE_USE_MOCK=false. No service code changes required.
 */
import dayjs from 'dayjs';
import type {
  ActivityItem,
  CancellationPolicy,
  CreateVenueRequest,
  DashboardAnalytics,
  MaintenanceDay,
  MonthlyPoint,
  Refund,
  Transaction,
  VenueApplication,
  VenueBooking,
  VenueDetail,
  VenueListItem,
  VenuePricing,
} from '@/types';

export class MockHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const OWNER_ID = 'mgr-00000000-0000-0000-0000-000000000001';
const VENUE_ID = 'venue-0000-0000-0000-0000-000000000001';

// ─────────────────────────────────────────────────────────────────────────
// Fake JWT (decodeJwt in utils/jwt.ts must be able to read sub/role/exp)
// ─────────────────────────────────────────────────────────────────────────

function b64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeToken(sub: string, role: string): string {
  const header = b64url({ alg: 'EdDSA', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url({ sub, role, iat: now, exp: now + 60 * 60 });
  return `${header}.${payload}.mock-signature`;
}

// ─────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────

const now = dayjs();

const CUSTOMERS = [
  'Aarav Sharma',
  'Diya Patel',
  'Vivaan Reddy',
  'Ananya Iyer',
  'Kabir Nair',
  'Ishaan Gupta',
  'Myra Menon',
  'Reyansh Rao',
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const basePricing: VenuePricing = {
  id: 'price-001',
  venue_id: VENUE_ID,
  price_per_hour: 4500,
  is_weekend: false,
  currency: 'INR',
  is_active: true,
  start_date: now.subtract(3, 'month').format('YYYY-MM-DD'),
  end_date: null,
  created_at: now.subtract(3, 'month').toISOString(),
  updated_at: now.subtract(3, 'month').toISOString(),
};

const venue: VenueDetail = {
  venue_id: VENUE_ID,
  owner_id: OWNER_ID,
  onboarding_status: 'APPROVED',
  reviewed_by: 'admin-001',
  admin_notes: 'Looks great. Approved.',
  venue_name: 'The Grand Pavilion',
  addressline_1: '42 Marine Drive',
  addressline_2: 'Near Nariman Point',
  phone: '+91 98200 12345',
  phone_private: '+91 98200 99999',
  email: 'events@grandpavilion.in',
  city: 'Mumbai',
  district: 'Mumbai City',
  state: 'Maharashtra',
  postal_code: '400021',
  country_code: 'IN',
  latitude: '18.9432',
  longitude: '72.8231',
  seating_capacity: 350,
  min_booking_duration: '2h',
  opening_period: '09:00',
  closing_period: '23:00',
  relaxation_period: '1h',
  is_air_conditioned: true,
  venue_type: 'Banquet Hall',
  media: [
    {
      media_id: 'm1',
      venue_id: VENUE_ID,
      url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80',
      primary: true,
      sort_order: 0,
      created_at: now.toISOString(),
    },
    {
      media_id: 'm2',
      venue_id: VENUE_ID,
      url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80',
      primary: false,
      sort_order: 1,
      created_at: now.toISOString(),
    },
    {
      media_id: 'm3',
      venue_id: VENUE_ID,
      url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&q=80',
      primary: false,
      sort_order: 2,
      created_at: now.toISOString(),
    },
  ],
  pricing: [basePricing],
  created_at: now.subtract(3, 'month').toISOString(),
  updated_at: now.subtract(1, 'month').toISOString(),
};

const applications: VenueApplication[] = [
  {
    application_id: 'app-001',
    venue_id: VENUE_ID,
    owner_id: OWNER_ID,
    type: 'NEW_VENUE',
    status: 'APPROVED',
    reviewed_by: 'admin-001',
    admin_notes: 'Approved.',
    submitted_at: now.subtract(3, 'month').toISOString(),
    reviewed_at: now.subtract(85, 'day').toISOString(),
    created_at: now.subtract(3, 'month').toISOString(),
    updated_at: now.subtract(85, 'day').toISOString(),
  },
  {
    application_id: 'app-002',
    venue_id: VENUE_ID,
    owner_id: OWNER_ID,
    type: 'PRICING_UPDATE',
    status: 'PENDING_REVIEW',
    submitted_at: now.subtract(2, 'day').toISOString(),
    reviewed_at: null,
    created_at: now.subtract(2, 'day').toISOString(),
    updated_at: now.subtract(2, 'day').toISOString(),
  },
];

// Bookings across a ±45 day window for the calendar.
const bookings: VenueBooking[] = Array.from({ length: 40 }).map((_, i) => {
  const dayOffset = Math.floor(Math.random() * 90) - 45;
  const startHour = 9 + Math.floor(Math.random() * 10);
  const durationHrs = 2 + Math.floor(Math.random() * 4);
  const start = now.add(dayOffset, 'day').hour(startHour).minute(0).second(0);
  const end = start.add(durationHrs, 'hour');
  const statuses: VenueBooking['status'][] =
    dayOffset < -1
      ? ['COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
      : ['CONFIRMED', 'CONFIRMED', 'PENDING'];
  const status = rand(statuses);
  const amount = durationHrs * basePricing.price_per_hour;
  return {
    booking_id: `bk-${1000 + i}`,
    booking_reference: `BMV-${20250 + i}`,
    venue_id: VENUE_ID,
    customer_name: rand(CUSTOMERS),
    customer_email: 'customer@example.com',
    customer_phone: '+91 90000 00000',
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    guest_count: 20 + Math.floor(Math.random() * 280),
    status,
    total_amount: amount,
    currency: 'INR',
    special_requests: Math.random() > 0.6 ? 'Vegetarian catering, stage lighting.' : undefined,
  };
});

let maintenanceDays: MaintenanceDay[] = [
  {
    id: 'mnt-001',
    venue_id: VENUE_ID,
    date: now.add(6, 'day').format('YYYY-MM-DD'),
    reason: 'Deep cleaning & AC servicing',
    created_at: now.toISOString(),
  },
  {
    id: 'mnt-002',
    venue_id: VENUE_ID,
    date: now.add(7, 'day').format('YYYY-MM-DD'),
    reason: 'Deep cleaning & AC servicing',
    created_at: now.toISOString(),
  },
];

const transactions: Transaction[] = bookings
  .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
  .map((b, i) => {
    const advance = Math.round(b.total_amount * (Math.random() > 0.5 ? 0.3 : 1));
    return {
      id: `txn-${2000 + i}`,
      invoice_number: `INV-${dayjs(b.start_time).format('YYYYMM')}-${1000 + i}`,
      booking_reference: b.booking_reference,
      booking_id: b.booking_id,
      customer_name: b.customer_name,
      amount: b.total_amount,
      advance_paid: advance,
      remaining_amount: b.total_amount - advance,
      payment_status: advance >= b.total_amount ? 'CAPTURED' : 'PARTIALLY_REFUNDED',
      payment_method: rand(['CARD', 'UPI', 'NETBANKING', 'WALLET']),
      currency: 'INR',
      date: b.start_time,
    };
  });

const refunds: Refund[] = bookings
  .filter((b) => b.status === 'CANCELLED')
  .map((b, i) => {
    const status = rand(['PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'] as const);
    const requested = dayjs(b.start_time).subtract(3, 'day');
    const timeline: Refund['timeline'] = [
      { label: 'Refund requested', timestamp: requested.toISOString() },
    ];
    if (status !== 'PENDING') {
      timeline.push({
        label: status === 'REJECTED' ? 'Refund rejected' : 'Refund approved',
        timestamp: requested.add(1, 'day').toISOString(),
      });
    }
    if (status === 'PROCESSED') {
      timeline.push({
        label: 'Refund processed to source',
        timestamp: requested.add(2, 'day').toISOString(),
      });
    }
    return {
      id: `rf-${3000 + i}`,
      booking_reference: b.booking_reference,
      booking_id: b.booking_id,
      customer_name: b.customer_name,
      refund_amount: Math.round(b.total_amount * 0.5),
      currency: 'INR',
      status,
      reason: rand([
        'Change of plans',
        'Double booking',
        'Event postponed',
        'Venue unavailable',
      ]),
      requested_at: requested.toISOString(),
      approved_at: status === 'PENDING' ? null : requested.add(1, 'day').toISOString(),
      timeline,
    };
  });

// Cancellation policy — persisted to localStorage so edits survive reloads.
const POLICY_KEY = 'bmv_venue_mock_policy';
function loadPolicy(): CancellationPolicy {
  const raw = localStorage.getItem(POLICY_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as CancellationPolicy;
    } catch {
      /* fall through to default */
    }
  }
  return {
    venue_id: VENUE_ID,
    rules: [
      { id: 'r1', hours_before: 48, refund_percentage: 100 },
      { id: 'r2', hours_before: 24, refund_percentage: 50 },
      { id: 'r3', hours_before: 12, refund_percentage: 20 },
      { id: 'r4', hours_before: 0, refund_percentage: 0 },
    ],
    updated_at: now.toISOString(),
  };
}
function savePolicy(p: CancellationPolicy) {
  localStorage.setItem(POLICY_KEY, JSON.stringify(p));
}

// ─────────────────────────────────────────────────────────────────────────
// Analytics (derived from bookings)
// ─────────────────────────────────────────────────────────────────────────

function buildAnalytics(): DashboardAnalytics {
  const monthly: MonthlyPoint[] = Array.from({ length: 12 }).map((_, i) => {
    const m = now.subtract(11 - i, 'month');
    const inMonth = bookings.filter((b) => dayjs(b.start_time).isSame(m, 'month'));
    const revenue = inMonth
      .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
      .reduce((s, b) => s + b.total_amount, 0);
    return { month: m.format('MMM'), revenue, bookings: inMonth.length };
  });

  const thisMonth = bookings.filter((b) => dayjs(b.start_time).isSame(now, 'month'));
  const thisYear = bookings.filter((b) => dayjs(b.start_time).isSame(now, 'year'));
  const revenueOf = (list: VenueBooking[]) =>
    list
      .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
      .reduce((s, b) => s + b.total_amount, 0);

  const statusBreakdown = (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const).map(
    (status) => ({ status, count: bookings.filter((b) => b.status === status).length }),
  );

  const toActivity = (b: VenueBooking, type: ActivityItem['type']): ActivityItem => ({
    id: `${type}-${b.booking_id}`,
    type,
    title: b.customer_name,
    subtitle: `${b.booking_reference} · ${dayjs(b.start_time).format('D MMM, h:mm A')}`,
    amount: b.total_amount,
    status: b.status,
    timestamp: b.start_time,
  });

  const recentBookings = [...bookings]
    .sort((a, b) => dayjs(b.start_time).valueOf() - dayjs(a.start_time).valueOf())
    .slice(0, 5)
    .map((b) => toActivity(b, 'booking'));

  const upcomingBookings = bookings
    .filter((b) => dayjs(b.start_time).isAfter(now) && b.status !== 'CANCELLED')
    .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf())
    .slice(0, 5)
    .map((b) => toActivity(b, 'upcoming'));

  const recentPayments = transactions
    .slice(0, 5)
    .map<ActivityItem>((t) => ({
      id: `payment-${t.id}`,
      type: 'payment',
      title: t.customer_name,
      subtitle: `${t.invoice_number} · ${t.payment_method ?? ''}`,
      amount: t.advance_paid,
      status: t.payment_status,
      timestamp: t.date,
    }));

  return {
    metrics: {
      total_bookings: bookings.length,
      monthly_bookings: thisMonth.length,
      yearly_bookings: thisYear.length,
      total_revenue: revenueOf(bookings),
      monthly_revenue: revenueOf(thisMonth),
      pending_requests: bookings.filter((b) => b.status === 'PENDING').length,
      cancelled_bookings: bookings.filter((b) => b.status === 'CANCELLED').length,
      currency: 'INR',
    },
    monthly,
    statusBreakdown,
    recentBookings,
    recentPayments,
    upcomingBookings,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────

interface MockResponse {
  status: number;
  data: unknown;
}

function toListItem(v: VenueDetail): VenueListItem {
  const active = v.pricing?.find((p) => p.is_active && !p.is_weekend);
  return {
    venue_id: v.venue_id,
    venue_name: v.venue_name,
    owner_id: v.owner_id,
    city: v.city,
    district: v.district,
    state: v.state,
    onboarding_status: v.onboarding_status,
    primary_image: v.media.find((m) => m.primary)?.url ?? v.media[0]?.url ?? null,
    price_per_hour: active?.price_per_hour ?? null,
    weekend_price_per_hour: v.pricing?.find((p) => p.is_weekend)?.price_per_hour ?? null,
    currency: active?.currency ?? 'INR',
    created_at: v.created_at,
  };
}

export function dispatch(
  method: string,
  rawUrl: string,
  body: unknown,
  _headers: Record<string, string>,
): MockResponse {
  const [path] = rawUrl.split('?');
  const query = new URLSearchParams(rawUrl.split('?')[1] ?? '');
  const b = (body ?? {}) as Record<string, unknown>;

  // ---- Auth (REAL-shaped) --------------------------------------------------
  if (method === 'POST' && path === '/auth/login') {
    if (!b.email || !b.password) throw new MockHttpError(400, 'Email and password are required.');
    return {
      status: 200,
      data: {
        access_token: makeToken(OWNER_ID, 'venue_manager'),
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      },
    };
  }
  if (method === 'POST' && path === '/auth/register') {
    if (!b.email || !b.password || !b.phone)
      throw new MockHttpError(400, 'Email, password and phone are required.');
    return {
      status: 201,
      data: {
        ID: OWNER_ID,
        Email: b.email,
        Phone: b.phone,
        Role: b.role ?? 'venue_manager',
        CreatedAt: now.toISOString(),
        UpdatedAt: now.toISOString(),
      },
    };
  }
  if (method === 'POST' && path === '/auth/refresh') {
    return {
      status: 200,
      data: {
        access_token: makeToken(OWNER_ID, 'venue_manager'),
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      },
    };
  }
  if (method === 'POST' && path === '/auth/logout') {
    return { status: 200, data: { message: 'logged out' } };
  }

  // ---- Manager venues (REAL-shaped) ---------------------------------------
  if (method === 'GET' && path === '/manager/venues') {
    return { status: 200, data: [toListItem(venue)] };
  }
  if (method === 'POST' && path === '/manager/venues') {
    // Onboarding — accept JSON or FormData (mock just echoes an approved venue).
    const payload = (b.data ?? b) as Partial<CreateVenueRequest>;
    Object.assign(venue, {
      venue_name: payload.venue_name ?? venue.venue_name,
      onboarding_status: 'PENDING_APPROVAL',
    });
    return { status: 201, data: venue };
  }
  if (method === 'GET' && path === '/manager/venues/applications') {
    const status = query.get('status');
    const list = status ? applications.filter((a) => a.status === status) : applications;
    return { status: 200, data: list };
  }

  const venueMatch = path.match(/^\/manager\/venues\/([^/]+)$/);
  if (venueMatch) {
    if (method === 'GET') return { status: 200, data: venue };
    if (method === 'PATCH') {
      Object.assign(venue, b, { updated_at: now.toISOString() });
      return { status: 200, data: venue };
    }
  }

  const pricingMatch = path.match(/^\/manager\/venues\/([^/]+)\/pricing$/);
  if (pricingMatch) {
    if (method === 'GET') return { status: 200, data: venue.pricing ?? [] };
    if (method === 'POST') {
      const item = b as Partial<VenuePricing>;
      const created: VenuePricing = {
        id: `price-${Date.now()}`,
        venue_id: VENUE_ID,
        price_per_hour: Number(item.price_per_hour) || 0,
        is_weekend: !!item.is_weekend,
        currency: (item.currency as string) || 'INR',
        is_active: true,
        start_date: (item.start_date as string) || now.format('YYYY-MM-DD'),
        end_date: (item.end_date as string) ?? null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      // Single-base-price MVP: replace the active non-weekend price.
      venue.pricing = [
        created,
        ...(venue.pricing ?? []).filter((p) => p.is_weekend !== created.is_weekend),
      ];
      return { status: 201, data: created };
    }
  }

  // ---- Dashboard analytics (MOCK) — TODO(backend) -------------------------
  if (method === 'GET' && /^\/manager\/venues\/[^/]+\/analytics$/.test(path)) {
    return { status: 200, data: buildAnalytics() };
  }

  // ---- Calendar bookings (MOCK) — TODO(backend) ---------------------------
  const bookingsMatch = path.match(/^\/manager\/venues\/([^/]+)\/bookings$/);
  if (bookingsMatch && method === 'GET') {
    const start = query.get('start');
    const end = query.get('end');
    let list = bookings;
    if (start && end) {
      list = bookings.filter(
        (bk) =>
          dayjs(bk.start_time).isAfter(dayjs(start).subtract(1, 'day')) &&
          dayjs(bk.start_time).isBefore(dayjs(end).add(1, 'day')),
      );
    }
    return { status: 200, data: list };
  }

  // ---- Maintenance days (MOCK) — TODO(backend) ----------------------------
  const maintenanceMatch = path.match(/^\/manager\/venues\/([^/]+)\/maintenance$/);
  if (maintenanceMatch) {
    if (method === 'GET') return { status: 200, data: maintenanceDays };
    if (method === 'POST') {
      const day: MaintenanceDay = {
        id: `mnt-${Date.now()}`,
        venue_id: VENUE_ID,
        date: String(b.date),
        reason: b.reason ? String(b.reason) : undefined,
        created_at: now.toISOString(),
      };
      if (maintenanceDays.some((m) => m.date === day.date))
        throw new MockHttpError(409, 'That day is already marked for maintenance.');
      maintenanceDays.push(day);
      return { status: 201, data: day };
    }
  }
  const maintenanceItemMatch = path.match(/^\/manager\/venues\/([^/]+)\/maintenance\/([^/]+)$/);
  if (maintenanceItemMatch && method === 'DELETE') {
    const id = maintenanceItemMatch[2];
    maintenanceDays = maintenanceDays.filter((m) => m.id !== id);
    return { status: 200, data: { message: 'removed' } };
  }

  // ---- Transactions (MOCK) — TODO(backend) --------------------------------
  if (method === 'GET' && /^\/manager\/venues\/[^/]+\/transactions$/.test(path)) {
    return { status: 200, data: transactions };
  }

  // ---- Refunds (MOCK) — TODO(backend) -------------------------------------
  if (method === 'GET' && /^\/manager\/venues\/[^/]+\/refunds$/.test(path)) {
    return { status: 200, data: refunds };
  }
  const refundActionMatch = path.match(/^\/manager\/venues\/[^/]+\/refunds\/([^/]+)\/(approve|reject)$/);
  if (refundActionMatch && method === 'POST') {
    const [, id, action] = refundActionMatch;
    const refund = refunds.find((r) => r.id === id);
    if (!refund) throw new MockHttpError(404, 'Refund not found.');
    refund.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    refund.approved_at = now.toISOString();
    refund.timeline.push({
      label: action === 'approve' ? 'Refund approved' : 'Refund rejected',
      timestamp: now.toISOString(),
      note: b.note ? String(b.note) : undefined,
    });
    return { status: 200, data: refund };
  }

  // ---- Cancellation policy (MOCK) — TODO(backend) -------------------------
  if (/^\/manager\/venues\/[^/]+\/cancellation-policy$/.test(path)) {
    if (method === 'GET') return { status: 200, data: loadPolicy() };
    if (method === 'PUT' || method === 'POST') {
      const incoming = b as unknown as CancellationPolicy;
      const updated: CancellationPolicy = {
        venue_id: VENUE_ID,
        rules: incoming.rules ?? [],
        updated_at: now.toISOString(),
      };
      savePolicy(updated);
      return { status: 200, data: updated };
    }
  }

  throw new MockHttpError(404, `Mock route not found: ${method} ${path}`);
}
