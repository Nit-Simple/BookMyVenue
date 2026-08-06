package bookingservice

import (
	"context"
	"errors"
	"testing"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// --- HandlePaymentFailed ---

func TestHandlePaymentFailed_UnknownOrder(t *testing.T) {
	env := newEnv()
	env.payment.orderErr = testErr

	if err := env.svc.HandlePaymentFailed(context.Background(), "unknown", "declined"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.payment.failedCalls != 0 {
		t.Errorf("UpdateToFailed called %d times, want 0", env.payment.failedCalls)
	}
}

func TestHandlePaymentFailed_NoSuchOrder(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = nil
	if err := env.svc.HandlePaymentFailed(context.Background(), "unknown", "declined"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.payment.failedCalls != 0 {
		t.Errorf("UpdateToFailed called %d times, want 0", env.payment.failedCalls)
	}
}

func TestHandlePaymentFailed_AlreadyTerminal(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = capturedPayment() // CAPTURED is a terminal state
	if err := env.svc.HandlePaymentFailed(context.Background(), "order_1", "declined"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.payment.failedCalls != 0 {
		t.Errorf("UpdateToFailed called %d times, want 0 for terminal state", env.payment.failedCalls)
	}
}

func TestHandlePaymentFailed_Success(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = pendingPayment(uuid.New())
	if err := env.svc.HandlePaymentFailed(context.Background(), "order_1", "declined"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.payment.failedCalls != 1 {
		t.Errorf("UpdateToFailed called %d times, want 1", env.payment.failedCalls)
	}
}

func TestHandlePaymentFailed_UpdateError(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = pendingPayment(uuid.New())
	env.payment.failedErr = testErr
	if err := env.svc.HandlePaymentFailed(context.Background(), "order_1", "declined"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.payment.failedCalls != 1 {
		t.Errorf("UpdateToFailed called %d times, want 1", env.payment.failedCalls)
	}
}

func TestHandlePaymentFailed_UpdateNoRows(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = pendingPayment(uuid.New())
	env.payment.failedResult = &domain.UpdatePaymentResult{Updated: false}
	if err := env.svc.HandlePaymentFailed(context.Background(), "order_1", "declined"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.payment.failedCalls != 1 {
		t.Errorf("UpdateToFailed called %d times, want 1", env.payment.failedCalls)
	}
}

// --- ConfirmPayment sad paths ---

func TestConfirmPayment_GetByIDError(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	env.booking.getByIDErr = testErr
	if _, err := env.svc.ConfirmPayment(context.Background(), uuid.New().String(), uuid.New(), "order_1", "pay_1", "sig"); err == nil {
		t.Fatal("expected error when booking fetch fails")
	}
}

func TestConfirmPayment_PaymentMismatch(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(uuid.New()) // belongs to a different booking
	_, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if !errors.Is(err, domain.ErrPaymentUpdateConflict) {
		t.Fatalf("error = %v, want ErrPaymentUpdateConflict", err)
	}
}

func TestConfirmPayment_GetByOrderIDError(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderErr = testErr
	if _, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig"); err == nil {
		t.Fatal("expected error when payment fetch fails")
	}
}

func TestConfirmPayment_AuthorizeError(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(bID)
	env.payment.authorizedErr = testErr
	if _, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig"); err == nil {
		t.Fatal("expected error when authorization fails")
	}
}

func TestConfirmPayment_FallbackNotCaptured(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(bID)
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: false}
	// fallback payment is not captured
	_, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if !errors.Is(err, domain.ErrPaymentUpdateConflict) {
		t.Fatalf("error = %v, want ErrPaymentUpdateConflict", err)
	}
}

func TestConfirmPayment_ConfirmError(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(bID)
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: uuid.New(), Status: domain.PaymentStatusAuthorized}}
	env.booking.confirmErr = testErr
	if _, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig"); err == nil {
		t.Fatal("expected error when confirming booking fails")
	}
}

func TestConfirmPayment_ConfirmNil_NotConfirmed(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(bID)
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: uuid.New(), Status: domain.PaymentStatusAuthorized}}
	env.booking.confirmResult = nil // no row updated
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	_, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if !errors.Is(err, domain.ErrBookingConflict) {
		t.Fatalf("error = %v, want ErrBookingConflict", err)
	}
}

func TestConfirmPayment_ConfirmNil_AlreadyConfirmed(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(bID)
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: uuid.New(), Status: domain.PaymentStatusAuthorized}}
	env.booking.confirmResult = nil
	// re-fetch shows the booking is already confirmed (micro-race)
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusConfirmed}
	got, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil || got.Status != domain.BookingStatusConfirmed {
		t.Errorf("expected already-confirmed booking returned, got %+v", got)
	}
}

// --- CancelBooking sad paths ---

func TestCancelBooking_NotFound(t *testing.T) {
	env := newEnv()
	env.booking.getByIDResult = nil
	_, err := env.svc.CancelBooking(context.Background(), uuid.New().String(), uuid.New(), "no")
	if !errors.Is(err, domain.ErrBookingFailed) {
		t.Fatalf("error = %v, want ErrBookingFailed", err)
	}
}

func TestCancelBooking_WrongUser(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: uuid.New(), Status: domain.BookingStatusConfirmed}
	_, err := env.svc.CancelBooking(context.Background(), bID.String(), uuid.New(), "no")
	if err == nil {
		t.Fatal("expected error for wrong user")
	}
}

func TestCancelBooking_UpdateFailed(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusConfirmed}
	env.booking.updateStatusResult = &domain.UpdateStatusResult{Updated: false}
	_, err := env.svc.CancelBooking(context.Background(), bID.String(), userID, "no")
	if !errors.Is(err, domain.ErrBookingFailed) {
		t.Fatalf("error = %v, want ErrBookingFailed", err)
	}
}

func TestCancelBooking_RefundFailsOnce(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()
	captured := capturedPayment()
	captured.ID = paymentID
	env.booking.getByIDResult = &domain.Booking{
		ID: bID, UserID: userID, Status: domain.BookingStatusConfirmed,
		PaymentID: pgtype.UUID{Bytes: paymentID, Valid: true},
	}
	env.booking.updateStatusResult = &domain.UpdateStatusResult{Updated: true, Booking: &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusCancelled}}
	env.payment.getByIDResult = captured
	env.rz.refundErr = testErr
	resp, err := env.svc.CancelBooking(context.Background(), bID.String(), userID, "no")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 1 {
		t.Errorf("refund called %d times, want 1", env.rz.refundCalls)
	}
	if resp.RefundStatus != "FAILED" {
		t.Errorf("refund_status = %q, want FAILED", resp.RefundStatus)
	}
}

func TestCancelBooking_RefundUpdateFails(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()
	captured := capturedPayment()
	captured.ID = paymentID
	env.booking.getByIDResult = &domain.Booking{
		ID: bID, UserID: userID, Status: domain.BookingStatusConfirmed,
		PaymentID: pgtype.UUID{Bytes: paymentID, Valid: true},
	}
	env.booking.updateStatusResult = &domain.UpdateStatusResult{Updated: true, Booking: &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusCancelled}}
	env.payment.getByIDResult = captured
	env.payment.refundErr = testErr
	resp, err := env.svc.CancelBooking(context.Background(), bID.String(), userID, "no")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.RefundStatus != "PENDING" {
		t.Errorf("refund_status = %q, want PENDING", resp.RefundStatus)
	}
}

// --- HandlePaymentCaptured sad paths ---

func TestHandlePaymentCaptured_GetByOrderIDError(t *testing.T) {
	env := newEnv()
	env.payment.orderErr = testErr
	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.booking.confirmCalls != 0 {
		t.Errorf("confirm called %d times, want 0", env.booking.confirmCalls)
	}
}

func TestHandlePaymentCaptured_UpdateToCapturedError(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = pendingPayment(uuid.New())
	env.payment.capturedErr = testErr
	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.booking.confirmCalls != 0 {
		t.Errorf("confirm called %d times, want 0", env.booking.confirmCalls)
	}
}

func TestHandlePaymentCaptured_UpdateToCapturedNoRows(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = capturedPayment()
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: false}
	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.booking.confirmCalls != 0 {
		t.Errorf("confirm called %d times, want 0", env.booking.confirmCalls)
	}
}

func TestHandlePaymentCaptured_ConfirmError(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	env.payment.orderResult = pendingPayment(bID)
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: uuid.New(), Status: domain.PaymentStatusCaptured}}
	env.booking.confirmErr = testErr
	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 0 {
		t.Errorf("refund called %d times, want 0 (confirm error is swallowed)", env.rz.refundCalls)
	}
}

func TestHandlePaymentCaptured_RefundFailed(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	env.payment.orderResult = pendingPayment(bID)
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{
		ID:                uuid.New(),
		Status:            domain.PaymentStatusCaptured,
		RazorpayPaymentID: pgtype.Text{String: "pay_captured_1", Valid: true},
		Amount:            150000,
	}}
	env.booking.confirmResult = nil
	env.booking.getByIDResult = &domain.Booking{ID: bID, Status: domain.BookingStatusCancelled}
	env.rz.refundErr = testErr
	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_captured_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 1 {
		t.Errorf("refund called %d times, want 1", env.rz.refundCalls)
	}
	if env.payment.refundCalls != 0 {
		t.Errorf("refund update called %d times, want 0 (refund failed)", env.payment.refundCalls)
	}
}

// --- CreateBooking sad paths ---

func TestCreateBooking_InvalidVenueID(t *testing.T) {
	env := newEnv()
	start, end := futureSlot(2)
	req := &domain.BookNowRequest{VenueID: "not-a-uuid", StartTime: start, EndTime: end, GuestCount: 10}
	if _, err := env.svc.CreateBooking(context.Background(), uuid.New(), req); err == nil {
		t.Fatal("expected error for invalid venue id")
	}
	if env.booking.persistCalls != 0 {
		t.Error("must not persist on invalid venue id")
	}
}

func TestCreateBooking_VenueRepoError(t *testing.T) {
	env := newEnv()
	env.venue.err = testErr
	start, end := futureSlot(2)
	req := &domain.BookNowRequest{VenueID: uuid.NewString(), StartTime: start, EndTime: end, GuestCount: 10}
	if _, err := env.svc.CreateBooking(context.Background(), uuid.New(), req); err == nil {
		t.Fatal("expected error when venue fetch fails")
	}
}

func TestCreateBooking_EndBeforeStart(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	start, end := futureSlot(2)
	req := &domain.BookNowRequest{VenueID: env.venue.venue.VenueID.String(), StartTime: end, EndTime: start, GuestCount: 10}
	if _, err := env.svc.CreateBooking(context.Background(), uuid.New(), req); err == nil {
		t.Fatal("expected error when end_time before start_time")
	}
}

func TestCreateBooking_PricingError(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricingErr = testErr
	start, end := futureSlot(2)
	req := &domain.BookNowRequest{VenueID: env.venue.venue.VenueID.String(), StartTime: start, EndTime: end, GuestCount: 10}
	if _, err := env.svc.CreateBooking(context.Background(), uuid.New(), req); err == nil {
		t.Fatal("expected error when pricing fails")
	}
}

func TestCreateBooking_PersistError(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.pricing.pricing = weekdayPricing(1000)
	env.rz.orderID = "order_test_1"
	start, end := futureSlot(2)
	req := &domain.BookNowRequest{VenueID: env.venue.venue.VenueID.String(), StartTime: start, EndTime: end, GuestCount: 10}
	env.booking.persistErr = testErr
	if _, err := env.svc.CreateBooking(context.Background(), uuid.New(), req); err == nil {
		t.Fatal("expected error when CreateWithPayment fails")
	}
}

// --- CheckAvailability sad paths ---

func TestCheckAvailability_InvalidVenueID(t *testing.T) {
	env := newEnv()
	start, end := futureSlot(2)
	resp, err := env.svc.CheckAvailability(context.Background(), "not-a-uuid", start, end, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != "VENUE_NOT_FOUND" {
		t.Errorf("status = %q, want VENUE_NOT_FOUND", resp.Status)
	}
}

func TestCheckAvailability_OverlapQueryError(t *testing.T) {
	env := newEnv()
	env.venue.venue = baseVenue()
	env.booking.overlapErr = testErr
	start, end := futureSlot(2)
	_, err := env.svc.CheckAvailability(context.Background(), env.venue.venue.VenueID.String(), start, end, 10)
	if err == nil {
		t.Fatal("expected error when overlap check fails")
	}
}

// --- GetBooking / List* passthrough wrappers (coverage only) ---

func TestGetBooking(t *testing.T) {
	env := newEnv()
	got := &domain.Booking{ID: uuid.New(), Status: domain.BookingStatusConfirmed}
	env.booking.getByIDResult = got
	b, err := env.svc.GetBooking(context.Background(), got.ID.String())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if b.ID != got.ID {
		t.Errorf("id = %s, want %s", b.ID, got.ID)
	}
}

func TestGetBooking_InvalidID(t *testing.T) {
	env := newEnv()
	if _, err := env.svc.GetBooking(context.Background(), "not-a-uuid"); err == nil {
		t.Fatal("expected error for invalid booking id")
	}
}

func TestListUserBookings(t *testing.T) {
	env := newEnv()
	want := []*domain.Booking{{ID: uuid.New(), Status: domain.BookingStatusConfirmed}}
	env.booking.getByUserResult = want
	env.booking.getByUserTotal = 1
	got, total, err := env.svc.ListUserBookings(context.Background(), uuid.New(), nil, 10, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || total != 1 {
		t.Errorf("got %d bookings, total %d, want 1/1", len(got), total)
	}
}

func TestListManagerBookings(t *testing.T) {
	env := newEnv()
	env.booking.getByOwnerResult = []*domain.Booking{{ID: uuid.New(), Status: domain.BookingStatusConfirmed}}
	env.booking.getByOwnerTotal = 1
	got, total, err := env.svc.ListManagerBookings(context.Background(), uuid.New(), nil, 10, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || total != 1 {
		t.Errorf("got %d bookings, total %d, want 1/1", len(got), total)
	}
}

func TestListManagerUpcomingBookings(t *testing.T) {
	env := newEnv()
	env.booking.getUpcomingResult = []*domain.Booking{{ID: uuid.New(), Status: domain.BookingStatusConfirmed}}
	env.booking.getUpcomingTotal = 1
	got, total, err := env.svc.ListManagerUpcomingBookings(context.Background(), uuid.New(), 10, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || total != 1 {
		t.Errorf("got %d bookings, total %d, want 1/1", len(got), total)
	}
}

func TestListManagerOngoingBookings(t *testing.T) {
	env := newEnv()
	env.booking.getOngoingResult = []*domain.Booking{{ID: uuid.New(), Status: domain.BookingStatusConfirmed}}
	env.booking.getOngoingTotal = 1
	got, total, err := env.svc.ListManagerOngoingBookings(context.Background(), uuid.New(), 10, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || total != 1 {
		t.Errorf("got %d bookings, total %d, want 1/1", len(got), total)
	}
}

func TestListManagerVenueBookings(t *testing.T) {
	env := newEnv()
	env.booking.getVenueForManagerResult = []*domain.ManagerBookingItem{{ID: uuid.New()}}
	env.booking.getVenueForManagerTotal = 1
	got, total, err := env.svc.ListManagerVenueBookings(context.Background(), uuid.New(), uuid.New(), nil, 10, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 1 || total != 1 {
		t.Errorf("got %d items, total %d, want 1/1", len(got), total)
	}
}

func TestGetManagerBookingDetail(t *testing.T) {
	env := newEnv()
	env.booking.getManagerDetailResult = &domain.ManagerBookingDetail{ID: uuid.New()}
	d, err := env.svc.GetManagerBookingDetail(context.Background(), uuid.New(), uuid.New())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d == nil || d.ID == uuid.Nil {
		t.Errorf("expected a booking detail, got %+v", d)
	}
}