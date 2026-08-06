/**
 * Central registry of backend endpoint paths (relative to VITE_API_URL).
 *
 * ✅ REAL   — implemented by the Go/Gin backend.
 * 🟡 MOCK   — anticipated path; served by the mock adapter only. TODO(backend).
 */
export const endpoints = {
  auth: {
    register: '/auth/register', // ✅ REAL
    login: '/auth/login', // ✅ REAL
    refresh: '/auth/refresh', // ✅ REAL
    logout: '/auth/logout', // ✅ REAL
  },
  venues: {
    list: '/manager/venues', // ✅ REAL — venues owned by caller
    create: '/manager/venues', // ✅ REAL — multipart or JSON
    detail: (id: string) => `/manager/venues/${id}`, // ✅ REAL
    update: (id: string) => `/manager/venues/${id}`, // ✅ REAL (blocked only while REJECTED)
    applications: '/manager/venues/applications', // ✅ REAL
    pricing: (id: string) => `/manager/venues/${id}/pricing`, // ✅ REAL (GET + POST)
  },
  // 🟡 MOCK — none of the following have backend routes yet.
  dashboard: {
    analytics: (venueId: string) => `/manager/venues/${venueId}/analytics`, // TODO(backend)
  },
  calendar: {
    bookings: (venueId: string) => `/manager/bookings/venue/${venueId}`, // ✅ REAL
    maintenance: (venueId: string) => `/manager/venues/${venueId}/maintenance`, // TODO(backend)
    maintenanceItem: (venueId: string, id: string) =>
      `/manager/venues/${venueId}/maintenance/${id}`, // TODO(backend)
  },
  transactions: {
    list: (venueId: string) => `/manager/venues/${venueId}/transactions`, // TODO(backend)
    invoice: (venueId: string, txnId: string) =>
      `/manager/venues/${venueId}/transactions/${txnId}/invoice`, // TODO(backend)
  },
  refunds: {
    list: (venueId: string) => `/manager/venues/${venueId}/refunds`, // TODO(backend)
    approve: (venueId: string, id: string) =>
      `/manager/venues/${venueId}/refunds/${id}/approve`, // TODO(backend)
    reject: (venueId: string, id: string) =>
      `/manager/venues/${venueId}/refunds/${id}/reject`, // TODO(backend)
  },
  cancellationPolicy: {
    detail: (venueId: string) => `/manager/venues/${venueId}/cancellation-policy`, // TODO(backend)
  },
} as const;
