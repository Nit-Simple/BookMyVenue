import { api } from './axios';
import { endpoints } from './endpoints';
import type { Refund } from '@/types';

/**
 * Refunds service.
 *
 * TODO(backend): There is no manager-facing refund workflow. Refunds currently
 * happen automatically inside the customer's DELETE /bookings/:id (full amount).
 * There is no listing route and no approve/reject route. These call anticipated
 * endpoints served by the mock adapter.
 */
export const refundsApi = {
  async list(venueId: string): Promise<Refund[]> {
    const { data } = await api.get<Refund[]>(endpoints.refunds.list(venueId));
    return data ?? [];
  },

  async approve(venueId: string, id: string, note?: string): Promise<Refund> {
    const { data } = await api.post<Refund>(endpoints.refunds.approve(venueId, id), { note });
    return data;
  },

  async reject(venueId: string, id: string, note?: string): Promise<Refund> {
    const { data } = await api.post<Refund>(endpoints.refunds.reject(venueId, id), { note });
    return data;
  },
};
