import { api } from './axios';
import { endpoints } from './endpoints';
import type {
  ApplicationDecisionResult,
  ApplicationStatus,
  OnboardingStatus,
  VenueApplication,
  VenueDetail,
  VenueListItem,
} from '@/types';

export interface VenueFilters {
  onboarding_status?: OnboardingStatus;
  state?: string;
  district?: string;
  owner_id?: string;
}

/**
 * Admin service — venue onboarding review.
 *
 * ✅ real: list venues, list/get applications, approve, reject.
 * 🟡 mock (TODO(backend)): full detail of a pending venue (no `/admin/venues/:id`;
 *    public detail is APPROVED-only), and suspend (no status/endpoint).
 */
export const adminApi = {
  async listVenues(filters: VenueFilters = {}): Promise<VenueListItem[]> {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await api.get<VenueListItem[]>(endpoints.admin.venues, { params });
    return data ?? [];
  },

  async listApplications(status: ApplicationStatus): Promise<VenueApplication[]> {
    const { data } = await api.get<VenueApplication[]>(endpoints.admin.applications, {
      params: { status },
    });
    return data ?? [];
  },

  async getApplication(id: string): Promise<VenueApplication> {
    const { data } = await api.get<VenueApplication>(endpoints.admin.application(id));
    return data;
  },

  async approve(applicationId: string, notes?: string): Promise<ApplicationDecisionResult> {
    const { data } = await api.patch<ApplicationDecisionResult>(
      endpoints.admin.approve(applicationId),
      { notes },
    );
    return data;
  },

  async reject(applicationId: string, notes: string): Promise<ApplicationDecisionResult> {
    const { data } = await api.patch<ApplicationDecisionResult>(
      endpoints.admin.reject(applicationId),
      { notes },
    );
    return data;
  },

  // TODO(backend): no pending-venue detail route — falls back to mock.
  async getVenueDetail(venueId: string): Promise<VenueDetail> {
    const { data } = await api.get<VenueDetail>(endpoints.admin.venueDetail(venueId));
    return data;
  },

  // TODO(backend): no suspend endpoint.
  async suspend(venueId: string): Promise<void> {
    await api.post(endpoints.admin.suspend(venueId), {});
  },
};
