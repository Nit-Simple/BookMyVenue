import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancellationPolicyApi } from '@/api/cancellationPolicy';
import { queryKeys } from '@/constants/queryKeys';
import type { CancellationRule } from '@/types';

export function useCancellationPolicy(venueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cancellationPolicy.detail(),
    queryFn: () => cancellationPolicyApi.get(venueId as string),
    enabled: !!venueId,
  });
}

export function useSaveCancellationPolicy(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: CancellationRule[]) => cancellationPolicyApi.save(venueId, rules),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cancellationPolicy.detail() }),
  });
}
