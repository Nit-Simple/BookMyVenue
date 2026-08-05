ADMIN FRONTEND (:5176)
✅ Connected to Backend (7)
Frontend File	Call	Backend Route
auth.ts	login	POST /auth/login
auth.ts	logout	POST /auth/logout
admin.ts	listVenues	GET /admin/venues
admin.ts	listApplications	GET /admin/applications
admin.ts	getApplication	GET /admin/applications/:id
admin.ts	approve	PATCH /admin/applications/:id/approve
admin.ts	reject	PATCH /admin/applications/:id/reject


❌ Mock Only (No Backend Endpoint)
Endpoint	Frontend File	Note
GET /admin/venues/:id	admin.ts (getVenueDetail)	No pending-venue detail route
POST /admin/venues/:id/suspend	admin.ts (suspend)	No suspend endpoint/status
GET /admin/dashboard	endpoints.ts	No dashboard analytics endpoint
GET /admin/reports	endpoints.ts	No reports 