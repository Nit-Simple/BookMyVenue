import {
  ADVANCE_PCT,
  CANCELLATION_POLICY_MAP,
  isLargeEvent,
  SERVICE_CHARGE_PCT,
  TAX_PCT,
} from './constants';
import type {
  CancellationPolicy,
  CancellationTier,
  EventCategory,
  ISODateString,
  PriceBreakdown,
  Venue,
  VenuePackage,
} from '@/types';
import { differenceInHours, parseISO } from 'date-fns';

interface PricingInput {
  pkg: VenuePackage;
  guestCount: number;
  category: EventCategory;
  discountPct: number; // 0–100
}

/**
 * Compute a full price breakdown for a booking. Large events (wedding,
 * conference, corporate) allow a partial advance; small events require the
 * full amount. Mirrors the server-side calculation.
 */
export function calculatePricing({
  pkg,
  guestCount,
  category,
  discountPct,
}: PricingInput): PriceBreakdown {
  const venuePrice = pkg.pricePerEvent;
  const guestCharge = pkg.pricePerGuest * guestCount;
  const subtotal = venuePrice + guestCharge;
  const discount = Math.round((subtotal * discountPct) / 100);
  const taxable = subtotal - discount;
  const serviceCharge = Math.round(taxable * SERVICE_CHARGE_PCT);
  const tax = Math.round((taxable + serviceCharge) * TAX_PCT);
  const total = taxable + serviceCharge + tax;

  const advanceEligible = isLargeEvent(category);
  const advanceAmount = advanceEligible ? Math.round(total * ADVANCE_PCT) : total;
  const remainingAmount = total - advanceAmount;

  return {
    venuePrice,
    guestCharge,
    discount,
    serviceCharge,
    tax,
    total,
    advanceAmount,
    remainingAmount,
    advanceEligible,
  };
}

export function venueDiscountPct(venue: Venue): number {
  return venue.offer?.discountPct ?? 0;
}

export interface RefundCalculation {
  policy: CancellationPolicy;
  matchedTier: CancellationTier;
  hoursUntilEvent: number;
  refundPct: number;
  refundAmount: number;
  amountPaid: number;
}

/**
 * Determine the refund a customer receives when cancelling, based on the
 * venue's cancellation policy and how far ahead of the event they cancel.
 */
export function calculateRefund(
  policyId: string,
  eventDate: ISODateString,
  amountPaid: number,
  now: Date,
): RefundCalculation {
  const policy = CANCELLATION_POLICY_MAP[policyId] ?? CANCELLATION_POLICY_MAP.standard;
  const hoursUntilEvent = differenceInHours(parseISO(eventDate), now);

  // Tiers are ordered from most-to-least lead time; pick the first the user
  // still qualifies for, else the lowest tier (the policy's final fallback).
  const matchedTier =
    policy.tiers.find((t) => hoursUntilEvent >= t.hoursBefore) ??
    policy.tiers[policy.tiers.length - 1];

  const refundPct = matchedTier.refundPct;
  const refundAmount = Math.round((amountPaid * refundPct) / 100);

  return {
    policy,
    matchedTier,
    hoursUntilEvent,
    refundPct,
    refundAmount,
    amountPaid,
  };
}
