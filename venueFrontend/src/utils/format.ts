import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format a number as Indian rupees, e.g. 125000 -> "₹1,25,000". */
export function formatCurrency(amount: number, currency = 'INR'): string {
  if (currency !== 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }
  return inr.format(Math.round(amount));
}

/** Compact rupee formatting for large numbers, e.g. 125000 -> "₹1.25L". */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatDate(value: string | Date): string {
  return dayjs(value).format('D MMM YYYY');
}

export function formatDateLong(value: string | Date): string {
  return dayjs(value).format('dddd, D MMMM YYYY');
}

export function formatDateTime(value: string | Date): string {
  return dayjs(value).format('D MMM YYYY [at] h:mm A');
}

export function formatTimeRange(start: string | Date, end: string | Date): string {
  return `${dayjs(start).format('h:mm A')} – ${dayjs(end).format('h:mm A')}`;
}

export function formatRelative(value: string | Date): string {
  return dayjs(value).fromNow();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
