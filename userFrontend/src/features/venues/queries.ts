import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { venuesApi } from './api';
import type { VenueFilters } from '@/types';

export const venueKeys = {
  all: ['venues'] as const,
  list: (filters: VenueFilters) => ['venues', 'list', filters] as const,
  detail: (id: string) => ['venues', 'detail', id] as const,
  reviews: (id: string) => ['venues', 'reviews', id] as const,
  collection: (name: string) => ['venues', 'collection', name] as const,
  locations: ['venues', 'locations'] as const,
  availability: (id: string, start: string, end: string) =>
    ['venues', 'availability', id, start, end] as const,
};

export function useVenueList(filters: VenueFilters) {
  return useQuery({
    queryKey: venueKeys.list(filters),
    queryFn: () => venuesApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useVenue(id: string | undefined) {
  return useQuery({
    queryKey: venueKeys.detail(id ?? ''),
    queryFn: () => venuesApi.detail(id!),
    enabled: !!id,
  });
}

export function useVenueReviews(id: string | undefined) {
  return useQuery({
    queryKey: venueKeys.reviews(id ?? ''),
    queryFn: () => venuesApi.reviews(id!),
    enabled: !!id,
  });
}


export function useAvailabilityCheck(
  venueId: string | undefined,
  range: { start: string; end: string } | null,
  guestCount: number,
) {
  return useQuery({
    queryKey: venueKeys.availability(venueId ?? '', range?.start ?? '', range?.end ?? ''),
    queryFn: () =>
      venuesApi.checkAvailability(venueId!, range!.start, range!.end, guestCount),
    enabled: !!venueId && !!range,
    retry: 1,
  });
}

export function useTrendingVenues() {
  return useQuery({ queryKey: venueKeys.collection('trending'), queryFn: venuesApi.trending });
}
export function usePopularVenues() {
  return useQuery({ queryKey: venueKeys.collection('popular'), queryFn: venuesApi.popular });
}
export function useRecommendedVenues() {
  return useQuery({ queryKey: venueKeys.collection('recommended'), queryFn: venuesApi.recommended });
}
export function useOfferVenues() {
  return useQuery({ queryKey: venueKeys.collection('offers'), queryFn: venuesApi.offers });
}
export function useTrendingLocations() {
  return useQuery({ queryKey: venueKeys.locations, queryFn: venuesApi.locations });
}
