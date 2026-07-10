import dayjs from 'dayjs';
import { api } from './axios';
import { endpoints } from './endpoints';
import type { CreatePricingItem, VenuePricing } from '@/types';

/**
 * Pricing service — REAL endpoints.
 *
 * MVP: a SINGLE BASE PRICE only. We model it as one non-weekend, open-ended
 * CreatePricingItem starting today. The service is deliberately shaped so a
 * future Plans module can post richer pricing rows without refactoring callers.
 */
export const pricingApi = {
  async getPricing(venueId: string): Promise<VenuePricing[]> {
    const { data } = await api.get<VenuePricing[]>(endpoints.venues.pricing(venueId));
    return data ?? [];
  },

  async setBasePrice(
    venueId: string,
    pricePerHour: number,
    currency = 'INR',
  ): Promise<VenuePricing> {
    const item: CreatePricingItem = {
      price_per_hour: pricePerHour,
      is_weekend: false,
      currency,
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: null,
    };
    const { data } = await api.post<VenuePricing>(endpoints.venues.pricing(venueId), item);
    return data;
  },
};

/** Extract the active base (non-weekend) price from a pricing list. */
export function selectBasePrice(pricing: VenuePricing[] | undefined): VenuePricing | undefined {
  return pricing?.find((p) => p.is_active && !p.is_weekend) ?? pricing?.[0];
}
