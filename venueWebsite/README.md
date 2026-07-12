# BookMyVenue — Public Venue Website

Public marketing site + venue registration for partners. React 19 + TS + Vite,
sharing the design system of the other frontends.

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5175
```

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`.

## Backend & mock toggle

Backend: Go/Gin at `http://localhost:8081/api/v1`. Configure via `.env`:

```
VITE_USE_MOCK=true                          # in-browser mock adapter (default)
VITE_API_URL=http://localhost:8081/api/v1   # real backend base URL
```

Auth tokens are namespaced under `bmv_web_*`. On login the site hands the session
off to the venue portal (`http://localhost:5174`) by also writing the portal's
`bmv_venue_*` tokens and redirecting.

## Pages

Home · Why Join · Pricing (placeholder) · About · Contact · Register (6-step) ·
Registration Success · Venue Login · Forgot Password.

The logged-in experience (dashboard, profile, registration status) is **not**
rebuilt here — Venue Login redirects to the existing venue portal app.

## Module report

Legend: ✅ real backend route · 🟡 mock/placeholder, marked `// TODO(backend)`.

### Registration (core)
- **Flow:** 6 steps (Owner → Business → Venue → Amenities → Media → Review), RHF + Zod per step.
- **Endpoints:** `POST /auth/register` ✅ (forced `role:venue_manager`) → `POST /auth/login` ✅ → `POST /manager/venues` ✅ (multipart `data` + `media` files, **≥3 images** enforced).
- **DTOs:** `RegisterRequest`, `TokenResponse`, `CreateVenueRequest`.
- **Missing/TODO(backend):** business_name, GST/tax number, trade license, Google Maps URL, description, videos, and amenities beyond AC (only `is_air_conditioned` maps) have no backend field — collected for UX/future use and dropped from the payload. Base price isn't collected here (owner sets it in the portal). Logo/banner aren't stored separately — added to the gallery.

### Venue Login
- **Endpoint:** `POST /auth/login` ✅. On success writes `bmv_venue_*` tokens and redirects to the venue portal (`:5174`).

### Contact / Forgot Password
- 🟡 placeholders — no contact or forgot-password endpoints exist (`// TODO(backend)`).

### Marketing (Home / Why Join / Pricing / About)
- Static content with Framer Motion animations. Stats, testimonials and pricing figures are illustrative/mock.

## Verification
- `npm run typecheck`, `npm run lint`, `npm run build` — all clean.
- `npm run dev` boots on `:5175` and transforms modules.
- Mock path: complete the 6-step wizard → lands on the success page; login redirects to the portal.
