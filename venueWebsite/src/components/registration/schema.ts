import { z } from 'zod';

/**
 * Full registration schema. Fields marked "(not persisted)" have no home in the
 * backend venue model yet and are collected for UX / future use only.
 */
export const registrationSchema = z
  .object({
    // Step 1 — Owner
    full_name: z.string().min(2, 'Enter your full name'), // (not persisted: no owner-name field)
    owner_email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    owner_phone: z.string().min(8, 'Enter a valid phone number'),
    password: z.string().min(6, 'Min 6 characters').max(20, 'Max 20 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),

    // Step 2 — Business
    business_name: z.string().min(2, 'Business name is required'), // (not persisted)
    venue_name: z.string().min(2, 'Venue name is required'),
    venue_type: z.string().min(1, 'Select a category'),
    gst_number: z.string().optional(), // (not persisted)
    trade_license: z.string().optional(), // (not persisted)

    // Step 3 — Venue info
    addressline_1: z.string().min(3, 'Address is required'),
    addressline_2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    state: z.string().min(1, 'State is required'),
    country_code: z.string().min(2, 'Country is required').max(3),
    postal_code: z.string().min(4, 'Postal code is required'),
    google_maps_url: z.string().url('Enter a valid URL').optional().or(z.literal('')), // (not persisted)
    seating_capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
    description: z.string().max(1000).optional(), // (not persisted)
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type RegistrationValues = z.infer<typeof registrationSchema>;

/** Fields validated per step (for react-hook-form `trigger`). */
export const STEP_FIELDS: (keyof RegistrationValues)[][] = [
  ['full_name', 'owner_email', 'owner_phone', 'password', 'confirm_password'],
  ['business_name', 'venue_name', 'venue_type', 'gst_number', 'trade_license'],
  [
    'addressline_1',
    'addressline_2',
    'city',
    'district',
    'state',
    'country_code',
    'postal_code',
    'google_maps_url',
    'seating_capacity',
    'description',
  ],
  [], // Step 4 amenities — validated separately
  [], // Step 5 media — validated separately
  [], // Step 6 review
];

export const DEFAULT_REGISTRATION: RegistrationValues = {
  full_name: '',
  owner_email: '',
  owner_phone: '',
  password: '',
  confirm_password: '',
  business_name: '',
  venue_name: '',
  venue_type: '',
  gst_number: '',
  trade_license: '',
  addressline_1: '',
  addressline_2: '',
  city: '',
  district: '',
  state: '',
  country_code: 'IN',
  postal_code: '',
  google_maps_url: '',
  seating_capacity: 50,
  description: '',
};

export const AMENITIES = [
  'Parking',
  'Wifi',
  'AC',
  'Stage',
  'Catering',
  'Rooms',
  'Swimming Pool',
  'Outdoor',
  'Indoor',
  'Generator',
  'Projector',
  'Audio System',
] as const;

export type Amenity = (typeof AMENITIES)[number];
