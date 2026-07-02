import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { ISODateString, ISODateTimeString } from '@/types';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format a number as Indian rupees, e.g. 125000 -> "₹1,25,000". */
export function formatCurrency(amount: number): string {
  return inr.format(Math.round(amount));
}

/** Compact rupee formatting for large numbers, e.g. 125000 -> "₹1.25L". */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatDate(value: ISODateString | ISODateTimeString): string {
  return format(parseISO(value), 'd MMM yyyy');
}

export function formatDateLong(value: ISODateString | ISODateTimeString): string {
  return format(parseISO(value), 'EEEE, d MMMM yyyy');
}

export function formatDateTime(value: ISODateTimeString): string {
  return format(parseISO(value), "d MMM yyyy 'at' h:mm a");
}

export function formatRelative(value: ISODateTimeString): string {
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
