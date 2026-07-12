/**
 * Admin API endpoint registry (relative to VITE_API_URL).
 * ✅ REAL — implemented by the Go/Gin backend.  🟡 MOCK — anticipated. TODO(backend).
 */
export const endpoints = {
  auth: {
    login: '/auth/login', // ✅ REAL (token role must be `admin`)
    refresh: '/auth/refresh', // ✅ REAL
    logout: '/auth/logout', // ✅ REAL
    // TODO(backend): no forgot-password / change-password endpoints.
  },
  admin: {
    venues: '/admin/venues', // ✅ REAL — filters: onboarding_status, state, district, owner_id (limit 50)
    applications: '/admin/applications', // ✅ REAL — query: status (default PENDING_REVIEW)
    application: (id: string) => `/admin/applications/${id}`, // ✅ REAL
    approve: (id: string) => `/admin/applications/${id}/approve`, // ✅ REAL — body {notes?}
    reject: (id: string) => `/admin/applications/${id}/reject`, // ✅ REAL — body {notes} required
    // 🟡 MOCK — no suspend / reports / dashboard-metrics routes exist.
    suspend: (venueId: string) => `/admin/venues/${venueId}/suspend`, // TODO(backend)
    dashboard: '/admin/dashboard', // TODO(backend)
    reports: '/admin/reports', // TODO(backend)
    venueDetail: (venueId: string) => `/admin/venues/${venueId}`, // TODO(backend): no pending-venue detail route
  },
} as const;
