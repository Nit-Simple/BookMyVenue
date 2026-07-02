import { db, DEMO_USER_ID } from '@/mock/db';
import { calculatePricing, calculateRefund } from '@/utils/pricing';
import { CATEGORY_MAP } from '@/utils/constants';
import { VENUE_IMAGE_POOL } from '@/mock/seed';
import type {
  AuthSession,
  AuthTokens,
  Booking,
  EventCategory,
  Invoice,
  Paginated,
  PaymentRecord,
  Review,
  SupportTicket,
  User,
  Venue,
  VenueFilters,
} from '@/types';

/** Error thrown by handlers; mapped to an axios-style error response. */
export class MockHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface HandlerCtx {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

type Handler = (ctx: HandlerCtx) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' +
      path.replace(/:([^/]+)/g, (_, k: string) => {
        keys.push(k);
        return '([^/]+)';
      }) +
      '$',
  );
  routes.push({ method: method.toUpperCase(), pattern, keys, handler });
}

// ---------------------------------------------------------------------------
// Token helpers — opaque strings, just enough to simulate access/refresh.
// ---------------------------------------------------------------------------
function makeTokens(userId: string): AuthTokens {
  const rand = Math.random().toString(36).slice(2);
  return {
    accessToken: `acc.${btoa(userId)}.${rand}`,
    refreshToken: `ref.${btoa(userId)}.${rand}`,
    expiresAt: Date.now() + 1000 * 60 * 60, // 1h
  };
}

function sessionFor(user: User): AuthSession {
  return { user, tokens: makeTokens(user.id) };
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
route('POST', '/auth/login', ({ body }) => {
  const { email, phone, password } = (body ?? {}) as {
    email?: string;
    phone?: string;
    password?: string;
  };
  if (email === 'blocked@example.com') {
    throw new MockHttpError(403, 'This account has been suspended.');
  }
  if (email && password && password.length < 6) {
    throw new MockHttpError(401, 'Invalid email or password.');
  }
  if (!email && !phone) {
    throw new MockHttpError(400, 'Email or phone is required.');
  }
  const user = db.getDemoUser();
  return sessionFor({
    ...user,
    email: email ?? user.email,
    phone: phone ?? user.phone,
  });
});

route('POST', '/auth/register', ({ body }) => {
  const { name, email, phone } = (body ?? {}) as {
    name?: string;
    email?: string;
    phone?: string;
  };
  if (email === 'taken@example.com') {
    throw new MockHttpError(409, 'An account with this email already exists.');
  }
  const base = db.getDemoUser();
  return sessionFor({
    ...base,
    id: DEMO_USER_ID,
    name: name ?? base.name,
    email: email ?? base.email,
    phone: phone ?? base.phone,
  });
});

route('POST', '/auth/otp/send', ({ body }) => {
  const { phone } = (body ?? {}) as { phone?: string };
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    throw new MockHttpError(400, 'Enter a valid 10-digit phone number.');
  }
  // In the prototype the OTP is fixed; a real backend would SMS it.
  return { sent: true, devOtp: '123456' };
});

route('POST', '/auth/otp/verify', ({ body }) => {
  const { otp, phone } = (body ?? {}) as { otp?: string; phone?: string };
  if (otp !== '123456') {
    throw new MockHttpError(401, 'Incorrect OTP. Try 123456 for this demo.');
  }
  const user = db.getDemoUser();
  return sessionFor({ ...user, phone: phone ?? user.phone });
});

route('POST', '/auth/google', () => {
  return sessionFor(db.getDemoUser());
});

route('POST', '/auth/refresh', ({ body }) => {
  const { refreshToken } = (body ?? {}) as { refreshToken?: string };
  if (!refreshToken) throw new MockHttpError(401, 'Missing refresh token.');
  return makeTokens(DEMO_USER_ID);
});

route('GET', '/auth/me', () => db.getDemoUser());
route('POST', '/auth/logout', () => ({ ok: true }));

// ---------------------------------------------------------------------------
// VENUES
// ---------------------------------------------------------------------------
function applyFilters(all: Venue[], f: VenueFilters): Venue[] {
  let list = [...all];
  if (f.query) {
    const q = f.query.toLowerCase();
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.location.city.toLowerCase().includes(q) ||
        v.tagline.toLowerCase().includes(q),
    );
  }
  if (f.city) list = list.filter((v) => v.location.city === f.city);
  if (f.category) list = list.filter((v) => v.categories.includes(f.category as EventCategory));
  if (f.capacity) list = list.filter((v) => v.capacityMax >= f.capacity!);
  if (f.priceMin != null) list = list.filter((v) => v.startingPrice >= f.priceMin!);
  if (f.priceMax != null) list = list.filter((v) => v.startingPrice <= f.priceMax!);
  if (f.minRating) list = list.filter((v) => v.rating >= f.minRating!);
  if (f.offersOnly) list = list.filter((v) => v.offer !== null);

  switch (f.sort) {
    case 'price_asc':
      list.sort((a, b) => a.startingPrice - b.startingPrice);
      break;
    case 'price_desc':
      list.sort((a, b) => b.startingPrice - a.startingPrice);
      break;
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'popular':
      list.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    default:
      list.sort(
        (a, b) =>
          Number(b.recommended) - Number(a.recommended) || b.rating - a.rating,
      );
  }
  return list;
}

function parseFilters(q: URLSearchParams): VenueFilters {
  const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
  return {
    query: q.get('query') ?? undefined,
    city: q.get('city') ?? undefined,
    category: (q.get('category') as EventCategory) ?? undefined,
    dateFrom: q.get('dateFrom') ?? undefined,
    dateTo: q.get('dateTo') ?? undefined,
    capacity: num('capacity'),
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    minRating: num('minRating'),
    offersOnly: q.get('offersOnly') === 'true',
    sort: (q.get('sort') as VenueFilters['sort']) ?? 'recommended',
    page: num('page') ?? 1,
    pageSize: num('pageSize') ?? 12,
  };
}

route('GET', '/venues', ({ query }) => {
  const f = parseFilters(query);
  const filtered = applyFilters(db.venues, f);
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 12;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const result: Paginated<Venue> = {
    items,
    page,
    pageSize,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
  return result;
});

route('GET', '/venues/trending', () =>
  db.venues.filter((v) => v.trending).slice(0, 8),
);
route('GET', '/venues/popular', () =>
  [...db.venues].filter((v) => v.popular).sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8),
);
route('GET', '/venues/recommended', () =>
  db.venues.filter((v) => v.recommended).slice(0, 8),
);
route('GET', '/venues/offers', () =>
  db.venues.filter((v) => v.offer !== null).slice(0, 8),
);

route('GET', '/venues/locations', () => {
  const counts = new Map<string, number>();
  db.venues.forEach((v) => counts.set(v.location.city, (counts.get(v.location.city) ?? 0) + 1));
  return [...counts.entries()]
    .map(([city, count], i) => ({
      city,
      count,
      image: VENUE_IMAGE_POOL[i % VENUE_IMAGE_POOL.length],
    }))
    .sort((a, b) => b.count - a.count);
});

route('GET', '/venues/:id', ({ params }) => {
  const venue = db.venues.find((v) => v.id === params.id);
  if (!venue) throw new MockHttpError(404, 'Venue not found.');
  return venue;
});

route('GET', '/venues/:id/reviews', ({ params }) =>
  db
    .allReviews()
    .filter((r) => r.venueId === params.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
);

// ---------------------------------------------------------------------------
// BOOKINGS
// ---------------------------------------------------------------------------
route('GET', '/bookings', () =>
  db
    .allBookings()
    .filter((b) => b.userId === DEMO_USER_ID)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
);

route('GET', '/bookings/:id', ({ params }) => {
  const booking = db.getBooking(params.id);
  if (!booking) throw new MockHttpError(404, 'Booking not found.');
  return booking;
});

route('GET', '/bookings/:id/invoice', ({ params }) => {
  const booking = db.getBooking(params.id);
  if (!booking) throw new MockHttpError(404, 'Booking not found.');
  const invoice = db.getInvoice(booking.invoiceId);
  if (!invoice) throw new MockHttpError(404, 'Invoice not found.');
  return invoice;
});

interface CreateBookingBody {
  venueId: string;
  packageId: string;
  category: EventCategory;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
}

route('POST', '/bookings', ({ body }) => {
  const b = body as CreateBookingBody;
  const venue = db.venues.find((v) => v.id === b.venueId);
  if (!venue) throw new MockHttpError(404, 'Venue not found.');
  const pkg = venue.packages.find((p) => p.id === b.packageId);
  if (!pkg) throw new MockHttpError(400, 'Invalid package selected.');
  if (venue.bookedDates.includes(b.eventDate)) {
    throw new MockHttpError(409, 'Selected date is no longer available.');
  }

  const pricing = calculatePricing({
    pkg,
    guestCount: b.guestCount,
    category: b.category,
    discountPct: venue.offer?.discountPct ?? 0,
  });

  const seq = db.allBookings().length + 1;
  const id = `booking_new_${seq}_${Math.random().toString(36).slice(2, 7)}`;
  const invoiceId = `inv_new_${seq}`;
  const now = new Date().toISOString();

  const booking: Booking = {
    id,
    reference: `BMV${200000 + seq}`,
    venueId: venue.id,
    venueName: venue.name,
    venueImage: venue.images[0],
    venueCity: venue.location.city,
    userId: DEMO_USER_ID,
    category: b.category,
    packageId: pkg.id,
    packageName: pkg.name,
    eventDate: b.eventDate,
    startTime: b.startTime,
    endTime: b.endTime,
    guestCount: b.guestCount,
    status: 'pending',
    paymentStatus: 'unpaid',
    pricing,
    payments: [],
    invoiceId,
    refund: null,
    createdAt: now,
    cancellationPolicyId: venue.cancellationPolicyId,
  };

  const invoice: Invoice = {
    id: invoiceId,
    bookingId: id,
    number: `INV-2026-${2000 + seq}`,
    issuedAt: now,
    breakdown: pricing,
    amountPaid: 0,
    amountDue: pricing.total,
  };

  db.addBooking(booking);
  db.addInvoice(invoice);
  return booking;
});

interface PayBody {
  type: PaymentRecord['type'];
  method: PaymentRecord['method'];
  amount: number;
  /** Forces a failure path for the failure-handling demo. */
  forceFail?: boolean;
}

route('POST', '/bookings/:id/payments', ({ params, body }) => {
  const booking = db.getBooking(params.id);
  if (!booking) throw new MockHttpError(404, 'Booking not found.');
  const p = body as PayBody;

  if (p.forceFail) {
    throw new MockHttpError(402, 'Payment was declined by your bank. Please try another method.');
  }

  const payment: PaymentRecord = {
    id: `pay_${Math.random().toString(36).slice(2, 9)}`,
    bookingId: booking.id,
    type: p.type,
    method: p.method,
    amount: p.amount,
    status: 'success',
    reference: `TXN${Math.floor(100000 + Math.random() * 899999)}`,
    createdAt: new Date().toISOString(),
  };

  const payments = [...booking.payments, payment];
  const totalPaid = payments.reduce((s, x) => s + x.amount, 0);
  const fullyPaid = totalPaid >= booking.pricing.total;
  const paymentStatus = fullyPaid ? 'fully_paid' : 'advance_paid';

  const updated = db.updateBooking(booking.id, {
    payments,
    paymentStatus,
    status: 'confirmed',
  })!;

  // Keep the invoice in sync.
  const invoice = db.getInvoice(booking.invoiceId);
  if (invoice) {
    db.addInvoice({
      ...invoice,
      amountPaid: totalPaid,
      amountDue: Math.max(0, booking.pricing.total - totalPaid),
    });
  }

  return { booking: updated, payment };
});

route('POST', '/bookings/:id/cancel', ({ params, body }) => {
  const booking = db.getBooking(params.id);
  if (!booking) throw new MockHttpError(404, 'Booking not found.');
  if (booking.status === 'cancelled') {
    throw new MockHttpError(409, 'This booking is already cancelled.');
  }
  if (booking.status === 'completed') {
    throw new MockHttpError(409, 'Completed bookings cannot be cancelled.');
  }
  const { reason } = (body ?? {}) as { reason?: string };

  const amountPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
  const calc = calculateRefund(
    booking.cancellationPolicyId,
    booking.eventDate,
    amountPaid,
    new Date(),
  );

  const refund = {
    id: `refund_${Math.random().toString(36).slice(2, 9)}`,
    bookingId: booking.id,
    amount: calc.refundAmount,
    refundPct: calc.refundPct,
    reason: reason || 'Customer cancelled booking',
    status: 'processing' as const,
    createdAt: new Date().toISOString(),
    expectedBy: booking.eventDate,
  };

  const updated = db.updateBooking(booking.id, {
    status: 'cancelled',
    paymentStatus: calc.refundAmount > 0 ? 'refunded' : booking.paymentStatus,
    refund,
  })!;

  return { booking: updated, refund };
});

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------
interface CreateReviewBody {
  venueId: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  eventCategory: EventCategory;
}

route('POST', '/reviews', ({ body }) => {
  const r = body as CreateReviewBody;
  const user = db.getDemoUser();
  const review: Review = {
    id: `review_new_${Math.random().toString(36).slice(2, 9)}`,
    venueId: r.venueId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatarUrl,
    rating: r.rating,
    title: r.title,
    body: r.body,
    images: r.images ?? [],
    createdAt: new Date().toISOString(),
    eventCategory: r.eventCategory,
    helpfulCount: 0,
  };
  db.addReview(review);
  return review;
});

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------
route('GET', '/profile', () => db.getDemoUser());

route('PATCH', '/profile', ({ body }) => {
  return db.patchProfile((body ?? {}) as Partial<User>);
});

route('POST', '/profile/password', ({ body }) => {
  const { currentPassword, newPassword } = (body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || currentPassword.length < 6) {
    throw new MockHttpError(401, 'Current password is incorrect.');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new MockHttpError(400, 'New password must be at least 8 characters.');
  }
  return { ok: true };
});

route('GET', '/profile/saved', () => {
  const ids = new Set(db.savedVenueIds());
  return db.venues.filter((v) => ids.has(v.id));
});

route('POST', '/profile/saved/:venueId', ({ params }) => {
  const saved = db.toggleSavedVenue(params.venueId);
  return { saved };
});

// ---------------------------------------------------------------------------
// SUPPORT
// ---------------------------------------------------------------------------
route('GET', '/support/faqs', () => db.faqs);

route('GET', '/support/tickets', () =>
  [...db.allTickets()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
);

interface CreateTicketBody {
  subject: string;
  category: string;
  message: string;
  priority: SupportTicket['priority'];
}

route('POST', '/support/tickets', ({ body }) => {
  const t = body as CreateTicketBody;
  const now = new Date().toISOString();
  const seq = db.allTickets().length + 1;
  const ticket: SupportTicket = {
    id: `ticket_${Math.random().toString(36).slice(2, 9)}`,
    reference: `TKT-${4000 + seq}`,
    subject: t.subject,
    category: t.category,
    message: t.message,
    priority: t.priority,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  db.addTicket(ticket);
  return ticket;
});

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export interface MockResponse {
  status: number;
  data: unknown;
}

export function dispatch(
  method: string,
  url: string,
  body: unknown,
  headers: Record<string, string>,
): MockResponse {
  const [path, search = ''] = url.split('?');
  const query = new URLSearchParams(search);
  const m = method.toUpperCase();

  for (const r of routes) {
    if (r.method !== m) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => {
      params[k] = decodeURIComponent(match[i + 1]);
    });
    const data = r.handler({ params, query, body, headers });
    return { status: 200, data };
  }
  throw new MockHttpError(404, `No mock handler for ${m} ${path}`);
}

// Helper used by category labels in handlers / elsewhere.
export function categoryLabel(c: EventCategory): string {
  return CATEGORY_MAP[c].label;
}
