// Central registry of API endpoint paths. Keeping these in one place means the
// switch to the real Go/Gin backend only touches the base URL + this file.

export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    sendOtp: '/auth/otp/send',
    verifyOtp: '/auth/otp/verify',
    google: '/auth/google',
    refresh: '/auth/refresh',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  venues: {
    list: '/venues',
    detail: (id: string) => `/venues/${id}`,
    reviews: (id: string) => `/venues/${id}/reviews`,
    trending: '/venues/trending',
    popular: '/venues/popular',
    recommended: '/venues/recommended',
    offers: '/venues/offers',
    locations: '/venues/locations',
  },
  bookings: {
    list: '/bookings',
    create: '/bookings',
    detail: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    pay: (id: string) => `/bookings/${id}/payments`,
    invoice: (id: string) => `/bookings/${id}/invoice`,
        confirm: (id: string) => `/bookings/${id}/confirm`,  // ← NEW

  },
  reviews: {
    create: '/reviews',
  },
  profile: {
    get: '/profile',
    update: '/profile',
    changePassword: '/profile/password',
    saved: '/profile/saved',
    toggleSaved: (venueId: string) => `/profile/saved/${venueId}`,
  },
  support: {
    faqs: '/support/faqs',
    tickets: '/support/tickets',
    ticketDetail: (id: string) => `/support/tickets/${id}`,
  },
} as const;
