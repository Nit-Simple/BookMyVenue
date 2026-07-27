VENUE MANAGER FRONTEND (:5174)
✅ Connected to Backend (10)
Frontend File	Call	Backend Route
auth.ts	login	POST /auth/login
auth.ts	register	POST /auth/register
auth.ts	logout	POST /auth/logout
profile.ts	listVenues	GET /manager/venues
profile.ts	createVenue	POST /manager/venues
profile.ts	getVenue	GET /manager/venues/:id
profile.ts	updateVenue	PATCH /manager/venues/:id
profile.ts	listApplications	GET /manager/venues/applications
pricing.ts	getPricing	GET /manager/venues/:id/pricing
pricing.ts	setBasePrice	POST /manager/venues/:id/pricing



🔗 Can Be Connected (Backend Exists, Not Connected)
Current Mock Route	Backend Route That Exists	Frontend Page
GET /manager/venues/:id/bookings	GET /manager/bookings/venue/:venue_id	Calendar
—	GET /manager/bookings	Calendar (all)
—	GET /manager/bookings/upcoming	Dashboard (upcoming)
—	GET /manager/bookings/ongoing	Dashboard (ongoing)
—	GET /manager/bookings/:booking_id	Booking detail view



❌ Mock Only (No Backend Endpoint)
Endpoint	Frontend File	Note
GET /manager/venues/:id/analytics	dashboard.ts	No analytics endpoint
GET/POST /manager/venues/:id/maintenance	calendar.ts	No maintenance model
DELETE /manager/venues/:id/maintenance/:id	calendar.ts	No maintenance model
GET /manager/venues/:id/transactions	transactions.ts	No transactions module
GET .../transactions/:id/invoice	transactions.ts	No invoice module
GET /manager/venues/:id/refunds	refunds.ts	No refunds module
POST .../refunds/:id/approve	refunds.ts	No refunds module
POST .../refunds/:id/reject	refunds.ts	No refunds module
GET/POST /manager/venues/:id/cancellation-policy	cancellationPolicy.ts	No cancellation policy module