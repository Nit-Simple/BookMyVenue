/**
 * In-browser mock backend for the Admin Portal.
 *
 * REAL-shaped routes (auth, /admin/venues, /admin/applications, approve/reject)
 * mirror the Go/Gin contracts exactly, so VITE_USE_MOCK=false is a drop-in.
 * ANTICIPATED routes (venue detail for pending venues, suspend) are mock-only and
 * marked TODO(backend).
 */
import dayjs from 'dayjs';
import type {
  OnboardingStatus,
  ApplicationStatus,
  VenueApplication,
  VenueDetail,
  VenueListItem,
} from '@/types';

export class MockHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const ADMIN_ID = 'admin-0000-0000-0000-000000000001';

function b64url(obj: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
function makeToken(sub: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  return `${b64url({ alg: 'EdDSA', typ: 'JWT' })}.${b64url({ sub, role, iat: now, exp: now + 3600 })}.mock`;
}

// ── seed ────────────────────────────────────────────────────────────────
const now = dayjs();
const CITIES = [
  { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra' },
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
  { city: 'Delhi', district: 'New Delhi', state: 'Delhi' },
  { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan' },
  { city: 'Kochi', district: 'Ernakulam', state: 'Kerala' },
];
const CATEGORIES = ['Banquet Hall', 'Wedding Lawn', 'Conference Room', 'Rooftop', 'Auditorium', 'Resort'];
const OWNERS = ['Rahul Verma', 'Sneha Kapoor', 'Arjun Mehta', 'Priya Nair', 'Farhan Khan', 'Neha Joshi'];
const IMAGES = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&q=80',
  'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=400&q=80',
];

interface Row {
  venue: VenueListItem;
  detail: VenueDetail;
  application: VenueApplication;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

const rows: Row[] = Array.from({ length: 14 }).map((_, i) => {
  const loc = pick(CITIES, i);
  const category = pick(CATEGORIES, i);
  const owner = pick(OWNERS, i);
  const venueId = `venue-${1000 + i}`;
  const ownerId = `owner-${1000 + i}`;
  const created = now.subtract(i * 3 + 1, 'day');
  // status mix: first 6 pending, next 5 approved, rest rejected
  const onboarding: OnboardingStatus = i < 6 ? 'PENDING_APPROVAL' : i < 11 ? 'APPROVED' : 'REJECTED';
  const appStatus: ApplicationStatus =
    onboarding === 'PENDING_APPROVAL' ? 'PENDING_REVIEW' : onboarding === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  const price = 2500 + i * 450;

  const venue: VenueListItem = {
    venue_id: venueId,
    venue_name: `${loc.city} ${category}`,
    owner_id: ownerId,
    city: loc.city,
    district: loc.district,
    state: loc.state,
    onboarding_status: onboarding,
    primary_image: pick(IMAGES, i),
    price_per_hour: price,
    weekend_price_per_hour: price + 1000,
    currency: 'INR',
    created_at: created.toISOString(),
  };

  const detail: VenueDetail = {
    venue_id: venueId,
    owner_id: ownerId,
    onboarding_status: onboarding,
    reviewed_by: onboarding === 'PENDING_APPROVAL' ? null : ADMIN_ID,
    admin_notes: onboarding === 'REJECTED' ? 'Incomplete documentation.' : null,
    venue_name: venue.venue_name,
    addressline_1: `${100 + i} Main Road`,
    addressline_2: 'Near City Center',
    phone: `+91 9${800000000 + i * 12345}`,
    phone_private: null,
    email: `contact@${loc.city.toLowerCase()}venue${i}.in`,
    city: loc.city,
    district: loc.district,
    state: loc.state,
    postal_code: `${400000 + i * 111}`,
    country_code: 'IN',
    latitude: null,
    longitude: null,
    seating_capacity: 100 + i * 25,
    min_booking_duration: '2h',
    opening_period: '09:00',
    closing_period: '23:00',
    relaxation_period: '1h',
    is_air_conditioned: i % 2 === 0,
    venue_type: category,
    media: IMAGES.map((url, k) => ({
      media_id: `${venueId}-m${k}`,
      venue_id: venueId,
      url,
      primary: k === 0,
      sort_order: k,
      created_at: created.toISOString(),
    })),
    pricing: [
      {
        id: `${venueId}-p0`,
        venue_id: venueId,
        price_per_hour: price,
        is_weekend: false,
        currency: 'INR',
        is_active: true,
        start_date: created.format('YYYY-MM-DD'),
        end_date: null,
        created_at: created.toISOString(),
        updated_at: created.toISOString(),
      },
    ],
    created_at: created.toISOString(),
    updated_at: created.toISOString(),
  };

  const application: VenueApplication = {
    application_id: `app-${1000 + i}`,
    venue_id: venueId,
    owner_id: ownerId,
    type: 'NEW_VENUE',
    status: appStatus,
    reviewed_by: appStatus === 'PENDING_REVIEW' ? null : ADMIN_ID,
    admin_notes: onboarding === 'REJECTED' ? 'Incomplete documentation.' : null,
    submitted_at: created.toISOString(),
    reviewed_at: appStatus === 'PENDING_REVIEW' ? null : created.add(1, 'day').toISOString(),
    created_at: created.toISOString(),
    updated_at: created.toISOString(),
  };

  // Tag owner name onto the detail email area via metadata-free convenience:
  (venue as VenueListItem & { owner_name?: string }).owner_name = owner;
  return { venue, detail, application };
});

// ── router ──────────────────────────────────────────────────────────────
interface MockResponse {
  status: number;
  data: unknown;
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

  // Auth
  if (method === 'POST' && path === '/auth/login') {
    if (!b.email || !b.password) throw new MockHttpError(400, 'Email and password are required.');
    return {
      status: 200,
      data: { access_token: makeToken(ADMIN_ID, 'admin'), refresh_token: 'mock-refresh', expires_in: 3600 },
    };
  }
  if (method === 'POST' && path === '/auth/refresh') {
    return {
      status: 200,
      data: { access_token: makeToken(ADMIN_ID, 'admin'), refresh_token: 'mock-refresh', expires_in: 3600 },
    };
  }
  if (method === 'POST' && path === '/auth/logout') return { status: 200, data: { message: 'ok' } };

  // Admin venues
  if (method === 'GET' && path === '/admin/venues') {
    const status = query.get('onboarding_status');
    const state = query.get('state');
    const district = query.get('district');
    let list = rows.map((r) => r.venue);
    if (status) list = list.filter((v) => v.onboarding_status === status);
    if (state) list = list.filter((v) => v.state === state);
    if (district) list = list.filter((v) => v.district === district);
    return { status: 200, data: list.slice(0, 50) };
  }

  const venueDetailMatch = path.match(/^\/admin\/venues\/([^/]+)$/);
  if (venueDetailMatch && method === 'GET') {
    // TODO(backend): no real pending-venue detail route.
    const row = rows.find((r) => r.venue.venue_id === venueDetailMatch[1]);
    if (!row) throw new MockHttpError(404, 'venue not found');
    return { status: 200, data: row.detail };
  }
  const suspendMatch = path.match(/^\/admin\/venues\/([^/]+)\/suspend$/);
  if (suspendMatch && method === 'POST') {
    // TODO(backend): no suspend endpoint / status.
    return { status: 200, data: { venue_id: suspendMatch[1], onboarding_status: 'REJECTED' } };
  }

  // Admin applications
  if (method === 'GET' && path === '/admin/applications') {
    const status = query.get('status') ?? 'PENDING_REVIEW';
    return { status: 200, data: rows.filter((r) => r.application.status === status).map((r) => r.application) };
  }
  const appDetailMatch = path.match(/^\/admin\/applications\/([^/]+)$/);
  if (appDetailMatch && method === 'GET') {
    const row = rows.find((r) => r.application.application_id === appDetailMatch[1]);
    if (!row) throw new MockHttpError(404, 'application not found');
    return { status: 200, data: row.application };
  }

  const decisionMatch = path.match(/^\/admin\/applications\/([^/]+)\/(approve|reject)$/);
  if (decisionMatch && method === 'PATCH') {
    const [, id, action] = decisionMatch;
    const row = rows.find((r) => r.application.application_id === id);
    if (!row) throw new MockHttpError(404, 'application not found');
    if (action === 'reject' && !b.notes) throw new MockHttpError(400, 'rejection reason is required');
    const onboarding: OnboardingStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const appStatus: ApplicationStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    row.application.status = appStatus;
    row.application.reviewed_by = ADMIN_ID;
    row.application.reviewed_at = now.toISOString();
    row.application.admin_notes = (b.notes as string) ?? null;
    row.venue.onboarding_status = onboarding;
    row.detail.onboarding_status = onboarding;
    row.detail.admin_notes = (b.notes as string) ?? null;
    return {
      status: 200,
      data: {
        application_id: id,
        venue_id: row.venue.venue_id,
        onboarding_status: onboarding,
        status: appStatus,
      },
    };
  }

  throw new MockHttpError(404, `Mock route not found: ${method} ${path}`);
}
