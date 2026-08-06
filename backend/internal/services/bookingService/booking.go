package bookingservice

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"math/big"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// RazorpayProvider is the subset of the Razorpay gateway the booking flow needs.
// Abstracted so the service can be unit-tested without live HTTP calls; the
// concrete *razorpayService.RazorpayService satisfies it.
type RazorpayProvider interface {
	CreateOrder(ctx context.Context, req *domain.CreateOrderRequest) (*domain.CreateOrderResponse, error)
	VerifySignature(orderID, paymentID, signature string) bool
	ProcessRefund(ctx context.Context, paymentID string, amount int64) (string, error)
	FetchPayment(ctx context.Context, paymentID string) (*domain.RazorpayPayment, error)
}

type BookingService struct {
	bookingRepo      domain.BookingRepository
	paymentRepo      domain.PaymentRepository
	venueRepo        domain.VenueRepository
	venuePricingRepo domain.VenuePricingRepository
	razorpaySvc      RazorpayProvider
	idempotencyRepo  domain.IdempotencyRepository
	cfg              *config.Config
	logger           *slog.Logger
}

func NewBookingService(
	bookingRepo domain.BookingRepository,
	paymentRepo domain.PaymentRepository,
	venueRepo domain.VenueRepository,
	venuePricingRepo domain.VenuePricingRepository,
	razorpaySvc RazorpayProvider,
	idempotencyRepo domain.IdempotencyRepository,
	cfg *config.Config,
	logger *slog.Logger,
) *BookingService {
	return &BookingService{
		bookingRepo:      bookingRepo,
		paymentRepo:      paymentRepo,
		venueRepo:        venueRepo,
		venuePricingRepo: venuePricingRepo,
		razorpaySvc:      razorpaySvc,
		idempotencyRepo:  idempotencyRepo,
		cfg:              cfg,
		logger:           logger,
	}
}

func (s *BookingService) HandlePaymentCaptured(ctx context.Context, orderID, paymentID string, rawPayload json.RawMessage) error {
	payment, err := s.paymentRepo.GetByOrderID(ctx, orderID)
	if err != nil {
		s.logger.Error("booking: failed to fetch payment by order_id", "order_id", orderID, "error", err)
		return nil
	}
	if payment == nil {
		s.logger.Error("booking: webhook received for unknown order_id", "order_id", orderID)
		return nil
	}
	if payment.IsCaptured() {
		s.logger.Info("booking: payment already captured, skipping", "order_id", orderID, "payment_id", paymentID)
		return nil
	}

	result, err := s.paymentRepo.UpdateToCaptured(ctx, orderID, paymentID, rawPayload)
	if err != nil {
		s.logger.Error("booking: failed to update payment to captured", "order_id", orderID, "payment_id", paymentID, "error", err)
		return nil
	}
	if !result.Updated {
		s.logger.Warn("booking: update to captured returned no rows (race/duplicate)", "order_id", orderID)
		return nil
	}

	confirmed, err := s.bookingRepo.ConfirmBooking(ctx, payment.BookingID, payment.ID)
	if err != nil {
		s.logger.Error("booking: payment captured but failed to confirm booking",
			"order_id", orderID, "payment_id", paymentID,
			"booking_id", payment.BookingID, "error", err)
		return nil
	}
	if confirmed == nil {
		booking, err := s.bookingRepo.GetByID(ctx, payment.BookingID)
		if err != nil {
			s.logger.Error("booking: failed to fetch booking after capture", "booking_id", payment.BookingID, "error", err)
			return nil
		}
		if booking != nil && booking.Status == domain.BookingStatusConfirmed {
			s.logger.Info("booking: payment captured and booking already confirmed",
				"order_id", orderID, "booking_id", payment.BookingID)
			return nil
		}

		s.logger.Warn("booking: payment captured but booking cannot be confirmed, issuing refund",
			"order_id", orderID, "payment_id", paymentID, "booking_id", payment.BookingID)

		refundID, err := s.razorpaySvc.ProcessRefund(ctx, result.Payment.RazorpayPaymentID.String, int64(result.Payment.Amount))
		if err != nil {
			s.logger.Error("booking: refund failed after unconfirmable capture", "payment_id", result.Payment.ID, "error", err)
			return nil
		}
		if _, err := s.paymentRepo.UpdateRefund(ctx, result.Payment.ID, refundID, result.Payment.Amount, domain.PaymentStatusRefunded); err != nil {
			s.logger.Error("booking: refund update failed after unconfirmable capture", "payment_id", result.Payment.ID, "error", err)
			return nil
		}
		s.logger.Info("booking: payment refunded after unconfirmable capture",
			"order_id", orderID, "payment_id", paymentID, "booking_id", payment.BookingID)
		return nil
	}

	s.logger.Info("booking: payment captured and booking confirmed",
		"order_id", orderID, "payment_id", paymentID,
		"booking_id", payment.BookingID)
	return nil
}

func (s *BookingService) HandlePaymentFailed(ctx context.Context, orderID, reason string) error {
	payment, err := s.paymentRepo.GetByOrderID(ctx, orderID)
	if err != nil {
		s.logger.Error("booking: failed to fetch payment for failed webhook", "order_id", orderID, "error", err)
		return nil
	}
	if payment == nil {
		s.logger.Error("booking: failed webhook received for unknown order_id", "order_id", orderID)
		return nil
	}
	if payment.Status != domain.PaymentStatusPending && payment.Status != domain.PaymentStatusAuthorized {
		s.logger.Info("booking: payment already in terminal state, skipping failed update",
			"order_id", orderID, "status", payment.Status)
		return nil
	}

	result, err := s.paymentRepo.UpdateToFailed(ctx, orderID, reason)
	if err != nil {
		s.logger.Error("booking: failed to update payment to failed", "order_id", orderID, "error", err)
		return nil
	}
	if !result.Updated {
		s.logger.Warn("booking: update to failed returned no rows (already terminal)", "order_id", orderID)
		return nil
	}

	s.logger.Info("booking: payment marked as failed", "order_id", orderID, "reason", reason)
	return nil
}

func (s *BookingService) CreateBooking(ctx context.Context, userID uuid.UUID, req *domain.BookNowRequest) (*domain.CreateBookingResponse, error) {
	startTime := req.StartTime.UTC()
	endTime := req.EndTime.UTC()

	if !endTime.After(startTime) {
		return nil, fmt.Errorf("end_time must be after start_time")
	}

	venueID, err := uuid.Parse(req.VenueID)
	if err != nil {
		return nil, fmt.Errorf("invalid venue id: %w", err)
	}

	venue, err := s.venueRepo.GetVenueByID(ctx, venueID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch venue: %w", err)
	}
	if venue == nil {
		return nil, domain.ErrVenueNotFound
	}

	if venue.OnboardingStatus != domain.StatusApproved {
		return nil, domain.ErrVenueNotApproved
	}

	if !withinOperatingHours(venue.OpeningPeriod, venue.ClosingPeriod, startTime, endTime) {
		return nil, domain.ErrVenueOutsideOperatingHours
	}

	if !startTime.After(time.Now()) {
		return nil, domain.ErrBookingInPast
	}

	if endTime.Sub(startTime) < venue.MinBookingDuration {
		return nil, domain.ErrVenueMinDurationNotMet
	}

	if int(req.GuestCount) > venue.SeatingCapacity {
		return nil, domain.ErrGuestCountExceedsCapacity
	}

	amountPaise, currency, err := s.CalculatePrice(ctx, req.VenueID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate price: %w", err)
	}

	bookingID := uuid.New()
	booking := &domain.Booking{
		ID:        bookingID,
		VenueID:   venueID,
		UserID:    userID,
		StartTime: startTime,
		EndTime:   endTime,
		TotalAmount: pgtypeNumeric(amountPaise),
		Currency:    currency,
		GuestCount:  req.GuestCount,
		SpecialRequests: pgtypeText(req.SpecialRequests),
		Status:         domain.BookingStatusPending,
		BookingReference: generateBookingReference(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		ExpiresAt:  time.Now().Add(s.cfg.BookingPendingExpiry),
	}

	razorpayReq := &domain.CreateOrderRequest{
		Amount:   amountPaise,
		Currency: currency,
		Receipt:  booking.BookingReference,
		Notes: map[string]string{
			"booking_id": bookingID.String(),
		},
	}

	// Create the Razorpay order FIRST — it's an external side effect and can't
	// live inside a DB transaction. The booking and payment are then persisted
	// atomically (single tx) keyed to that order, so a failure can never leave
	// an orphaned PENDING booking holding a venue slot.
	razorpayOrder, err := s.razorpaySvc.CreateOrder(ctx, razorpayReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create razorpay order: %w", err)
	}

	payment := &domain.Payment{
		ID:              uuid.New(),
		BookingID:       bookingID,
		RazorpayOrderID: razorpayOrder.ID,
		Amount:          int32(amountPaise),
		Currency:        currency,
	}

	createResult, err := s.bookingRepo.CreateWithPayment(ctx, booking, payment)
	if err != nil {
		return nil, fmt.Errorf("failed to create booking: %w", err)
	}
	if !createResult.IsAvailable {
		return nil, domain.ErrVenueNotAvailableInTime
	}

	expiresAt := booking.ExpiresAt

	return &domain.CreateBookingResponse{
		BookingID:            bookingID.String(),
		BookingReference:     booking.BookingReference,
		VenueID:              req.VenueID,
		VenueName:            venue.VenueName,
		StartTime:            startTime,
		EndTime:              endTime,
		GuestCount:           req.GuestCount,
		TotalAmount:          fmt.Sprintf("%.2f", float64(amountPaise)/100),
		TotalAmountPaise:     amountPaise,
		Currency:             currency,
		Status:               string(domain.BookingStatusPending),
		RazorpayKeyID:        s.cfg.RazorpayKeyID,
		RazorpayOrderID:      razorpayOrder.ID,
		RazorpayPrefillEmail: "",
		RazorpayPrefillContact: "",
		ExpiresAt: expiresAt,
	}, nil
}

func (s *BookingService) ConfirmPayment(ctx context.Context, bookingID string, userID uuid.UUID, orderID, paymentID, signature string) (*domain.Booking, error) {
	if !s.razorpaySvc.VerifySignature(orderID, paymentID, signature) {
		return nil, fmt.Errorf("invalid razorpay signature")
	}

	bID, err := uuid.Parse(bookingID)
	if err != nil {
		return nil, fmt.Errorf("invalid booking id: %w", err)
	}

	booking, err := s.bookingRepo.GetByID(ctx, bID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch booking: %w", err)
	}
	if booking == nil {
		return nil, domain.ErrBookingFailed
	}
	if booking.UserID != userID {
		return nil, fmt.Errorf("booking does not belong to user")
	}

	payment, err := s.paymentRepo.GetByOrderID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch payment: %w", err)
	}
	if payment == nil || payment.BookingID != bID {
		return nil, domain.ErrPaymentUpdateConflict
	}

	result, err := s.paymentRepo.UpdateToAuthorized(ctx, orderID, paymentID, signature)
	if err != nil {
		return nil, fmt.Errorf("failed to authorize payment: %w", err)
	}

	authorized := result.Payment
	if !result.Updated {
		capturedPayment, err := s.paymentRepo.GetByOrderID(ctx, orderID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch payment: %w", err)
		}
		if capturedPayment == nil || !capturedPayment.IsCaptured() {
			return nil, domain.ErrPaymentUpdateConflict
		}
		authorized = capturedPayment
	}

	// Sync the real Razorpay capture state so a local checkout lands at CAPTURED
	// even when the payment.captured webhook can't reach the server. This is what
	// makes a later CancelBooking refund possible. Non-fatal: if the fetch or the
	// capture update fails, we still confirm the booking.
	if paymentID != "" {
		rzPayment, err := s.razorpaySvc.FetchPayment(ctx, paymentID)
		if err != nil {
			s.logger.Warn("booking: failed to fetch razorpay payment status on confirm", "payment_id", paymentID, "error", err)
		} else if rzPayment.Status == "captured" {
			if capResult, capErr := s.paymentRepo.UpdateToCaptured(ctx, orderID, paymentID, nil); capErr != nil {
				s.logger.Warn("booking: failed to sync captured payment on confirm", "order_id", orderID, "payment_id", paymentID, "error", capErr)
			} else if capResult != nil && capResult.Payment != nil {
				authorized = capResult.Payment
			}
		}
	}

	confirmed, err := s.bookingRepo.ConfirmBooking(ctx, bID, authorized.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm booking: %w", err)
	}
	if confirmed == nil {
		currentBooking, err := s.bookingRepo.GetByID(ctx, bID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch booking: %w", err)
		}
		if currentBooking != nil && currentBooking.Status == domain.BookingStatusConfirmed {
			return currentBooking, nil
		}
		return nil, domain.ErrBookingConflict
	}

	return confirmed, nil
}

func (s *BookingService) CancelBooking(ctx context.Context, bookingID string, userID uuid.UUID, reason string) (*domain.CancelBookingResponse, error) {
	id, err := uuid.Parse(bookingID)
	if err != nil {
		return nil, fmt.Errorf("invalid booking id: %w", err)
	}

	booking, err := s.bookingRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch booking: %w", err)
	}
	if booking == nil {
		return nil, domain.ErrBookingFailed
	}
	if booking.UserID != userID {
		return nil, fmt.Errorf("booking does not belong to user")
	}

	result, err := s.bookingRepo.UpdateStatus(ctx, id, domain.BookingStatusCancelled, reason, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel booking: %w", err)
	}
	if !result.Updated {
		return nil, domain.ErrBookingFailed
	}

	refundStatus := ""
	if booking.PaymentID.Valid {
		payment, err := s.paymentRepo.GetByID(ctx, booking.PaymentID.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch payment: %w", err)
		}
		if payment != nil && payment.IsCaptured() {
			refundID, err := s.razorpaySvc.ProcessRefund(ctx, payment.RazorpayPaymentID.String, int64(payment.Amount))
			if err != nil {
				s.logger.Error("booking: refund failed", "payment_id", payment.ID, "error", err)
				refundStatus = "FAILED"
			} else {
				_, err := s.paymentRepo.UpdateRefund(ctx, payment.ID, refundID, payment.Amount, domain.PaymentStatusRefunded)
				if err != nil {
					s.logger.Error("booking: refund update failed", "payment_id", payment.ID, "error", err)
					refundStatus = "PENDING"
				} else {
					refundStatus = "PROCESSED"
				}
			}
		}
	}

	return &domain.CancelBookingResponse{
		BookingID:          bookingID,
		Status:             string(domain.BookingStatusCancelled),
		CancelledAt:        result.Booking.CancelledAt.Time,
		CancellationReason: reason,
		RefundStatus:       refundStatus,
	}, nil
}

func (s *BookingService) GetBooking(ctx context.Context, bookingID string) (*domain.Booking, error) {
	id, err := uuid.Parse(bookingID)
	if err != nil {
		return nil, fmt.Errorf("invalid booking id: %w", err)
	}
	return s.bookingRepo.GetByID(ctx, id)
}

func (s *BookingService) ListUserBookings(ctx context.Context, userID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.Booking, int64, error) {
	return s.bookingRepo.GetByUser(ctx, userID, statuses, limit, offset)
}

func (s *BookingService) ListManagerBookings(ctx context.Context, ownerID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.Booking, int64, error) {
	return s.bookingRepo.GetByOwner(ctx, ownerID, statuses, limit, offset)
}

func (s *BookingService) ListManagerUpcomingBookings(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*domain.Booking, int64, error) {
	return s.bookingRepo.GetUpcomingByOwner(ctx, ownerID, limit, offset)
}

func (s *BookingService) ListManagerOngoingBookings(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*domain.Booking, int64, error) {
	return s.bookingRepo.GetOngoingByOwner(ctx, ownerID, limit, offset)
}

func (s *BookingService) ListManagerVenueBookings(ctx context.Context, venueID, ownerID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.ManagerBookingItem, int64, error) {
	return s.bookingRepo.GetVenueBookingsForManager(ctx, venueID, ownerID, statuses, limit, offset)
}

func (s *BookingService) GetManagerBookingDetail(ctx context.Context, bookingID, ownerID uuid.UUID) (*domain.ManagerBookingDetail, error) {
	return s.bookingRepo.GetManagerBookingDetail(ctx, bookingID, ownerID)
}

func (s *BookingService) CheckAvailability(ctx context.Context, venueID string, startTime, endTime time.Time, guestCount int32) (*domain.AvailabilityCheckResponse, error) {
	vid, err := uuid.Parse(venueID)
	if err != nil {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "VENUE_NOT_FOUND",
			Message:   "invalid venue id",
		}, nil
	}

	venue, err := s.venueRepo.GetVenueByID(ctx, vid)
	if err != nil || venue == nil {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "VENUE_NOT_FOUND",
			Message:   "venue not found",
		}, nil
	}

	if venue.OnboardingStatus != domain.StatusApproved {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "VENUE_NOT_FOUND",
			Message:   "venue not found",
		}, nil
	}

	if !endTime.After(startTime) {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "OUTSIDE_OPERATING_HOURS",
			Message:   "end_time must be after start_time",
		}, nil
	}

	if !withinOperatingHours(venue.OpeningPeriod, venue.ClosingPeriod, startTime, endTime) {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "OUTSIDE_OPERATING_HOURS",
			Message:   "requested time slot is outside the venue's operating hours",
		}, nil
	}

	if !startTime.After(time.Now()) {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "PAST_TIME",
			Message:   "booking start time cannot be in the past",
		}, nil
	}

	if endTime.Sub(startTime) < venue.MinBookingDuration {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "BELOW_MIN_DURATION",
			Message:   "booking duration is below the venue's minimum",
		}, nil
	}

	if guestCount > 0 && int(guestCount) > venue.SeatingCapacity {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "CAPACITY_EXCEEDED",
			Message:   "guest count exceeds the venue's seating capacity",
		}, nil
	}

	overlap, err := s.bookingRepo.CheckVenueOverlap(ctx, vid, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to check availability: %w", err)
	}
	if overlap {
		return &domain.AvailabilityCheckResponse{
			Available: false,
			Status:    "CONFLICT_EXISTS",
			Message:   "venue is already booked for the requested time slot",
		}, nil
	}

	return &domain.AvailabilityCheckResponse{
		Available: true,
		Status:    "AVAILABLE",
	}, nil
}

// withinOperatingHours reports whether the given time window falls entirely within
// the venue's opening/closing hours using wall-clock comparison (same-day only).
// Malformed stored hours fail open (treated as no restriction).
func withinOperatingHours(openingPeriod, closingPeriod string, startTime, endTime time.Time) bool {
	opening, err1 := time.Parse("15:04", openingPeriod)
	closing, err2 := time.Parse("15:04", closingPeriod)
	if err1 != nil || err2 != nil {
		return true
	}

	openingMin := opening.Hour()*60 + opening.Minute()
	closingMin := closing.Hour()*60 + closing.Minute()

	startMin := startTime.Hour()*60 + startTime.Minute()
	endMin := endTime.Hour()*60 + endTime.Minute()

	if endMin <= startMin {
		return false
	}
	if startMin < openingMin || endMin > closingMin {
		return false
	}
	return true
}

func (s *BookingService) CalculatePrice(ctx context.Context, venueID string, startTime, endTime time.Time) (int64, string, error) {
	vid, err := uuid.Parse(venueID)
	if err != nil {
		return 0, "", fmt.Errorf("invalid venue id: %w", err)
	}

	isWeekend := domain.IsWeekend(startTime)
	hours := domain.CalculateDurationHours(startTime, endTime)
	if hours < 1 {
		hours = 1
	}

	pricingList, err := s.venuePricingRepo.GetByVenue(ctx, vid, true)
	if err != nil {
		return 0, "", fmt.Errorf("failed to fetch pricing: %w", err)
	}

	var pricePerHour float64
	currency := "INR"
	found := false
	for _, p := range pricingList {
		if p.IsWeekend == isWeekend && p.IsActive {
			if startTime.Equal(p.StartDate) || startTime.After(p.StartDate) {
				if p.EndDate == nil || startTime.Before(*p.EndDate) || startTime.Equal(*p.EndDate) {
					pricePerHour = p.PricePerHour
					currency = p.Currency
					found = true
					break
				}
			}
		}
	}
	if !found {
		return 0, "", fmt.Errorf("no active pricing found for venue")
	}

	total := hours * pricePerHour
	amountPaise := int64(math.Round(total * 100))

	return amountPaise, currency, nil
}

func generateBookingReference() string {
	return "BKV" + time.Now().Format("20060102150405") + uuid.New().String()[:3]
}

func pgtypeNumeric(val int64) pgtype.Numeric {
	return pgtype.Numeric{Int: new(big.Int).SetInt64(val), Exp: 0, Valid: true}
}

func pgtypeText(val string) pgtype.Text {
	return pgtype.Text{String: val, Valid: val != ""}
}
