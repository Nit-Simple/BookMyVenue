SER FRONTEND (:5173)
✅ Connected to Backend (7)
Endpoint	Frontend File	Method	Backend Route
/auth/login	auth/api.ts	POST	✅ exists
/auth/register	auth/api.ts	POST	✅ exists
/auth/logout	auth/api.ts	POST	✅ exists
/venues	venues/api.ts	GET	✅ exists
/venues/:id	venues/api.ts	GET	✅ exists
/bookings	booking/api.ts	GET	✅ exists
/bookings/:id	booking/api.ts	GET	✅ exists
/bookings (create)	booking/api.ts	POST	✅ exists
/bookings/:id/confirm	booking/api.ts	POST	✅ exists
/bookings/:id (cancel)	booking/api.ts	DELETE	✅ exists


🔗 Can Be Connected (Backend Exists, Not Connected)
Frontend Call	Current Route	Backend Route	Issue
bookingApi.pay	POST /bookings/:id/payments	POST /bookings/:id/confirm	Wrong path (payments vs confirm) + PayBalanceModal needs mock


❌ Mock Only (No Backend Endpoint)
Frontend Call	Route	Note
authApi.sendOtp	POST /auth/otp/send	No OTP flow in backend
authApi.verifyOtp	POST /auth/otp/verify	No OTP flow in backend
authApi.google	POST /auth/google	No Google auth
venuesApi.reviews	GET /venues/:id/reviews	No reviews module
venuesApi.trending	GET /venues/trending	No trending logic
venuesApi.popular	GET /venues/popular	No popular logic
venuesApi.recommended	GET /venues/recommended	No recommendations
venuesApi.offers	GET /venues/offers	No offers module
venuesApi.locations	GET /venues/locations	No locations endpoint
bookingApi.invoice	GET /bookings/:id/invoice	No invoice module
bookingApi.pay	POST /bookings/:id/payments	No standalone payments endpoint
reviewsApi.create	POST /reviews	No reviews module
profileApi.*	Various /profile/*	No profile endpoints
supportApi.*	Various /support/*	No support endpoints