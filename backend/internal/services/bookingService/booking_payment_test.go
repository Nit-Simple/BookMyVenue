package bookingservice

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func capturedPayment() *domain.Payment {
	return &domain.Payment{
		ID:                uuid.New(),
		Status:            domain.PaymentStatusCaptured,
		RazorpayPaymentID: pgtype.Text{String: "pay_captured_1", Valid: true},
		RazorpayOrderID:   "order_1",
		Amount:            150000,
	}
}

func pendingPayment(bookingID uuid.UUID) *domain.Payment {
	return &domain.Payment{
		ID:              uuid.New(),
		BookingID:       bookingID,
		Status:          domain.PaymentStatusPending,
		RazorpayOrderID: "order_1",
		Amount:          150000,
	}
}

// --- ConfirmPayment ---

func TestConfirmPayment_Success(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true

	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}

	p := pendingPayment(bID)
	env.payment.orderResult = p
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: p.ID, Status: domain.PaymentStatusCaptured}}
	env.booking.confirmResult = &domain.Booking{ID: bID, Status: domain.BookingStatusConfirmed}

	confirmed, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if err != nil {
		t.Fatalf("ConfirmPayment error: %v", err)
	}
	if confirmed.Status != domain.BookingStatusConfirmed {
		t.Errorf("status = %s, want CONFIRMED", confirmed.Status)
	}
}

func TestConfirmPayment_InvalidSignature(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = false

	bID := uuid.New()
	_, err := env.svc.ConfirmPayment(context.Background(), bID.String(), uuid.New(), "order_1", "pay_1", "bad")
	if err == nil {
		t.Fatal("expected error for invalid signature")
	}
}

func TestConfirmPayment_IdempotentWhenAlreadyCaptured(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true

	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}

	// The webhook arrived before /confirm: payment is already CAPTURED and
	// UpdateToAuthorized reports it was not rotated.
	captured := capturedPayment()
	captured.BookingID = bID
	env.payment.orderResult = captured
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: false}
	env.booking.confirmResult = &domain.Booking{ID: bID, Status: domain.BookingStatusConfirmed}

	confirmed, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, captured.RazorpayOrderID, "pay_captured_1", "sig")
	if err != nil {
		t.Fatalf("ConfirmPayment error: %v", err)
	}
	if confirmed == nil || confirmed.Status != domain.BookingStatusConfirmed {
		t.Errorf("expected confirmed booking, got %+v", confirmed)
	}
}

func TestConfirmPayment_WrongUser(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true

	bID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: uuid.New(), Status: domain.BookingStatusPending}
	env.payment.orderResult = pendingPayment(bID)

	_, err := env.svc.ConfirmPayment(context.Background(), bID.String(), uuid.New(), "order_1", "pay_1", "sig")
	if err == nil {
		t.Fatal("expected error for booking owned by another user")
	}
}

func TestConfirmPayment_BookingNotFound(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true
	env.booking.getByIDResult = nil

	_, err := env.svc.ConfirmPayment(context.Background(), uuid.New().String(), uuid.New(), "order_1", "pay_1", "sig")
	if !errors.Is(err, domain.ErrBookingFailed) {
		t.Fatalf("error = %v, want ErrBookingFailed", err)
	}
}

// --- Capture sync on confirm (enables local refunds without the webhook) ---

func TestConfirmPayment_CaptureSync_ThenCancelRefunds(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true

	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}

	p := pendingPayment(bID)
	env.payment.orderResult = p
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: p.ID, Status: domain.PaymentStatusAuthorized}}
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{
		ID: p.ID, Status: domain.PaymentStatusCaptured,
		RazorpayPaymentID: pgtype.Text{String: "pay_captured_1", Valid: true},
		Amount:            150000,
	}}
	env.rz.fetchStatus = "captured"
	env.booking.confirmResult = &domain.Booking{
		ID: bID, UserID: userID, Status: domain.BookingStatusConfirmed,
		PaymentID: pgtype.UUID{Bytes: p.ID, Valid: true},
	}

	confirmed, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_captured_1", "sig")
	if err != nil {
		t.Fatalf("ConfirmPayment error: %v", err)
	}
	if confirmed.Status != domain.BookingStatusConfirmed {
		t.Fatalf("status = %s, want CONFIRMED", confirmed.Status)
	}
	if env.rz.fetchCalls != 1 {
		t.Errorf("FetchPayment called %d times, want 1", env.rz.fetchCalls)
	}

	// Now cancel — because capture was synced, the refund must fire for real.
	env.booking.getByIDResult = &domain.Booking{
		ID: bID, UserID: userID, Status: domain.BookingStatusConfirmed,
		PaymentID: pgtype.UUID{Bytes: p.ID, Valid: true},
	}
	env.booking.updateStatusResult = &domain.UpdateStatusResult{Updated: true, Booking: &domain.Booking{
		ID: bID, UserID: userID, Status: domain.BookingStatusCancelled,
		CancelledAt: pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}}
	env.payment.getByIDResult = &domain.Payment{
		ID: p.ID, Status: domain.PaymentStatusCaptured,
		RazorpayPaymentID: pgtype.Text{String: "pay_captured_1", Valid: true},
		Amount:            150000,
	}

	resp, err := env.svc.CancelBooking(context.Background(), bID.String(), userID, "changed my mind")
	if err != nil {
		t.Fatalf("CancelBooking error: %v", err)
	}
	if env.rz.refundCalls != 1 {
		t.Errorf("refund called %d times, want 1", env.rz.refundCalls)
	}
	if resp.RefundStatus != "PROCESSED" {
		t.Errorf("refund_status = %q, want PROCESSED", resp.RefundStatus)
	}
}

func TestConfirmPayment_CaptureSync_SkipsWhenAuthorized(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true

	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	p := pendingPayment(bID)
	env.payment.orderResult = p
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: p.ID, Status: domain.PaymentStatusAuthorized}}
	env.rz.fetchStatus = "authorized" // not captured yet
	env.booking.confirmResult = &domain.Booking{ID: bID, Status: domain.BookingStatusConfirmed}

	confirmed, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if err != nil {
		t.Fatalf("ConfirmPayment error: %v", err)
	}
	if confirmed.Status != domain.BookingStatusConfirmed {
		t.Fatalf("status = %s, want CONFIRMED", confirmed.Status)
	}
	if env.rz.fetchCalls != 1 {
		t.Errorf("FetchPayment called %d times, want 1", env.rz.fetchCalls)
	}
	if env.booking.confirmCalls != 1 {
		t.Errorf("confirm called %d times, want 1", env.booking.confirmCalls)
	}
}

func TestConfirmPayment_CaptureSync_FetchErrorIsNonFatal(t *testing.T) {
	env := newEnv()
	env.rz.signatureResult = true

	bID := uuid.New()
	userID := uuid.New()
	env.booking.getByIDResult = &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusPending}
	p := pendingPayment(bID)
	env.payment.orderResult = p
	env.payment.authorizedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: p.ID, Status: domain.PaymentStatusAuthorized}}
	env.rz.fetchErr = testErr
	env.booking.confirmResult = &domain.Booking{ID: bID, Status: domain.BookingStatusConfirmed}

	confirmed, err := env.svc.ConfirmPayment(context.Background(), bID.String(), userID, "order_1", "pay_1", "sig")
	if err != nil {
		t.Fatalf("ConfirmPayment error: %v", err)
	}
	if confirmed.Status != domain.BookingStatusConfirmed {
		t.Fatalf("status = %s, want CONFIRMED", confirmed.Status)
	}
	if env.rz.fetchCalls != 1 {
		t.Errorf("FetchPayment called %d times, want 1", env.rz.fetchCalls)
	}
}

// --- HandlePaymentCaptured ---

func TestHandlePaymentCaptured_UnknownOrder(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = nil

	if err := env.svc.HandlePaymentCaptured(context.Background(), "unknown", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 0 {
		t.Errorf("refund called %d times, want 0", env.rz.refundCalls)
	}
	if env.booking.confirmCalls != 0 {
		t.Errorf("confirm called %d times, want 0", env.booking.confirmCalls)
	}
}

func TestHandlePaymentCaptured_AlreadyCaptured(t *testing.T) {
	env := newEnv()
	env.payment.orderResult = capturedPayment()

	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 0 {
		t.Errorf("refund called %d times, want 0", env.rz.refundCalls)
	}
	if env.booking.confirmCalls != 0 {
		t.Errorf("confirm called %d times, want 0", env.booking.confirmCalls)
	}
}

func TestHandlePaymentCaptured_ConfirmSuccess(t *testing.T) {
	env := newEnv()
	captured := capturedPayment()
	env.payment.orderResult = pendingPayment(captured.BookingID)
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: captured.ID, Status: domain.PaymentStatusCaptured}}
	env.booking.confirmResult = &domain.Booking{ID: captured.BookingID, Status: domain.BookingStatusConfirmed}

	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.booking.confirmCalls != 1 {
		t.Errorf("confirm called %d times, want 1", env.booking.confirmCalls)
	}
	if env.rz.refundCalls != 0 {
		t.Errorf("refund called %d times, want 0", env.rz.refundCalls)
	}
}

func TestHandlePaymentCaptured_RefundOnUnconfirmable(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	env.payment.orderResult = pendingPayment(bID)
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{
		ID:                uuid.New(),
		Status:            domain.PaymentStatusCaptured,
		RazorpayPaymentID: pgtype.Text{String: "pay_captured_1", Valid: true},
		Amount:            150000,
	}}
	env.booking.confirmResult = nil // confirm fails
	env.booking.getByIDResult = &domain.Booking{ID: bID, Status: domain.BookingStatusCancelled} // not confirmable

	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_captured_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 1 {
		t.Errorf("refund called %d times, want 1", env.rz.refundCalls)
	}
	if env.rz.refundAmount != 150000 {
		t.Errorf("refund amount = %d, want 150000", env.rz.refundAmount)
	}
	if env.payment.refundCalls != 1 {
		t.Errorf("payment refund update called %d times, want 1", env.payment.refundCalls)
	}
}

func TestHandlePaymentCaptured_AlreadyConfirmedSkipsRefund(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	env.payment.orderResult = pendingPayment(bID)
	env.payment.capturedResult = &domain.UpdatePaymentResult{Updated: true, Payment: &domain.Payment{ID: uuid.New(), Status: domain.PaymentStatusCaptured}}
	env.booking.confirmResult = nil
	env.booking.getByIDResult = &domain.Booking{ID: bID, Status: domain.BookingStatusConfirmed}

	if err := env.svc.HandlePaymentCaptured(context.Background(), "order_1", "pay_1", nil); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.rz.refundCalls != 0 {
		t.Errorf("refund called %d times, want 0 (already confirmed)", env.rz.refundCalls)
	}
}

// --- CancelBooking ---

func TestCancelBooking_RefundsCapturedPayment(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()

	captured := capturedPayment()
	captured.ID = paymentID

	env.booking.getByIDResult = &domain.Booking{
		ID:        bID,
		UserID:    userID,
		Status:    domain.BookingStatusConfirmed,
		PaymentID: pgtype.UUID{Bytes: paymentID, Valid: true},
	}
	now := time.Now().UTC()
	env.booking.updateStatusResult = &domain.UpdateStatusResult{
		Updated: true,
		Booking: &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusCancelled, CancelledAt: pgtype.Timestamptz{Time: now, Valid: true}},
	}
	env.payment.getByIDResult = captured

	resp, err := env.svc.CancelBooking(context.Background(), bID.String(), userID, "changed my mind")
	if err != nil {
		t.Fatalf("CancelBooking error: %v", err)
	}
	if env.rz.refundCalls != 1 {
		t.Errorf("refund called %d times, want 1", env.rz.refundCalls)
	}
	if env.rz.refundAmount != 150000 {
		t.Errorf("refund amount = %d, want 150000", env.rz.refundAmount)
	}
	if env.payment.refundCalls != 1 {
		t.Errorf("payment refund update called %d times, want 1", env.payment.refundCalls)
	}
	if resp.RefundStatus != "PROCESSED" {
		t.Errorf("refund_status = %q, want PROCESSED", resp.RefundStatus)
	}
}

func TestCancelBooking_NoPayment_NoRefund(t *testing.T) {
	env := newEnv()
	bID := uuid.New()
	userID := uuid.New()

	env.booking.getByIDResult = &domain.Booking{
		ID:     bID,
		UserID: userID,
		Status: domain.BookingStatusPending,
	}
	env.booking.updateStatusResult = &domain.UpdateStatusResult{
		Updated: true,
		Booking: &domain.Booking{ID: bID, UserID: userID, Status: domain.BookingStatusCancelled},
	}

	resp, err := env.svc.CancelBooking(context.Background(), bID.String(), userID, "changed my mind")
	if err != nil {
		t.Fatalf("CancelBooking error: %v", err)
	}
	if env.rz.refundCalls != 0 {
		t.Errorf("refund called %d times, want 0", env.rz.refundCalls)
	}
	if resp.RefundStatus != "" {
		t.Errorf("refund_status = %q, want empty", resp.RefundStatus)
	}
}