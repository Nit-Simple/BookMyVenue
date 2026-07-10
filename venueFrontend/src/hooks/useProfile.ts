import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/profile';
import { pricingApi } from '@/api/pricing';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateVenueRequest } from '@/types';

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.venues.applications(),
    queryFn: profileApi.listApplications,
  });
}

export function usePricing(venueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.venues.pricing(venueId ?? ''),
    queryFn: () => pricingApi.getPricing(venueId as string),
    enabled: !!venueId,
  });
}

export function useCreateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: CreateVenueRequest; files: File[] }) =>
      profileApi.createVenue(payload, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.venues.all });
    },
  });
}

export function useUpdateVenue(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CreateVenueRequest>) => profileApi.updateVenue(venueId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });
      qc.invalidateQueries({ queryKey: queryKeys.venues.list() });
    },
  });
}

export function useSetBasePrice(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ price, currency }: { price: number; currency: string }) =>
      pricingApi.setBasePrice(venueId, price, currency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.venues.pricing(venueId) });
      qc.invalidateQueries({ queryKey: queryKeys.venues.detail(venueId) });
      qc.invalidateQueries({ queryKey: queryKeys.venues.applications() });
    },
  });
}
