# BookMyVenue — Venue Portal

The venue-manager portal for BookMyVenue. React 19 + TypeScript + Vite, sharing
the design language of the customer app (`../userFrontend`).

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5174
```

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`.

## Backend & mock toggle

The backend is the Go/Gin API at `http://localhost:8081/api/v1`. Configure via `.env`:

```
VITE_USE_MOCK=true                          # in-browser mock adapter (default)
VITE_API_URL=http://localhost:8081/api/v1   # real backend base URL
```

- `VITE_USE_MOCK=true` → an in-browser mock (`src/api/mockServer.ts`) serves every
  request with seeded data. Fully demoable with no backend running.
- `VITE_USE_MOCK=false` → all requests hit the real backend.

### What the real backend supports today

| Area | Status |
|------|--------|
| Auth (email/password, JWT + refresh, role `venue_manager`) | ✅ real |
| Venue profile (create / list / get / patch-while-pending) | ✅ real |
| Base price (`/manager/venues/:id/pricing`) | ✅ real |
| Applications / onboarding status | ✅ real |
| Dashboard analytics | ❌ mock — `// TODO(backend)` |
| Manager booking calendar & maintenance days | ❌ mock — `// TODO(backend)` |
| Transactions & invoices | ❌ mock — `// TODO(backend)` |
| Refund management (approve/reject) | ❌ mock — `// TODO(backend)` |
| Cancellation policy | ❌ mock — `// TODO(backend)` |

Every anticipated (unbacked) endpoint has a typed service call and a
`// TODO(backend)` marker. When a route ships, update the path in
`src/api/endpoints.ts` and turn off the mock — no component changes needed.

Notes: the backend has **no `/me` endpoint** (the user is derived from JWT
claims via `src/utils/jwt.ts`), and only **email/password** auth (no phone/OAuth).

## Structure

```
src/
  api/         axios instance + interceptors, mock server, endpoints, per-feature services
  components/  ui/ (reused design kit), common/, charts/, calendar/, profile/, policy/, refunds/
  context/     AuthContext + provider (React Context auth)
  hooks/       useAuth + TanStack Query hooks per module
  layouts/     AppLayout, Sidebar, Navbar
  pages/       one per route
  routes/      AppRouter, ProtectedRoute (role-gated)
  types/       backend-mirroring interfaces + enums
  utils/       cn, format (dayjs), jwt
  constants/   nav, query keys, status metadata
```

## MVP scope

Single **base price** only (one pricing row). No plans / day-wise / seasonal /
hikes / discounts — the pricing service and types are shaped so a Plans module
can be added later without refactoring.

---

## Module report

Legend: ✅ real backend route · 🟡 mock only (anticipated), marked `// TODO(backend)` at the call site.

### 1 · Auth
- **Endpoints:** `POST /auth/register` ✅ (forces `role:"venue_manager"`), `POST /auth/login` ✅, `POST /auth/refresh` ✅, `POST /auth/logout` ✅
- **DTOs:** `LoginRequest`, `RegisterRequest`, `TokenResponse` (`{access_token, refresh_token, expires_in}`)
- **Missing / TODO:** no `/me` endpoint → user derived from JWT claims (`utils/jwt.ts`); no phone/OAuth login (email/password only) — omitted with TODO
- **Integration notes:** React Context auth, single-flight 401 refresh-and-replay, auto-logout, persisted session, role-gated `ProtectedRoute`

### 2 · Dashboard
- **Endpoints:** 🟡 `GET /manager/venues/:id/analytics` — mock
- **DTOs:** `DashboardAnalytics`, `DashboardMetrics`, `MonthlyPoint`, `StatusSlice`, `ActivityItem`
- **Missing / TODO:** no analytics route (Go `PaymentMetrics`/`GetPaymentMetrics` exist but are unrouted)
- **Integration notes:** 8 stat cards, Recharts (revenue bar, booking-trend area, status pie), recent bookings/payments/upcoming, skeleton/empty/error states

### 3 · Profile
- **Endpoints:** `GET /manager/venues` ✅, `GET /manager/venues/:id` ✅, `POST /manager/venues` ✅ (multipart, ≥3 images), `PATCH /manager/venues/:id` ✅ (only while `PENDING_APPROVAL`), `GET /manager/venues/applications` ✅, `GET/POST /manager/venues/:id/pricing` ✅
- **DTOs:** `CreateVenueRequest`, `VenueDetail`, `VenueListItem`, `VenueMedia`, `VenuePricing`, `CreatePricingItem`, `VenueApplication`
- **Missing / TODO:** no Description column, no Tax-inclusive field, no standalone media add/replace/delete route (media editing disabled), no venue DELETE
- **Integration notes:** onboarding form vs edit/view; edit locked unless `PENDING_APPROVAL`; `venue_type` used as Category; base price = one `CreatePricingItem` (`is_weekend:false`, open-ended, starts today)

### 4 · Calendar
- **Endpoints:** 🟡 `GET /manager/venues/:id/bookings`, 🟡 `GET/POST /manager/venues/:id/maintenance`, 🟡 `DELETE .../maintenance/:id` — all mock
- **DTOs:** `VenueBooking`, `MaintenanceDay`, `BookingStatus`
- **Missing / TODO:** bookings API is customer-scoped only (repo `GetByVenueAndDateRange`/`GetVenueDailyBookings` unrouted); maintenance/blackout days have no model or route
- **Integration notes:** React Big Calendar (month/week/day), color-coded by status, booking-details drawer, maintenance dialog

### 5 · Transactions
- **Endpoints:** 🟡 `GET /manager/venues/:id/transactions`, 🟡 `GET .../transactions/:id/invoice` — mock
- **DTOs:** `Transaction`, `PaymentStatus`, `PaymentMethod`
- **Missing / TODO:** no payments-list route, no invoice route, no export route
- **Integration notes:** sortable table, search, status filter, client pagination; invoice download + export buttons stubbed with TODO

### 6 · Refunds
- **Endpoints:** 🟡 `GET /manager/venues/:id/refunds`, 🟡 `POST .../refunds/:id/approve`, 🟡 `POST .../refunds/:id/reject` — mock
- **DTOs:** `Refund`, `RefundTimelineEvent`, `RefundStatus`
- **Missing / TODO:** no manager refund workflow (refunds are automatic inside the customer's `DELETE /bookings/:id`)
- **Integration notes:** table + approve/reject (ConfirmDialog) + details drawer with timeline

### 7 · Cancellation Policy
- **Endpoints:** 🟡 `GET/PUT /manager/venues/:id/cancellation-policy` — mock (persists to localStorage)
- **DTOs:** `CancellationPolicy`, `CancellationRule` (`{hours_before, refund_percentage}`)
- **Missing / TODO:** no cancellation-policy model or route (cancellation currently just needs a reason; refund is always full)
- **Integration notes:** dynamic rule editor (add/edit/delete/reorder), Zod validation + dedupe, live preview

### 8 · Settings
- Modular placeholder cards, ready for future expansion. No settings endpoints exist yet (TODO).

## Verification status

- `npm run typecheck` — clean
- `npm run lint` — clean (0 errors, 0 warnings)
- `npm run build` — production build succeeds
- `npm run dev` — dev server boots on `:5174` and transforms modules

> Not yet exercised in a live browser click-through (mock login → dashboard render); validated via compilation and the build graph.
