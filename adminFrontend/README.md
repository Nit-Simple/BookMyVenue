# BookMyVenue — Admin Portal

Internal admin console for reviewing and actioning venue onboarding. React 19 + TS +
Vite, sharing the design system of the other frontends.

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5176
```

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`.

## Backend & mock toggle

Backend: Go/Gin at `http://localhost:8081/api/v1`. Configure via `.env`:

```
VITE_USE_MOCK=true                          # in-browser mock adapter (default)
VITE_API_URL=http://localhost:8081/api/v1   # real backend base URL
```

`VITE_USE_MOCK=false` sends every request to the real backend. To log in live, an
account with role `admin` must exist. Auth tokens are namespaced under `bmv_admin_*`
so this app coexists with the other frontends on localhost.

## Module report

Legend: ✅ real backend route · 🟡 mock only, marked `// TODO(backend)`.

### Auth
- **Endpoints:** `POST /auth/login` ✅ (token role must be `admin`), `/auth/refresh` ✅, `/auth/logout` ✅
- **Missing/TODO:** no admin register (intentional — internal only), no `/me` (user from JWT), no forgot/change password
- **Notes:** role-gated `ProtectedRoute` (requires `admin`); single-flight 401 refresh + auto-logout

### RBAC
- UI permission model (`usePermissions`) with sub-roles Super/Operations/Support/ReadOnly and a permission matrix; nav hidden by permission.
- **Missing/TODO:** backend only has a single `admin` role — every admin is treated as SUPER_ADMIN until granular claims exist.

### Dashboard
- **Endpoints:** counts DERIVED from `GET /admin/venues?onboarding_status=…` ✅ and `GET /admin/applications` ✅
- **Missing/TODO:** Suspended (no status), Today's registrations (derived from `created_at`), Bookings & Revenue (mock); no analytics endpoint
- **Notes:** charts (registrations/approvals trend, categories) derived from live venue data

### Venue Approvals (core)
- **Endpoints:** `GET /admin/applications` ✅ (status tabs), joined to `GET /admin/venues` ✅ for display; `PATCH /admin/applications/:id/approve` ✅ (`{notes?}`), `PATCH /admin/applications/:id/reject` ✅ (`{notes}` required)
- **DTOs:** `VenueApplication`, `VenueListItem`, `ApplicationDecisionResult`
- **Notes:** approve/reject key off `application_id`; client search/sort/pagination; owner_name is mock-enriched (list returns only `owner_id`)

### Venue Details
- **Endpoints:** `GET /admin/applications/:id` ✅ (metadata + timeline); `GET /admin/venues/:id` 🟡 for full detail
- **Missing/TODO:** no admin venue-detail route and public `GET /venues/:id` is APPROVED-only → full detail of pending venues is mock (page degrades to application-only if unavailable); Suspend 🟡; Documents (GST/license) not in venue model
- **Notes:** approve/reject/suspend actions with confirm dialogs; review timeline from `submitted_at`/`reviewed_at`

### Reports
- Registrations/approvals and categories DERIVED from `/admin/venues` ✅; Revenue placeholder 🟡. No reporting endpoint.

### Profile / Settings
- Profile from JWT; change-password 🟡 (no endpoint). Settings: dark-mode toggle (functional, Tailwind `class` strategy); notifications/language placeholders.

## Verification
- `npm run typecheck`, `npm run lint`, `npm run build` — all clean.
- `npm run dev` boots on `:5176` and transforms modules.
- Mock path: log in with any credentials → review queue, approve/reject updates status, dashboard counts + charts populate.
