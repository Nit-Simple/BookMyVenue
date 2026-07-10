import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { refundsApi } from '@/api/refunds';
import { queryKeys } from '@/constants/queryKeys';

export function useRefunds(venueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.refunds.list(),
    queryFn: () => refundsApi.list(venueId as string),
    enabled: !!venueId,
  });
}

export function useRefundAction(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
      action === 'approve'
        ? refundsApi.approve(venueId, id, note)
        : refundsApi.reject(venueId, id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.refunds.list() }),
  });
}
