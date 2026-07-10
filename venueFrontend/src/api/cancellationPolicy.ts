import { api } from './axios';
import { endpoints } from './endpoints';
import type { CancellationPolicy, CancellationRule } from '@/types';

/**
 * Cancellation policy service.
 *
 * TODO(backend): There is no cancellation-policy model or route. Cancellation
 * today just requires a reason string and always refunds the full amount. This
 * calls an anticipated endpoint served by the mock adapter (which persists to
 * localStorage). The backend "may return JSON or relational data" per the spec;
 * the UI handles a flat rules array either way.
 */
export const cancellationPolicyApi = {
  async get(venueId: string): Promise<CancellationPolicy> {
    const { data } = await api.get<CancellationPolicy>(
      endpoints.cancellationPolicy.detail(venueId),
    );
    return data;
  },

  async save(venueId: string, rules: CancellationRule[]): Promise<CancellationPolicy> {
    const { data } = await api.put<CancellationPolicy>(
      endpoints.cancellationPolicy.detail(venueId),
      { venue_id: venueId, rules },
    );
    return data;
  },
};
