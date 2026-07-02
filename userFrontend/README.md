# BookMyVenue — Customer Platform

A production-quality, **frontend-only** prototype of a venue discovery & booking
marketplace for end customers (think Airbnb / Booking.com for event venues).
No backend or database is required — a fully-featured mock API runs in the
browser. The data layer is designed to drop in a real **Go (Gin) + PostgreSQL**
backend with zero UI changes.

## Tech stack

- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS** (custom design system)
- **React Router DOM** (route-level code splitting)
- **TanStack Query** (server state) + **Zustand** (client state, persisted)
- **React Hook Form** + **Zod** (forms & validation)
- **Axios** (with a custom mock adapter)
- **Framer Motion** (animations) · **Lucide** (icons) · **Recharts** (ready for analytics)
- **PWA** (installable, offline page, service worker via `vite-plugin-pwa`)

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
```

### Demo credentials

The mock auth accepts **any email + a 6+ character password**. For phone login
the OTP is always **`123456`** (shown in a toast). Google login is simulated.

## How the mock backend works

Services call real Axios methods (`api.get('/venues')`, …). In development a
**custom Axios adapter** (`src/api/axios.ts`) routes those requests to an
in-browser request router (`src/api/mockServer.ts`) with realistic latency,
error responses, auth tokens and a refresh-token flow.

Catalog data (100 venues, 20 users, reviews) is generated deterministically
from a seed (`src/mock/`). User-driven mutations — bookings, payments, reviews,
support tickets, saved venues, profile edits — persist to `localStorage`, so
they survive refreshes.

**To go live against the real backend:** set `VITE_USE_MOCK=false` and point
`VITE_API_URL` at the Gin server. The endpoint paths live in
`src/api/endpoints.ts`; nothing else changes.

## Project structure

```
src/
├── app/                # providers, router, Zustand stores
├── api/                # axios instance, endpoints, mock server (the "backend")
├── components/
│   ├── ui/             # Button, Input, Modal, Drawer, Calendar, DatePicker, Badge, Toast…
│   └── layout/         # Header, Footer, MobileNavigation, AppLayout, InstallPrompt
├── features/
│   ├── auth/           # login (email / phone+OTP / Google), register
│   ├── venues/         # listing (filters, sort, grid/list), details, search, cards
│   ├── booking/        # multi-step flow, my-bookings, order details, cancellation
│   ├── payment/        # mock card / UPI / wallet payment + processing states
│   ├── profile/        # account, preferences, security, saved venues
│   ├── support/        # FAQ search, contact form, ticket status
│   ├── reviews/        # review list + write-review (with image upload UI)
│   └── home/           # hero search, categories, curated sections
├── hooks/ · utils/ · types/ · mock/
```

## Key features

- **Home** — hero multi-field search, category tiles, popular/trending/recommended/offer rails, trending cities.
- **Venue listing** — URL-synced filters (city, category, capacity, price, rating, offers), sort, grid/list toggle, pagination, skeletons & empty states.
- **Venue details** — image gallery + lightbox, amenities, packages, availability calendar, reviews with rating breakdown, sticky booking widget with live price calculation.
- **Booking flow** — 3 steps (details → payment → confirmation). Large events (wedding/conference/corporate) allow a 25% advance; small events require full payment.
- **Payments** — mock Card / UPI / Wallet with processing animation, success & failure handling (a toggle lets you trigger the failure path).
- **My bookings & order details** — tabs (upcoming/completed/cancelled), invoice breakdown, payment history, downloadable HTML invoice, pay-balance flow.
- **Cancellation** — dynamic refund calculation from the venue's policy and lead time, with refund status tracking.
- **Profile** — edit details, preferences, change password, saved venues.
- **Support** — searchable FAQs, ticket creation with status.
- **Reviews** — leave a rating, review and (simulated) photo uploads after a completed booking.
- **PWA** — installable with a custom prompt, offline fallback page, cached imagery.

## Pricing & business rules

Implemented in `src/utils/pricing.ts` and `src/utils/constants.ts`:
service charge 5%, GST 18%, advance 25% (large events only). Cancellation
tiers: Standard (100% / 50% / 25% / 0%) and Flexible policies.
