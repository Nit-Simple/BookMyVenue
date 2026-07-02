import type { CategoryMeta, CancellationPolicy, EventCategory } from '@/types';

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'wedding',
    label: 'Wedding',
    description: 'Banquet halls & lawns for your big day',
    icon: 'Gem',
    scale: 'large',
  },
  {
    id: 'birthday',
    label: 'Birthday Party',
    description: 'Fun spaces for memorable celebrations',
    icon: 'Cake',
    scale: 'small',
  },
  {
    id: 'conference',
    label: 'Conference',
    description: 'Auditoriums & seminar halls',
    icon: 'Presentation',
    scale: 'large',
  },
  {
    id: 'corporate',
    label: 'Corporate Event',
    description: 'Premium venues for company events',
    icon: 'Building2',
    scale: 'large',
  },
  {
    id: 'meeting',
    label: 'Meeting Hall',
    description: 'Professional rooms for focused meetings',
    icon: 'Users',
    scale: 'small',
  },
];

export const CATEGORY_MAP: Record<EventCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<EventCategory, CategoryMeta>,
);

/** Event categories that allow paying an advance instead of the full amount. */
export const LARGE_EVENT_CATEGORIES: EventCategory[] = CATEGORIES.filter(
  (c) => c.scale === 'large',
).map((c) => c.id);

export function isLargeEvent(category: EventCategory): boolean {
  return LARGE_EVENT_CATEGORIES.includes(category);
}

export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Jaipur',
  'Ahmedabad',
  'Goa',
] as const;

// Pricing constants — mirror backend business rules.
export const SERVICE_CHARGE_PCT = 0.05; // 5% service charge
export const TAX_PCT = 0.18; // 18% GST
export const ADVANCE_PCT = 0.25; // 25% advance for large events

export const CANCELLATION_POLICIES: CancellationPolicy[] = [
  {
    id: 'standard',
    name: 'Standard Policy',
    tiers: [
      { hoursBefore: 168, refundPct: 100, label: '7+ days before event' },
      { hoursBefore: 72, refundPct: 50, label: '3–7 days before event' },
      { hoursBefore: 24, refundPct: 25, label: '24–72 hours before event' },
      { hoursBefore: 0, refundPct: 0, label: 'Within 24 hours' },
    ],
  },
  {
    id: 'flexible',
    name: 'Flexible Policy',
    tiers: [
      { hoursBefore: 72, refundPct: 100, label: '3+ days before event' },
      { hoursBefore: 24, refundPct: 75, label: '24–72 hours before event' },
      { hoursBefore: 0, refundPct: 50, label: 'Within 24 hours' },
    ],
  },
];

export const CANCELLATION_POLICY_MAP: Record<string, CancellationPolicy> =
  CANCELLATION_POLICIES.reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, CancellationPolicy>,
  );

export const TIME_SLOTS = [
  { value: '09:00-13:00', label: 'Morning (9 AM – 1 PM)', start: '09:00', end: '13:00' },
  { value: '14:00-18:00', label: 'Afternoon (2 PM – 6 PM)', start: '14:00', end: '18:00' },
  { value: '18:00-23:00', label: 'Evening (6 PM – 11 PM)', start: '18:00', end: '23:00' },
  { value: '09:00-23:00', label: 'Full Day (9 AM – 11 PM)', start: '09:00', end: '23:00' },
];
