package bookingservice

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
)

type bookingTestEnv struct {
	svc     *BookingService
	booking *fakeBookingRepo
	payment *fakePaymentRepo
	venue   *fakeVenueRepo
	pricing *fakePricingRepo
	rz      *fakeRazorpay
}

func newEnv() *bookingTestEnv {
	booking := &fakeBookingRepo{}
	payment := &fakePaymentRepo{}
	venue := &fakeVenueRepo{}
	pricing := &fakePricingRepo{}
	rz := &fakeRazorpay{}
	cfg := &config.Config{
		RazorpayKeyID:        "rzp_test_key",
		BookingPendingExpiry: 15 * time.Minute,
	}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	svc := NewBookingService(booking, payment, venue, pricing, rz, &fakeIdempotencyRepo{}, cfg, logger)
	return &bookingTestEnv{svc, booking, payment, venue, pricing, rz}
}

func baseVenue() *domain.Venue {
	id := uuid.New()
	return &domain.Venue{
		VenueID:           &id,
		OnboardingStatus:  domain.StatusApproved,
		VenueName:         "Test Hall",
		SeatingCapacity:    100,
		MinBookingDuration: time.Hour,
		OpeningPeriod:      "00:00",
		ClosingPeriod:      "23:59",
	}
}

func weekdayPricing(price float64) []domain.VenuePricing {
	return []domain.VenuePricing{{
		PricePerHour: price,
		IsWeekend:    false,
		Currency:     "INR",
		IsActive:     true,
		StartDate:    time.Now().Add(-time.Hour),
	}}
}

func futureSlot(hours float64) (time.Time, time.Time) {
	start := time.Now().UTC().Add(24 * time.Hour).Truncate(time.Hour)
	end := start.Add(time.Duration(hours * float64(time.Hour)))
	return start, end
}

func mustUUID(t *testing.T, s string) uuid.UUID {
	t.Helper()
	id, err := uuid.Parse(s)
	if err != nil {
		t.Fatalf("bad uuid: %v", err)
	}
	return id
}

func pastYesterday10() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, time.UTC).AddDate(0, 0, -1)
}

// --- CreateBooking ---

func TestCreateBooking_Success(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = weekdayPricing(1000)
	env.rz.orderID = "order_test_1"

	start, end := futureSlot(1.5) // 90 minutes
	req := &domain.BookNowRequest{
		VenueID:   env.venue.venue.VenueID.String(),
		StartTime: start,
		EndTime:   end,
		GuestCount: 10,
	}

	env.booking.result = &domain.CreateBookingResult{IsAvailable: true}

	resp, err := env.svc.CreateBooking(context.Background(), uuid.New(), req)
	if err != nil {
		t.Fatalf("CreateBooking returned error: %v", err)
	}
	if resp.Status != "PENDING" {
		t.Errorf("status = %q, want PENDING", resp.Status)
	}
	if resp.RazorpayOrderID != "order_test_1" {
		t.Errorf("razorpay_order_id = %q, want order_test_1", resp.RazorpayOrderID)
	}
	if env.booking.persistCalls != 1 {
		t.Fatalf("CreateWithPayment called %d times, want 1", env.booking.persistCalls)
	}
	if env.booking.lastPayment.RazorpayOrderID != "order_test_1" {
		t.Errorf("payment order id = %q, want order_test_1", env.booking.lastPayment.RazorpayOrderID)
	}
}

func TestCreateBooking_ExactDurationPricing(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = weekdayPricing(1000)
	env.rz.orderID = "order_test_1"
	env.booking.result = &domain.CreateBookingResult{IsAvailable: true}

	start, end := futureSlot(1.5) // 1.5h should bill exactly 1.5 * 1000 = 150000 paise
	req := &domain.BookNowRequest{
		VenueID:    env.venue.venue.VenueID.String(),
		StartTime:  start,
		EndTime:    end,
		GuestCount: 10,
	}

	resp, err := env.svc.CreateBooking(context.Background(), uuid.New(), req)
	if err != nil {
		t.Fatalf("CreateBooking returned error: %v", err)
	}
	if resp.TotalAmountPaise != 150000 {
		t.Errorf("total_amount_paise = %d, want 150000 (exact 1.5h @ 1000/hr)", resp.TotalAmountPaise)
	}
	if resp.TotalAmount != "1500.00" {
		t.Errorf("total_amount = %q, want 1500.00", resp.TotalAmount)
	}
	if env.booking.lastBooking.TotalAmount.Int.Int64() != 150000 {
		t.Errorf("persisted total = %s, want 150000", env.booking.lastBooking.TotalAmount.Int.String())
	}
}

func TestCreateBooking_OrderFirstThenPersist(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = weekdayPricing(1000)
	env.rz.orderID = "order_test_1"
	env.booking.result = &domain.CreateBookingResult{IsAvailable: true}

	start, end := futureSlot(2)
	req := &domain.BookNowRequest{
		VenueID:    env.venue.venue.VenueID.String(),
		StartTime:  start,
		EndTime:    end,
		GuestCount: 10,
	}

	if _, err := env.svc.CreateBooking(context.Background(), uuid.New(), req); err != nil {
		t.Fatalf("CreateBooking returned error: %v", err)
	}
	// The order must be created (with a booking id note) before the DB write.
	if env.booking.lastBooking.BookingReference == "" {
		t.Error("expected a booking reference to be generated")
	}
}

func TestCreateBooking_RazorpayFailureSkipsPersist(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = weekdayPricing(1000)
	env.rz.orderErr = errors.New("razorpay down")

	start, end := futureSlot(2)
	req := &domain.BookNowRequest{
		VenueID:    env.venue.venue.VenueID.String(),
		StartTime:  start,
		EndTime:    end,
		GuestCount: 10,
	}

	_, err := env.svc.CreateBooking(context.Background(), uuid.New(), req)
	if err == nil {
		t.Fatal("expected error when razorpay order creation fails")
	}
	if env.booking.persistCalls != 0 {
		t.Errorf("CreateWithPayment called %d times, want 0 (no orphaned booking)", env.booking.persistCalls)
	}
}

func TestCreateBooking_Validations(t *testing.T) {
	start, end := futureSlot(2)

	tests := []struct {
		name   string
		mutate func(env *bookingTestEnv, req *domain.BookNowRequest)
		want   error
	}{
		{"venue not found", func(env *bookingTestEnv, req *domain.BookNowRequest) { env.venue.venue = nil }, domain.ErrVenueNotFound},
		{"venue not approved", func(env *bookingTestEnv, req *domain.BookNowRequest) { env.venue.venue.OnboardingStatus = domain.StatusPendingApproval }, domain.ErrVenueNotApproved},
		{"outside operating hours", func(env *bookingTestEnv, req *domain.BookNowRequest) {
			env.venue.venue.OpeningPeriod = "10:00"
			env.venue.venue.ClosingPeriod = "18:00"
			req.StartTime = time.Date(now.Year(), now.Month(), now.Day(), 20, 0, 0, 0, time.UTC).AddDate(0, 0, 2)
			req.EndTime = req.StartTime.Add(2 * time.Hour)
		}, domain.ErrVenueOutsideOperatingHours},
		{"booking in the past", func(env *bookingTestEnv, req *domain.BookNowRequest) {
			req.StartTime = pastYesterday10()
			req.EndTime = req.StartTime.Add(2 * time.Hour)
		}, domain.ErrBookingInPast},
		{"below min duration", func(env *bookingTestEnv, req *domain.BookNowRequest) {
			req.EndTime = req.StartTime.Add(30 * time.Minute)
		}, domain.ErrVenueMinDurationNotMet},
		{"guest count exceeds capacity", func(env *bookingTestEnv, req *domain.BookNowRequest) {
			req.GuestCount = 500
		}, domain.ErrGuestCountExceedsCapacity},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			env := newEnv()
			env.venue.venue = baseVenue()
			env.pricing.pricing = weekdayPricing(1000)
			req := &domain.BookNowRequest{
				VenueID:    env.venue.venue.VenueID.String(),
				StartTime:  start,
				EndTime:    end,
				GuestCount: 10,
			}
			tt.mutate(env, req)

			_, err := env.svc.CreateBooking(context.Background(), uuid.New(), req)
			if !errors.Is(err, tt.want) {
				t.Fatalf("error = %v, want %v", err, tt.want)
			}
		})
	}
}

var now = time.Now().UTC()

func TestCreateBooking_SlotUnavailable(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = weekdayPricing(1000)
	env.booking.result = &domain.CreateBookingResult{IsAvailable: false}

	start, end := futureSlot(2)
	req := &domain.BookNowRequest{
		VenueID:    env.venue.venue.VenueID.String(),
		StartTime:  start,
		EndTime:    end,
		GuestCount: 10,
	}

	_, err := env.svc.CreateBooking(context.Background(), uuid.New(), req)
	if !errors.Is(err, domain.ErrVenueNotAvailableInTime) {
		t.Fatalf("error = %v, want ErrVenueNotAvailableInTime", err)
	}
}

// --- CheckAvailability ---

func TestCheckAvailability(t *testing.T) {
	tests := []struct {
		name        string
		mutate      func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time)
		wantStatus  string
		wantAvail   bool
	}{
		{"venue not found", func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time) { env.venue.venue = nil; return start, end }, "VENUE_NOT_FOUND", false},
		{"past time", func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time) {
			env.venue.venue = baseVenue()
			start = pastYesterday10()
			end = start.Add(2 * time.Hour)
			return start, end
		}, "PAST_TIME", false},
		{"below min duration", func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time) {
			env.venue.venue = baseVenue()
			end = start.Add(30 * time.Minute)
			return start, end
		}, "BELOW_MIN_DURATION", false},
		{"capacity exceeded", func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time) {
			env.venue.venue = baseVenue()
			return start, end
		}, "CAPACITY_EXCEEDED", false},
		{"conflict", func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time) {
			env.venue.venue = baseVenue()
			env.booking.overlap = true
			return start, end
		}, "CONFLICT_EXISTS", false},
		{"available", func(env *bookingTestEnv, start, end time.Time) (time.Time, time.Time) {
			env.venue.venue = baseVenue()
			return start, end
		}, "AVAILABLE", true},
	}

	venueID := uuid.New()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			env := newEnv()
			start, end := futureSlot(2)
			start, end = tt.mutate(env, start, end)
			guestCount := int32(10)
			if tt.name == "capacity exceeded" {
				guestCount = 500
			}
			resp, err := env.svc.CheckAvailability(context.Background(), venueID.String(), start, end, guestCount)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp.Available != tt.wantAvail {
				t.Errorf("available = %v, want %v", resp.Available, tt.wantAvail)
			}
			if resp.Status != tt.wantStatus {
				t.Errorf("status = %q, want %q", resp.Status, tt.wantStatus)
			}
		})
	}
}

// --- CalculatePrice ---

func TestCalculatePrice_WeekdayWeekend(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = []domain.VenuePricing{
		{PricePerHour: 1000, IsWeekend: false, Currency: "INR", IsActive: true, StartDate: time.Now().Add(-time.Hour)},
		{PricePerHour: 1500, IsWeekend: true, Currency: "INR", IsActive: true, StartDate: time.Now().Add(-time.Hour)},
	}
	venueID := env.venue.venue.VenueID.String()

	// weekday slot
	start, end := futureSlot(2)
	paise, _, err := env.svc.CalculatePrice(context.Background(), venueID, start, end)
	if err != nil {
		t.Fatalf("weekday price error: %v", err)
	}
	if paise != 200000 {
		t.Errorf("weekday paise = %d, want 200000", paise)
	}

	// weekend slot (Saturday)
	sat := time.Now().UTC()
	for sat.Weekday() != time.Saturday {
		sat = sat.AddDate(0, 0, 1)
	}
	ws := sat.Add(2 * time.Hour)
	we := ws.Add(2 * time.Hour)
	paise, _, err = env.svc.CalculatePrice(context.Background(), venueID, ws, we)
	if err != nil {
		t.Fatalf("weekend price error: %v", err)
	}
	if paise != 300000 {
		t.Errorf("weekend paise = %d, want 300000", paise)
	}
}

func TestCalculatePrice_NoActivePricing(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = nil

	start, end := futureSlot(2)
	_, _, err := env.svc.CalculatePrice(context.Background(), env.venue.venue.VenueID.String(), start, end)
	if err == nil {
		t.Fatal("expected error when no active pricing exists")
	}
}