import { api } from './axios';
import { endpoints } from './endpoints';
import type { DashboardAnalytics } from '@/types';

/**
 * Dashboard analytics service.
 *
 * TODO(backend): There is NO analytics route. The Go backend has a
 * `PaymentMetrics` struct and a `GetPaymentMetrics` repo method, but they are
 * not wired to any HTTP handler. This calls an anticipated endpoint served by
 * the mock adapter. When the backend ships an analytics route, only the path in
 * `endpoints.dashboard.analytics` (and the response mapping, if it differs)
 * needs to change.
 */
export const dashboardApi = {
  async getAnalytics(venueId: string): Promise<DashboardAnalytics> {
    const { data } = await api.get<DashboardAnalytics>(endpoints.dashboard.analytics(venueId));
    return data;
  },
};
