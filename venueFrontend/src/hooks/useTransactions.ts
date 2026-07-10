import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions';
import { queryKeys } from '@/constants/queryKeys';

export function useTransactions(venueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transactions.list(),
    queryFn: () => transactionsApi.list(venueId as string),
    enabled: !!venueId,
  });
}
