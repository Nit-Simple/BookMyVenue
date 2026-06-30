# Booking & Payment Lifecycle Plan

## 1. State Machines

### Booking States

```
                        ┌──────────────┐
                        │   PENDING    │  ← Created, awaiting payment
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         payment           payment          24h expiry
        captured           failed           (cron job)
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌────────┐      ┌──────────┐
        │CONFIRMED │     │CANCELLED│     │CANCELLED │
        └─────┬────┘     └────────┘      └──────────┘
              │
        ┌─────┴─────┐
        │           │
    end_time      cancel
    reached      (with/without
        │        refund logic)
        ▼           │
   ┌─────────┐      ▼
   │COMPLETED│ ┌──────────┐
   └─────────┘ │CANCELLED │
               └──────────┘
```

### Payment States

```
  ┌─────────┐
  │ PENDING │  ← Created alongside booking, linked to Razorpay order
  └────┬────┘
       │
  ┌────┴────┐
  │AUTHORIZED│  ← User completed payment on Razorpay (transient, rarely seen)
  └────┬────┘
       │
  ┌────┴──────┐
  │ CAPTURED  │  ← Webhook/callback confirmed capture
  └────┬──────┘
       │
  ┌────┴───────────┐
  │ REFUNDED       │  ← Full refund processed
  │PARTIALLY_REFUNDED│ ← Partial refund
  └────────────────┘
```

---

## 2. End-to-End Flows

### Flow A: Book → Pay → Confirm (happy path)

```
User                  Frontend               Backend                 Razorpay
 │                        │                     │                       │
 │  POST /bookings        │                     │                       │
 │  {venue_id, start,     │                     │                       │
 │   end, guest_count}    │                     │                       │
 │───────────────────────►├─ X-Idempotency-Key ─►                       │
 │                        │                     │                       │
 │                        │  1. Verify idempotency key (repo)           │
 │                        │  2. Check availability (bookingRepo)        │
 │                        │  3. Calculate amount from venue_pricing     │
 │                        │  4. Create booking → PENDING (bookingRepo)  │
 │                        │  5. Create Razorpay order (HTTP call) ──────►│
 │                        │                     │◄── order_xxx ─────────│
 │                        │  6. Create payment → PENDING (paymentRepo)  │
 │                        │  7. Store idempotency response              │
 │                        │◄── CreateBookingResponse ──────────────────│
 │◄── {booking_id, ───────┤                       │                    │
 │     order_id, key_id,  │                       │                    │
 │     amount}            │                       │                    │
 │                        │                       │                    │
 │  Razorpay Checkout     │                       │                    │
 │◄───────────────────────┤                       │                    │
 │  (user pays)           │                       │                    │
 │───────────────────────►├── callback ───────────►                    │
 │  {razorpay_payment_id, │  POST /bookings/:id/confirm               │
 │   razorpay_order_id,   │  X-Idempotency-Key    │                    │
 │   razorpay_signature}  │                       │                    │
 │                        │  1. Verify idempotency key                  │
 │                        │  2. Verify signature (local, no API call)   │
 │                        │  3. paymentRepo.UpdateToCaptured → CAPTURED │
 │                        │  4. bookingRepo.ConfirmBooking → CONFIRMED  │
 │                        │  5. Store idempotency response              │
 │◄── confirmed ──────────┤                       │                    │
 │                        │                       │                    │
 │  (webhook backup)      │                       │                    │
 │                        │                       │◄── payment.captured│
 │                        │                       │    (async webhook) │
 │                        │  POST /webhooks/razorpay                  │
 │                        │  1. Verify webhook signature               │
 │                        │  2. If already CAPTURED → skip (idempotent)│
 │                        │  3. Else UpdateToCaptured + ConfirmBooking │
```

### Flow B: Payment Failure

```
User                  Frontend               Backend
 │                        │                     │
 │  Razorpay Checkout     │                     │
 │  (payment fails)       │                     │
 │───────────────────────►│                     │
 │                        │  POST /bookings/:id/confirm  (or webhook)
 │                        │  {razorpay_error_code,    │
 │                        │   razorpay_order_id}      │
 │                        │  1. paymentRepo.UpdateToFailed → FAILED
 │                        │  2. booking stays PENDING
 │                        │  3. Return failure response
 │◄── failed ─────────────┤                     │
 │                        │                     │
 │  User retries          │                     │
 │  (same idempotency key)│                     │
 │───────────────────────►│  New payment attempt │
 │                        │  1. New Razorpay order
 │                        │  2. Update payment's razorpay_order_id
 │                        │  3. Retry checkout
```

### Flow C: Cancellation & Refund

```
User                  Frontend               Backend
 │                        │                     │
 │  DELETE /bookings/:id  │                     │
 │  {reason}              │                     │
 │───────────────────────►│                     │
 │                        │  1. Check booking exists + belongs to user
 │                        │  2. Check policy:
 │                        │     - PENDING → free cancel
 │                        │     - CONFIRMED → check time window
 │                        │  3. bookingRepo.UpdateStatus → CANCELLED
 │                        │  4. If payment was CAPTURED:
 │                        │     a. razorpayService.ProcessRefund(payment_id)
 │                        │     b. paymentRepo.UpdateRefund → REFUNDED
 │                        │  5. Return CancelBookingResponse
 │◄── cancelled ──────────┤                     │
```

### Flow D: Automatic Completion (cron)

```
Cron / Scheduler          Backend
 │                        │
 │  Every 5 min           │
 │  GET /admin/bookings/complete
 │                        │
 │  1. SELECT * FROM bookings
 │     WHERE status = 'CONFIRMED'
 │       AND end_time < NOW()
 │  2. For each: UPDATE status = 'COMPLETED'
```

### Flow E: Pending Expiry (cron)

```
Cron / Scheduler          Backend
 │                        │
 │  Every 15 min          │
 │  1. SELECT * FROM bookings
 │     WHERE status = 'PENDING'
 │       AND created_at < NOW() - INTERVAL '24 hours'
 │  2. For each: UPDATE status = 'CANCELLED'
 │                paymentRepo.UpdateToFailed (if applicable)
 │  3. DELETE FROM idempotency_keys WHERE expires_at < NOW()
```

---

## 3. Idempotency Integration

### Middleware Flow (`middlewares/idempotencyKey.go`)

```
Request with X-Idempotency-Key
           │
           ▼
  ┌─ Is key in DB? ──────┐
  │         │             │
  │       YES             NO
  │         │             │
  │    ┌────┴────┐        ▼
  │    │COMPLETE │   INSERT idempotency_keys
  │    └────┬────┘   status = PENDING
  │         │             │
  │    Replay cached      ▼
  │    response      Process normally
  │    (abort)             │
  │                   ┌────┴────┐
  │    ┌────────┐     │ Success │
  │    │PENDING │     └────┬────┘
  │    └───┬────┘          │
  │        │          UPDATE status
  │   409 Conflict     = COMPLETE,
  │   (abort)        response cached
  │                        │
  │                   Return response
  │
  Key points:
  - Required header for POST/PATCH/DELETE on booking & payment endpoints
  - SHA256(request_body) stored as request_hash to detect replay with different body
  - Expiry: 24 hours (configurable)
  - Cron job deletes expired keys
```

### Endpoints requiring idempotency:

| Method | Path | Why |
|---|---|---|
| POST | /api/v1/bookings | Prevent duplicate bookings |
| POST | /api/v1/bookings/:id/confirm | Prevent double-confirm on retry |
| POST | /api/v1/webhooks/razorpay | Razorpay retries webhooks |
| POST | /api/v1/manager/venues | Prevent duplicate venue submissions |

---

## 4. Price Calculation Logic

```
Request: venue_id, start_time, end_time

1. Determine if weekend (Saturday/Sunday)
2. Look up active pricing for venue:
     SELECT * FROM venue_pricing
     WHERE venue_id = $1
       AND is_weekend = $2    (based on booking date)
       AND is_active = true
       AND start_date <= $3   (booking date)
       AND (end_date IS NULL OR end_date >= $3)
3. Calculate hours = CEIL(end_time - start_time)  (round up to nearest hour)
4. Total = hours × price_per_hour
5. Convert to paise: amount_paise = Total × 100
```

---

## 5. Layer-by-Layer Breakdown

### Domain (already done — no changes needed)

| File | Status |
|---|---|
| `domain/bookings.go` | ✅ Full model, interface, request/response DTOs |
| `domain/payments.go` | ✅ Full model, interface, UpdatePaymentResult |
| `domain/razorpay.go` | ✅ Webhook, order request/response models |
| `domain/idempotency.go` | ✅ Full model + interface |
| `domain/errors.go` | ✅ All sentinel errors |

### Repository (already done — no changes needed)

| File | Status |
|---|---|
| `repository/bookings.go` | ✅ Full SQL — Create, GetByID, GetByUser, ConfirmBooking, UpdateStatus |
| `repository/payments.go` | ✅ Full SQL — Create, GetByID, GetByOrderID, UpdateToCaptured, UpdateToFailed, UpdateRefund, GetPaymentMetrics |
| `repository/idempotency.go` | ✅ Full SQL — GetByKey, Create, UpdateStatus, DeleteExpired |

### New — Razorpay Service

**File:** `internal/services/razorpayService/razorpay.go`

```go
type RazorpayService struct {
    keyID    string  // from config
    keySecret string // from config
    client   *http.Client
}

func (s *RazorpayService) CreateOrder(ctx, amount, currency, receipt, notes) → (*CreateOrderResponse, error)
func (s *RazorpayService) VerifySignature(orderID, paymentID, signature) → bool
func (s *RazorpayService) ProcessRefund(ctx, paymentID, amount) → (refundID, error)
func (s *RazorpayService) VerifyWebhookSignature(payload, signature, timestamp) → bool
```

### New — Booking Service

**File:** `internal/services/bookingService/booking.go`

```go
type BookingService struct {
    bookingRepo     domain.BookingRepository
    paymentRepo     domain.PaymentRepository
    venueRepo       domain.VenueRepository
    razorpaySvc     *razorpayService.RazorpayService
    idempotencyRepo domain.IdempotencyRepository
    cfg             *config.Config
}

// Core flows
func (s *BookingService) CreateBooking(ctx, userID, req) → (*CreateBookingResponse, error)
func (s *BookingService) ConfirmPayment(ctx, bookingID, orderID, paymentID, signature) → (*Booking, error)
func (s *BookingService) CancelBooking(ctx, bookingID, userID, reason) → (*CancelBookingResponse, error)

// Lookups
func (s *BookingService) GetBooking(ctx, bookingID) → (*Booking, error)
func (s *BookingService) ListUserBookings(ctx, userID, statuses, limit, offset) → ([]Booking, total, error)
func (s *BookingService) CheckAvailability(ctx, venueID, start, end) → (*AvailabilityCheckResponse, error)

// Price
func (s *BookingService) CalculatePrice(ctx, venueID, start, end) → (amount, currency, error)
```

### New — Idempotency Middleware (rewrite)

**File:** `internal/middlewares/idempotencyKey.go`

Change from no-op to full implementation:
```
IdempotencyKey(repo domain.IdempotencyRepository) gin.HandlerFunc
```

### New — Config Fields

**File:** `internal/config/config.go`

```go
RazorpayKeyID     string  // RAZORPAY_TEST_API_KEY
RazorpayKeySecret string  // RAZORPAY_TEST_API_SECRET
```

### New — Handler

**File:** `internal/handler/bookingHandler.go`

| Handler | Method | Path |
|---|---|---|
| `createBookingHandler` | POST | /api/v1/bookings |
| `confirmPaymentHandler` | POST | /api/v1/bookings/:id/confirm |
| `cancelBookingHandler` | DELETE | /api/v1/bookings/:id |
| `listBookingsHandler` | GET | /api/v1/bookings |
| `getBookingByIDHandler` | GET | /api/v1/bookings/:id |
| `razorpayWebhookHandler` | POST | /api/v1/webhooks/razorpay |
| `checkAvailabilityHandler` | GET | /api/v1/venues/:id/availability |

### Wiring Changes

| File | Change |
|---|---|
| `handler/server.go` | Add `bookingService` + `razorpayService` fields |
| `cmd/server/main.go` | Wire razorpaySvc → bookingSvc → NewServer |
| `handler/routes.go` | Add webhook route, add idempotency middleware to booking routes |

---

## 6. Build Order

```
Phase 1 — Foundation (no Razorpay API calls yet)
  1. Add RazorpayKeyID + RazorpayKeySecret to config
  2. Rewrite idempotency middleware (accept repo, full check/store/replay)
  3. Wire idempotencyRepo into middleware in routes.go

Phase 2 — Razorpay Service
  4. Create internal/services/razorpayService/razorpay.go
     - HTTP client with Basic Auth
     - CreateOrder, VerifySignature, VerifyWebhook

Phase 3 — Booking Service
  5. Create internal/services/bookingService/booking.go
     - CheckAvailability, CalculatePrice
     - CreateBooking (orchestrate booking + razorpay order + payment)
     - ConfirmPayment (verify + update payment + confirm booking)
     - CancelBooking (with refund logic)

Phase 4 — Handler
  6. Create internal/handler/bookingHandler.go
  7. Wire routes + idempotency middleware
  8. Wire main.go

Phase 5 — Cron Jobs
  9. Auto-complete CONFIRMED → COMPLETED
  10. Auto-cancel expired PENDING → CANCELLED
  11. Clean up expired idempotency keys
```
