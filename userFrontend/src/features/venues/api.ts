import { api } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import type { AvailabilityCheckResult, Paginated, Review, Venue, VenueFilters } from '@/types';





interface BackendVenueListItem {
  venue_id: string;
  venue_name: string;
  city: string;
  district: string;
  state: string;
  primary_image?: string | null;
  price_per_hour?: number | null;
  weekend_price_per_hour?: number | null;
  currency?: string;
  created_at: string;
}

interface BackendVenueDetail {
  venue_id: string;
  venue_name: string;
  addressline_1: string;
  addressline_2?: string | null;
  city: string;
  district: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  seating_capacity: number;
  is_air_conditioned: boolean;
  venue_type: string;
  media: { url: string; primary: boolean; sort_order: number }[];
  pricing: { price_per_hour: number; is_weekend: boolean; currency: string }[];
  created_at: string;
}
const VENUE_TYPE_MAP: Record<string, Venue['category']> = {
  hall: 'meeting',
  banquet: 'wedding',
  auditorium: 'conference',
  lawn: 'wedding',
  cafe: 'meeting',
  studio: 'meeting',
  outdoor: 'birthday',
  party: 'birthday',
};

function mapVenueListItem(item: BackendVenueListItem): Venue {
  return {
    id: item.venue_id,
    name: item.venue_name,
    tagline: '',
    description: '',
    category: 'meeting',
    categories: [],
    location: { address: '', city: item.city || '', state: item.state || '', pincode: '', lat: 0, lng: 0 },
    images: item.primary_image ? [item.primary_image] : ['https://via.placeholder.com/400x300?text=No+Image'], rating: 0,
    reviewCount: 0,
    capacityMin: 0,
    capacityMax: 0,
    startingPrice: item.price_per_hour ?? 0,
    amenities: [],
    packages: [],
    offer: null,
    availability: 'available' as const,
    bookedDates: [],
    trending: false,
    popular: false,
    recommended: false,
    cancellationPolicyId: '',
    createdAt: item.created_at,
  };
}

function mapVenueDetail(item: BackendVenueDetail): Venue {
  return {
    id: item.venue_id,
    name: item.venue_name,
    tagline: '',
    description: '',
    category: VENUE_TYPE_MAP[item.venue_type] || 'meeting',
    categories: [],
    location: {
      address: item.addressline_1 + (item.addressline_2 ? ', ' + item.addressline_2 : ''),
      city: item.city,
      state: item.state,
      pincode: item.postal_code,
      lat: 0,
      lng: 0,
    },
    images: item.media.length > 0 ? item.media.map(m => m.url) : ['https://via.placeholder.com/400x300?text=No+Image'], rating: 0,
    reviewCount: 0,
    capacityMin: 0,
    capacityMax: item.seating_capacity,
    startingPrice: item.pricing?.[0]?.price_per_hour ?? 0,
    amenities: item.is_air_conditioned ? [{ id: 'ac', label: 'Air Conditioned', icon: 'snowflake' }] : [],
    packages: (item.pricing || []).map((p, i) => ({
      id: String(i),
      name: p.is_weekend ? 'Weekend' : 'Weekday',
      description: `${p.currency} ${p.price_per_hour}/hr`,
      pricePerEvent: p.price_per_hour,
      pricePerGuest: 0,
      inclusions: [],
      popular: false,
    })),
    offer: null,
    availability: 'available' as const,
    bookedDates: [],
    trending: false,
    popular: false,
    recommended: false,
    cancellationPolicyId: '',
    createdAt: item.created_at,
  };
}







function toParams(filters: VenueFilters): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params[k] = String(v);
  });
  return params;
}

export const venuesApi = {

  list: async (filters: VenueFilters): Promise<Paginated<Venue>> => {
    const { data } = await api.get<BackendVenueListItem[]>(endpoints.venues.list, {
      params: toParams(filters), realApi: true
    });
    const items = data.map(mapVenueListItem);
    return { items, page: 1, pageSize: items.length, total: items.length, totalPages: 1 };
  },


  detail: async (id: string): Promise<Venue> => {
    const { data } = await api.get<BackendVenueDetail>(
      endpoints.venues.detail(id),
      { realApi: true }
    );
    return mapVenueDetail(data);
  },


  async checkAvailability(
    venueId: string,
    startIso: string,
    endIso: string,
    guestCount: number,
  ): Promise<AvailabilityCheckResult> {
    const { data } = await api.get<AvailabilityCheckResult>(
      endpoints.venues.availability(venueId),
      {
        params: { start_time: startIso, end_time: endIso, guest_count: guestCount },
        realApi: true,
      },
    );
    return data;
  },

  reviews: async (id: string): Promise<Review[]> => {
    const { data } = await api.get<Review[]>(endpoints.venues.reviews(id));
    return data;
  },

  trending: async (): Promise<Venue[]> => {
    const { data } = await api.get<Venue[]>(endpoints.venues.trending);
    return data;
  },

  popular: async (): Promise<Venue[]> => {
    const { data } = await api.get<Venue[]>(endpoints.venues.popular);
    return data;
  },

  recommended: async (): Promise<Venue[]> => {
    const { data } = await api.get<Venue[]>(endpoints.venues.recommended);
    return data;
  },

  offers: async (): Promise<Venue[]> => {
    const { data } = await api.get<Venue[]>(endpoints.venues.offers);
    return data;
  },

  locations: async (): Promise<{ city: string; count: number; image: string }[]> => {
    const { data } = await api.get(endpoints.venues.locations);
    return data;
  },
};
