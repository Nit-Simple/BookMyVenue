import {
  AVATAR_POOL,
  createRng,
  imageAt,
  intBetween,
  pick,
  pickMany,
  round,
  VENUE_IMAGE_POOL,
} from './seed';
import { CATEGORIES, CITIES } from '@/utils/constants';
import { calculatePricing } from '@/utils/pricing';
import type {
  Amenity,
  Booking,
  EventCategory,
  Invoice,
  Offer,
  PaymentRecord,
  RefundRecord,
  Review,
  User,
  Venue,
  VenueLocation,
  VenuePackage,
} from '@/types';

const AMENITIES: Amenity[] = [
  { id: 'parking', label: 'Valet Parking', icon: 'Car' },
  { id: 'wifi', label: 'High-speed Wi-Fi', icon: 'Wifi' },
  { id: 'ac', label: 'Air Conditioning', icon: 'Snowflake' },
  { id: 'catering', label: 'In-house Catering', icon: 'UtensilsCrossed' },
  { id: 'av', label: 'AV & Projector', icon: 'Projector' },
  { id: 'stage', label: 'Stage & Lighting', icon: 'Lightbulb' },
  { id: 'decor', label: 'Decor Services', icon: 'Flower2' },
  { id: 'rooms', label: 'Guest Rooms', icon: 'BedDouble' },
  { id: 'pool', label: 'Poolside', icon: 'Waves' },
  { id: 'garden', label: 'Garden / Lawn', icon: 'Trees' },
  { id: 'bar', label: 'Licensed Bar', icon: 'Wine' },
  { id: 'sound', label: 'Sound System', icon: 'Speaker' },
  { id: 'security', label: '24/7 Security', icon: 'ShieldCheck' },
  { id: 'wheelchair', label: 'Accessible', icon: 'Accessibility' },
];

const VENUE_PREFIX = [
  'The Grand',
  'Royal',
  'Imperial',
  'Crystal',
  'Emerald',
  'Sapphire',
  'Golden',
  'The Regal',
  'Pearl',
  'The Pavilion at',
  'Vista',
  'Aurora',
  'The Heritage',
  'Lotus',
  'The Orchid',
];

const VENUE_CORE = [
  'Banquets',
  'Convention Centre',
  'Gardens',
  'Palace',
  'Manor',
  'Hall',
  'Atrium',
  'Greens',
  'Terrace',
  'Courtyard',
  'Residency',
  'Ballroom',
  'Lawns',
  'Plaza',
];

const TAGLINES = [
  'Where unforgettable moments come to life',
  'Timeless elegance for every celebration',
  'Premium spaces, flawless events',
  'Your event, perfected',
  'Luxury venues for life’s milestones',
  'Modern spaces with classic charm',
  'Celebrate in style and comfort',
  'A landmark address for grand occasions',
];

const STREETS = [
  'MG Road',
  'Park Street',
  'Banjara Hills',
  'Koramangala',
  'Andheri West',
  'Connaught Place',
  'Indiranagar',
  'Salt Lake',
  'Civil Lines',
  'Jubilee Hills',
];

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Vivaan', 'Diya', 'Aditya', 'Ishaan', 'Saanvi', 'Kabir',
  'Myra', 'Reyansh', 'Anika', 'Arjun', 'Kiara', 'Vihaan', 'Aadhya', 'Rohan',
  'Nisha', 'Karan', 'Priya', 'Rahul', 'Sneha', 'Aman', 'Pooja', 'Varun',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Mehta',
  'Singh', 'Rao', 'Kapoor', 'Joshi', 'Desai', 'Menon', 'Chopra', 'Bose',
];

function buildLocation(rng: () => number, city: string): VenueLocation {
  return {
    address: `${intBetween(rng, 1, 240)}, ${pick(rng, STREETS)}`,
    city,
    state: 'India',
    pincode: String(intBetween(rng, 110001, 689999)),
    lat: 12 + rng() * 16,
    lng: 72 + rng() * 16,
  };
}

function buildPackages(
  rng: () => number,
  category: EventCategory,
  basePrice: number,
): VenuePackage[] {
  const tiers = [
    { name: 'Essential', mult: 1, guest: 0, popular: false },
    { name: 'Premium', mult: 1.6, guest: 350, popular: true },
    { name: 'Luxe', mult: 2.4, guest: 650, popular: false },
  ];
  return tiers.map((t, i) => {
    const inclusions = pickMany(
      rng,
      [
        'Hall booking for selected slot',
        'Basic stage & seating',
        'Welcome drinks',
        'In-house catering (veg & non-veg)',
        'Floral stage decoration',
        'DJ & sound system',
        'Dedicated event manager',
        'Valet parking',
        'Premium lighting setup',
        'Bridal/green room access',
        'Customised menu tasting',
        'Photography corner',
      ],
      3 + i,
    );
    return {
      id: `pkg_${category}_${i}`,
      name: `${t.name} Package`,
      description:
        i === 0
          ? 'Everything you need to host a clean, well-run event.'
          : i === 1
            ? 'Our most-booked package with decor and catering included.'
            : 'The full premium experience, end to end.',
      pricePerEvent: round(basePrice * t.mult, 1000),
      pricePerGuest: t.guest,
      inclusions,
      popular: t.popular,
    };
  });
}

function buildOffer(rng: () => number, id: number): Offer | null {
  if (rng() > 0.45) return null;
  const discounts = [10, 15, 20, 25];
  const pct = pick(rng, discounts);
  return {
    id: `offer_${id}`,
    label: `${pct}% off this season`,
    discountPct: pct,
    code: `SAVE${pct}`,
    expiresAt: '2026-12-31',
  };
}

export function generateVenues(count: number): Venue[] {
  const venues: Venue[] = [];
  for (let i = 0; i < count; i++) {
    const rng = createRng(1000 + i);
    const category = CATEGORIES[i % CATEGORIES.length].id;
    const extraCats = pickMany(
      rng,
      CATEGORIES.map((c) => c.id).filter((c) => c !== category),
      intBetween(rng, 0, 2),
    );
    const city = pick(rng, CITIES);
    const name = `${pick(rng, VENUE_PREFIX)} ${pick(rng, VENUE_CORE)}`;
    const basePrice = round(intBetween(rng, 35000, 280000), 5000);
    const packages = buildPackages(rng, category, basePrice);
    const startingPrice = Math.min(...packages.map((p) => p.pricePerEvent));
    const capacityMin = intBetween(rng, 40, 150);
    const capacityMax = capacityMin + intBetween(rng, 150, 900);
    const rating = Number((3.6 + rng() * 1.4).toFixed(1));
    const reviewCount = intBetween(rng, 12, 480);
    const imgStart = i % VENUE_IMAGE_POOL.length;
    const images = Array.from({ length: 5 }, (_, k) => imageAt(imgStart + k));
    const availabilityRoll = rng();
    const availability =
      availabilityRoll > 0.8 ? 'booked' : availabilityRoll > 0.55 ? 'limited' : 'available';

    // A handful of upcoming dates marked unavailable for the calendar.
    const bookedDates = Array.from({ length: intBetween(rng, 2, 8) }, () => {
      const month = intBetween(rng, 6, 12);
      const day = intBetween(rng, 1, 28);
      return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });

    venues.push({
      id: `venue_${i + 1}`,
      name,
      tagline: pick(rng, TAGLINES),
      description: `${name} is a ${rating >= 4.5 ? 'premium' : 'well-appointed'} venue in ${city}, ideal for ${CATEGORIES.find((c) => c.id === category)?.label.toLowerCase()} and similar events. Spanning a capacity of up to ${capacityMax} guests, it combines elegant interiors, professional service and a prime location. Our team handles everything from setup to teardown so you can focus on your guests.`,
      category,
      categories: [category, ...extraCats],
      location: buildLocation(rng, city),
      images,
      rating,
      reviewCount,
      capacityMin,
      capacityMax,
      startingPrice,
      amenities: pickMany(rng, AMENITIES, intBetween(rng, 6, 11)),
      packages,
      offer: buildOffer(rng, i),
      availability,
      bookedDates,
      trending: rng() > 0.7,
      popular: rng() > 0.6,
      recommended: rng() > 0.5,
      cancellationPolicyId: rng() > 0.5 ? 'standard' : 'flexible',
      createdAt: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
    });
  }
  return venues;
}

export function generateUsers(count: number): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    const rng = createRng(5000 + i);
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    users.push({
      id: `user_${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      phone: `+91 ${intBetween(rng, 70000, 99999)}${intBetween(rng, 10000, 99999)}`,
      avatarUrl: AVATAR_POOL[i % AVATAR_POOL.length],
      createdAt: new Date(2024, i % 12, (i % 27) + 1).toISOString(),
      preferences: {
        preferredCity: pick(rng, CITIES),
        preferredCategories: pickMany(
          rng,
          CATEGORIES.map((c) => c.id),
          2,
        ),
        newsletter: rng() > 0.4,
        smsAlerts: rng() > 0.5,
        currency: 'INR',
      },
      savedVenueIds: [],
    });
  }
  return users;
}

const REVIEW_TITLES = [
  'Absolutely stunning venue',
  'Great experience, highly recommend',
  'Perfect for our event',
  'Beautiful space, professional staff',
  'Exceeded our expectations',
  'Good value for money',
  'Wonderful day, smooth coordination',
  'Lovely ambience',
];
const REVIEW_BODIES = [
  'The team was incredibly helpful from start to finish. The hall was spotless, decor was elegant and our guests kept complimenting the food. Would book again without hesitation.',
  'Spacious, well-maintained and centrally located. Parking was easy and the staff handled last-minute changes gracefully. A few minor delays with the AV setup but nothing major.',
  'We hosted around 300 guests and everything went smoothly. The lighting and sound were top notch. Highly recommend the Premium package — great value.',
  'Beautiful venue with a great view. The event manager was responsive and proactive. Catering was delicious. Only wish the green room was a little bigger.',
  'Clean, modern and professional. The booking process was simple and transparent. Our conference ran without a hitch thanks to the reliable Wi-Fi and projector.',
];

export function generateReviews(venues: Venue[], users: User[]): Review[] {
  const reviews: Review[] = [];
  let counter = 1;
  venues.forEach((venue, vi) => {
    const rng = createRng(9000 + vi);
    const num = intBetween(rng, 3, 7);
    for (let i = 0; i < num; i++) {
      const user = users[(vi + i) % users.length];
      const rating = Math.max(3, Math.min(5, Math.round(venue.rating + (rng() - 0.5))));
      const hasImages = rng() > 0.6;
      reviews.push({
        id: `review_${counter++}`,
        venueId: venue.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        rating,
        title: pick(rng, REVIEW_TITLES),
        body: pick(rng, REVIEW_BODIES),
        images: hasImages ? pickMany(rng, VENUE_IMAGE_POOL, intBetween(rng, 1, 3)) : [],
        createdAt: new Date(2025, intBetween(rng, 0, 11), intBetween(rng, 1, 27)).toISOString(),
        eventCategory: venue.category,
        helpfulCount: intBetween(rng, 0, 64),
      });
    }
  });
  return reviews;
}

const METHODS = ['card', 'upi', 'wallet'] as const;
const STATUSES: Booking['status'][] = ['confirmed', 'completed', 'cancelled'];

export function generateBookings(
  venues: Venue[],
  users: User[],
): { bookings: Booking[]; invoices: Invoice[] } {
  const bookings: Booking[] = [];
  const invoices: Invoice[] = [];
  for (let i = 0; i < 100; i++) {
    const rng = createRng(20000 + i);
    const venue = venues[i % venues.length];
    const user = users[i % users.length];
    const pkg = pick(rng, venue.packages);
    const guestCount = intBetween(rng, venue.capacityMin, venue.capacityMax);
    const status = pick(rng, STATUSES);
    const discountPct = venue.offer?.discountPct ?? 0;
    const pricing = calculatePricing({
      pkg,
      guestCount,
      category: venue.category,
      discountPct,
    });

    const month = status === 'completed' ? intBetween(rng, 1, 4) : intBetween(rng, 7, 12);
    const day = intBetween(rng, 1, 27);
    const eventDate = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const createdAt = new Date(2026, Math.max(0, month - 2), day).toISOString();
    const ref = `BMV${String(100000 + i)}`;
    const invoiceId = `inv_${i + 1}`;

    const payments: PaymentRecord[] = [];
    let paymentStatus: Booking['paymentStatus'] = 'unpaid';
    let refund: RefundRecord | null = null;

    if (status !== 'cancelled') {
      const method = pick(rng, METHODS);
      if (pricing.advanceEligible && rng() > 0.5 && status === 'confirmed') {
        payments.push({
          id: `pay_${i}_1`,
          bookingId: `booking_${i + 1}`,
          type: 'advance',
          method,
          amount: pricing.advanceAmount,
          status: 'success',
          reference: `TXN${intBetween(rng, 100000, 999999)}`,
          createdAt,
        });
        paymentStatus = 'advance_paid';
      } else {
        payments.push({
          id: `pay_${i}_1`,
          bookingId: `booking_${i + 1}`,
          type: 'full',
          method,
          amount: pricing.total,
          status: 'success',
          reference: `TXN${intBetween(rng, 100000, 999999)}`,
          createdAt,
        });
        paymentStatus = 'fully_paid';
      }
    } else {
      // Cancelled bookings carry a refund record.
      const refundPct = pick(rng, [100, 50, 25, 0]);
      const amountPaid = pricing.advanceAmount;
      paymentStatus = refundPct > 0 ? 'refunded' : 'fully_paid';
      payments.push({
        id: `pay_${i}_1`,
        bookingId: `booking_${i + 1}`,
        type: 'advance',
        method: pick(rng, METHODS),
        amount: amountPaid,
        status: 'success',
        reference: `TXN${intBetween(rng, 100000, 999999)}`,
        createdAt,
      });
      refund = {
        id: `refund_${i + 1}`,
        bookingId: `booking_${i + 1}`,
        amount: Math.round((amountPaid * refundPct) / 100),
        refundPct,
        reason: 'Customer cancelled booking',
        status: rng() > 0.5 ? 'completed' : 'processing',
        createdAt,
        expectedBy: eventDate,
      };
    }

    const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
    invoices.push({
      id: invoiceId,
      bookingId: `booking_${i + 1}`,
      number: `INV-2026-${String(1000 + i)}`,
      issuedAt: createdAt,
      breakdown: pricing,
      amountPaid,
      amountDue: paymentStatus === 'advance_paid' ? pricing.remainingAmount : 0,
    });

    bookings.push({
      id: `booking_${i + 1}`,
      reference: ref,
      venueId: venue.id,
      venueName: venue.name,
      venueImage: venue.images[0],
      venueCity: venue.location.city,
      userId: user.id,
      category: venue.category,
      packageId: pkg.id,
      packageName: pkg.name,
      eventDate,
      startTime: '18:00',
      endTime: '23:00',
      guestCount,
      status,
      paymentStatus,
      pricing,
      payments,
      invoiceId,
      refund,
      createdAt,
      cancellationPolicyId: venue.cancellationPolicyId,
    });
  }
  return { bookings, invoices };
}
