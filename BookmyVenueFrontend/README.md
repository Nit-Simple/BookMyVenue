# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


### Forntend stucture demo
frontend/
├── public/
├── src/
│   ├── api/                  # Axios instance + API calls
│   │   ├── axiosClient.js    # base config, interceptors, baseURL from env
│   │   ├── venues.js         # getVenues, getVenueById, etc.
│   │   ├── bookings.js       # createBooking, getBookings, cancelBooking
│   │   └── auth.js           # login, register, logout (if applicable)
│   │
│   ├── components/           # Reusable, dumb UI components
│   │   ├── ui/                # Buttons, Inputs, Modal, Spinner, Badge
│   │   ├── venue/              # VenueCard, VenueGallery, VenueFilterBar
│   │   └── booking/            # BookingForm, BookingSummary, DatePicker
│   │
│   ├── pages/                 # Route-level components
│   │   ├── Home.jsx
│   │   ├── VenueList.jsx
│   │   ├── VenueDetails.jsx
│   │   ├── BookingCheckout.jsx
│   │   ├── MyBookings.jsx
│   │   └── Login.jsx / Register.jsx
│   │
│   ├── layouts/                # Shared page shells
│   │   ├── MainLayout.jsx      # navbar + footer wrapper
│   │   └── AuthLayout.jsx
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useVenues.js        # wraps React Query for venues
│   │   ├── useBooking.js
│   │   └── useAuth.js
│   │
│   ├── context/                 # Global state (if needed beyond React Query)
│   │   └── AuthContext.jsx
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx        # all <Route> definitions live here
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   └── validators.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                 # Tailwind directives
│
├── .env                          # VITE_API_BASE_URL=http://localhost:8080
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── Dockerfile                    # multi-stage build → nginx
├── nginx.conf
└── package.json
