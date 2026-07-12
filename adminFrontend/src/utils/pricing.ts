import type { VenuePricing } from '@/types';

/** Extract the active base (non-weekend) price from a pricing list. */
export function selectBasePrice(pricing: VenuePricing[] | undefined): VenuePricing | undefined {
  return pricing?.find((p) => p.is_active && !p.is_weekend) ?? pricing?.[0];
}
