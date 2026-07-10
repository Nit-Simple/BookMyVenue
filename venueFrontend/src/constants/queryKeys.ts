/** Centralized TanStack Query key factories to keep cache invalidation consistent. */
export const queryKeys = {
  venues: {
    all: ['venues'] as const,
    list: () => ['venues', 'list'] as const,
    detail: (id: string) => ['venues', 'detail', id] as const,
    applications: () => ['venues', 'applications'] as const,
    pricing: (id: string) => ['venues', 'pricing', id] as const,
  },
  dashboard: {
    analytics: () => ['dashboard', 'analytics'] as const,
  },
  calendar: {
    bookings: (range: { start: string; end: string }) =>
      ['calendar', 'bookings', range] as const,
    maintenance: () => ['calendar', 'maintenance'] as const,
  },
  transactions: {
    list: () => ['transactions', 'list'] as const,
  },
  refunds: {
    list: () => ['refunds', 'list'] as const,
  },
  cancellationPolicy: {
    detail: () => ['cancellation-policy'] as const,
  },
};
