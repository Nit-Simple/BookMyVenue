import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { adminApi, type VenueFilters } from '@/api/admin';
import { queryKeys } from '@/constants/queryKeys';
import type {
  AdminDashboardData,
  ApplicationStatus,
  CategorySlice,
  RegistrationTrendPoint,
  VenueListItem,
} from '@/types';

export function useAdminVenues(filters: VenueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.venues.list(filters as Record<string, string>),
    queryFn: () => adminApi.listVenues(filters),
  });
}

export function useApplications(status: ApplicationStatus) {
  return useQuery({
    queryKey: queryKeys.applications.list(status),
    queryFn: () => adminApi.listApplications(status),
  });
}

export function useApplicationDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id ?? ''),
    queryFn: () => adminApi.getApplication(id as string),
    enabled: !!id,
  });
}

export function useVenueDetail(venueId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'venue-detail', venueId],
    queryFn: () => adminApi.getVenueDetail(venueId as string),
    enabled: !!venueId,
    retry: false, // pending-venue detail may 404 on the real backend (no route)
  });
}

/** Approve / reject an application by id, then refresh venue + application caches. */
export function useApplicationDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      action === 'approve' ? adminApi.approve(id, notes) : adminApi.reject(id, notes ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.applications.all });
      qc.invalidateQueries({ queryKey: queryKeys.venues.all });
    },
  });
}

/**
 * Dashboard data. Counts are REAL (aggregated from /admin/venues by status and
 * /admin/applications). Bookings/revenue are mock. TODO(backend): dedicated
 * analytics endpoint.
 */
export function useAdminDashboard(): {
  data: AdminDashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.venues.list({ onboarding_status: 'PENDING_APPROVAL' }), queryFn: () => adminApi.listVenues({ onboarding_status: 'PENDING_APPROVAL' }) },
      { queryKey: queryKeys.venues.list({ onboarding_status: 'APPROVED' }), queryFn: () => adminApi.listVenues({ onboarding_status: 'APPROVED' }) },
      { queryKey: queryKeys.venues.list({ onboarding_status: 'REJECTED' }), queryFn: () => adminApi.listVenues({ onboarding_status: 'REJECTED' }) },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const [pending, approved, rejected] = results.map((r) => r.data ?? []);

  if (isLoading || isError) return { data: undefined, isLoading, isError };

  const all: VenueListItem[] = [...pending, ...approved, ...rejected];
  const today = dayjs();

  // Registrations & approvals trend over the last 6 months (derived).
  const registrationsTrend: RegistrationTrendPoint[] = Array.from({ length: 6 }).map((_, i) => {
    const m = today.subtract(5 - i, 'month');
    const regs = all.filter((v) => dayjs(v.created_at).isSame(m, 'month'));
    return {
      month: m.format('MMM'),
      registrations: regs.length,
      approvals: regs.filter((v) => v.onboarding_status === 'APPROVED').length,
    };
  });

  const categoryMap = new Map<string, number>();
  all.forEach((v) => {
    // venue_type isn't on the list item; approximate category from name suffix.
    const cat = v.venue_name.split(' ').slice(1).join(' ') || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  });
  const categories: CategorySlice[] = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const data: AdminDashboardData = {
    metrics: {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      suspended: 0, // TODO(backend): no SUSPENDED status
      today_registrations: all.filter((v) => dayjs(v.created_at).isSame(today, 'day')).length,
      total_bookings: 1240, // TODO(backend): mock
      total_revenue: 4820000, // TODO(backend): mock
    },
    registrationsTrend,
    categories,
    recent: [...all]
      .sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf())
      .slice(0, 6),
  };

  return { data, isLoading: false, isError: false };
}
