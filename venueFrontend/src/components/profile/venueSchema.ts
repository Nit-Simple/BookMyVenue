import { z } from 'zod';
import type { CreateVenueRequest, VenueDetail } from '@/types';

export const venueSchema = z.object({
  venue_name: z.string().min(2, 'Venue name is required'),
  venue_type: z.string().min(1, 'Select a category'),
  description: z.string().max(1000).optional(), // TODO(backend): no description column yet
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().min(6, 'Enter a valid contact number'),
  phone_private: z.string().optional(),
  addressline_1: z.string().min(3, 'Address is required'),
  addressline_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(4, 'Postal code is required'),
  country_code: z.string().min(2).max(3),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  seating_capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  is_air_conditioned: z.boolean(),
  opening_period: z.string().min(1, 'Opening time is required'),
  closing_period: z.string().min(1, 'Closing time is required'),
  min_booking_duration: z.string().min(1),
  relaxation_period: z.string().min(1),
});

export type VenueFormValues = z.infer<typeof venueSchema>;

export const DEFAULT_VENUE_FORM: VenueFormValues = {
  venue_name: '',
  venue_type: '',
  description: '',
  email: '',
  phone: '',
  phone_private: '',
  addressline_1: '',
  addressline_2: '',
  city: '',
  district: '',
  state: '',
  postal_code: '',
  country_code: 'IN',
  latitude: '',
  longitude: '',
  seating_capacity: 50,
  is_air_conditioned: true,
  opening_period: '09:00',
  closing_period: '23:00',
  min_booking_duration: '2h',
  relaxation_period: '1h',
};

export function venueToForm(v: VenueDetail): VenueFormValues {
  return {
    venue_name: v.venue_name,
    venue_type: v.venue_type,
    description: '', // TODO(backend): not returned by API
    email: v.email,
    phone: v.phone,
    phone_private: v.phone_private ?? '',
    addressline_1: v.addressline_1,
    addressline_2: v.addressline_2 ?? '',
    city: v.city,
    district: v.district,
    state: v.state,
    postal_code: v.postal_code,
    country_code: v.country_code,
    latitude: v.latitude ?? '',
    longitude: v.longitude ?? '',
    seating_capacity: v.seating_capacity,
    is_air_conditioned: v.is_air_conditioned,
    opening_period: v.opening_period,
    closing_period: v.closing_period,
    min_booking_duration: v.min_booking_duration,
    relaxation_period: v.relaxation_period,
  };
}

/**
 * Map form values to the backend CreateVenueRequest. `description` is dropped —
 * the backend has no column for it (TODO(backend)). Media/pricing are attached
 * by the caller (create uses multipart; base price uses the pricing endpoint).
 */
export function formToCreatePayload(
  values: VenueFormValues,
): Omit<CreateVenueRequest, 'media' | 'pricing'> {
  const { description: _description, ...rest } = values;
  return {
    ...rest,
    addressline_2: rest.addressline_2 || undefined,
    phone_private: rest.phone_private || undefined,
    latitude: rest.latitude || undefined,
    longitude: rest.longitude || undefined,
  };
}
