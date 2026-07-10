import { api } from './axios';
import { endpoints } from './endpoints';
import type { Transaction } from '@/types';

/**
 * Transactions service.
 *
 * TODO(backend): There is no payments/transactions listing endpoint, nor an
 * invoice endpoint. The `Payment` model exists but is never returned as a list.
 * These call anticipated endpoints served by the mock adapter.
 */
export const transactionsApi = {
  async list(venueId: string): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>(endpoints.transactions.list(venueId));
    return data ?? [];
  },

  // TODO(backend): no invoice endpoint. When available, fetch a PDF blob here.
  async downloadInvoice(venueId: string, txnId: string): Promise<Blob> {
    const { data } = await api.get<Blob>(endpoints.transactions.invoice(venueId, txnId), {
      responseType: 'blob',
    });
    return data;
  },
};
