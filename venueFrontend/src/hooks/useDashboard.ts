import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { queryKeys } from '@/constants/queryKeys';

export function useDashboardAnalytics(venueId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.analytics(), venueId],
    queryFn: () => dashboardApi.getAnalytics(venueId as string),
    enabled: !!venueId,
  });
}
