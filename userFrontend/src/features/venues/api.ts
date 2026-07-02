import { api } from '@/api/axios';
import { endpoints } from '@/api/endpoints';
import type { Paginated, Review, Venue, VenueFilters } from '@/types';

function toParams(filters: VenueFilters): Record<string, string> {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params[k] = String(v);
  });
  return params;
}

export const venuesApi = {
  list: async (filters: VenueFilters): Promise<Paginated<Venue>> => {
    const { data } = await api.get<Paginated<Venue>>(endpoints.venues.list, {
      params: toParams(filters),
    });
    return data;
  },

  detail: async (id: string): Promise<Venue> => {
    const { data } = await api.get<Venue>(endpoints.venues.detail(id));
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
