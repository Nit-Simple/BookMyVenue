import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profile';
import { queryKeys } from '@/constants/queryKeys';

/** The manager's venues (list items). A manager can own several. */
export function useVenues() {
  return useQuery({
    queryKey: queryKeys.venues.list(),
    queryFn: profileApi.listVenues,
  });
}

/** Full detail for a single venue. */
export function useVenueDetail(venueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.venues.detail(venueId ?? ''),
    queryFn: () => profileApi.getVenue(venueId as string),
    enabled: !!venueId,
  });
}

/**
 * Convenience hook: resolves the manager's "primary" venue (the first one) and
 * its full detail. Most portal pages operate on a single active venue.
 */
export function useMyVenue() {
  const venuesQuery = useVenues();
  const primaryId = venuesQuery.data?.[0]?.venue_id;
  const detailQuery = useVenueDetail(primaryId);

  return {
    venueId: primaryId,
    venue: detailQuery.data,
    listItem: venuesQuery.data?.[0],
    hasVenue: !venuesQuery.isLoading && !!primaryId,
    isLoading: venuesQuery.isLoading || (!!primaryId && detailQuery.isLoading),
    isError: venuesQuery.isError || detailQuery.isError,
    refetch: () => {
      venuesQuery.refetch();
      detailQuery.refetch();
    },
  };
}
