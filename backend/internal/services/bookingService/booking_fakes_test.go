package bookingservice

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
)

var testErr = errors.New("boom")

// --- fakeRazorpay: implements RazorpayProvider ---

type fakeRazorpay struct {
	orderID        string
	orderErr       error
	createOrderCalls int

	refundID     string
	refundErr    error
	refundCalls  int
	refundAmount int64

	signatureResult bool

	fetchStatus string
	fetchErr    error
	fetchCalls  int
}

func (f *fakeRazorpay) CreateOrder(ctx context.Context, req *domain.CreateOrderRequest) (*domain.CreateOrderResponse, error) {
	if f.orderErr != nil {
		return nil, f.orderErr
	}
	return &domain.CreateOrderResponse{ID: f.orderID, Amount: req.Amount, Currency: req.Currency, Status: "created"}, nil
}

func (f *fakeRazorpay) FetchPayment(ctx context.Context, paymentID string) (*domain.RazorpayPayment, error) {
	f.fetchCalls++
	if f.fetchErr != nil {
		return nil, f.fetchErr
	}
	return &domain.RazorpayPayment{ID: paymentID, Status: f.fetchStatus, OrderID: "order_1", Amount: 150000}, nil
}

func (f *fakeRazorpay) VerifySignature(orderID, paymentID, signature string) bool {
	return f.signatureResult
}

func (f *fakeRazorpay) ProcessRefund(ctx context.Context, paymentID string, amount int64) (string, error) {
	f.refundCalls++
	f.refundAmount = amount
	if f.refundErr != nil {
		return "", f.refundErr
	}
	if f.refundID == "" {
		f.refundID = "rfp_" + paymentID
	}
	return f.refundID, nil
}

// --- fakeBookingRepo: implements domain.BookingRepository ---

type fakeBookingRepo struct {
	domain.BookingRepository // nil base; only overridden methods are used

	result       *domain.CreateBookingResult
	persistErr   error
	persistCalls int
	lastBooking  *domain.Booking
	lastPayment  *domain.Payment

	getByIDResult *domain.Booking
	getByIDErr    error

	overlap    bool
	overlapErr error

	confirmResult *domain.Booking
	confirmErr    error
	confirmCalls  int

	updateStatusResult *domain.UpdateStatusResult
	updateStatusErr    error

	getByUserResult []*domain.Booking
	getByUserTotal  int64
	getByUserErr    error

	getByOwnerResult []*domain.Booking
	getByOwnerTotal  int64
	getByOwnerErr    error

	getUpcomingResult []*domain.Booking
	getUpcomingTotal  int64
	getUpcomingErr    error

	getOngoingResult []*domain.Booking
	getOngoingTotal  int64
	getOngoingErr    error

	getVenueForManagerResult []*domain.ManagerBookingItem
	getVenueForManagerTotal  int64
	getVenueForManagerErr    error

	getManagerDetailResult *domain.ManagerBookingDetail
	getManagerDetailErr    error
}

func (f *fakeBookingRepo) CreateWithPayment(ctx context.Context, booking *domain.Booking, payment *domain.Payment) (*domain.CreateBookingResult, error) {
	f.persistCalls++
	f.lastBooking = booking
	f.lastPayment = payment
	if f.persistErr != nil {
		return nil, f.persistErr
	}
	return f.result, f.persistErr
}

func (f *fakeBookingRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Booking, error) {
	return f.getByIDResult, f.getByIDErr
}

func (f *fakeBookingRepo) CheckVenueOverlap(ctx context.Context, venueID uuid.UUID, start, end time.Time) (bool, error) {
	return f.overlap, f.overlapErr
}

func (f *fakeBookingRepo) GetByUser(ctx context.Context, userID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.Booking, int64, error) {
	return f.getByUserResult, f.getByUserTotal, f.getByUserErr
}

func (f *fakeBookingRepo) GetByOwner(ctx context.Context, ownerID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.Booking, int64, error) {
	return f.getByOwnerResult, f.getByOwnerTotal, f.getByOwnerErr
}

func (f *fakeBookingRepo) GetUpcomingByOwner(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*domain.Booking, int64, error) {
	return f.getUpcomingResult, f.getUpcomingTotal, f.getUpcomingErr
}

func (f *fakeBookingRepo) GetOngoingByOwner(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*domain.Booking, int64, error) {
	return f.getOngoingResult, f.getOngoingTotal, f.getOngoingErr
}

func (f *fakeBookingRepo) GetVenueBookingsForManager(ctx context.Context, venueID, ownerID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.ManagerBookingItem, int64, error) {
	return f.getVenueForManagerResult, f.getVenueForManagerTotal, f.getVenueForManagerErr
}

func (f *fakeBookingRepo) GetManagerBookingDetail(ctx context.Context, bookingID, ownerID uuid.UUID) (*domain.ManagerBookingDetail, error) {
	return f.getManagerDetailResult, f.getManagerDetailErr
}

func (f *fakeBookingRepo) ConfirmBooking(ctx context.Context, id uuid.UUID, paymentID uuid.UUID) (*domain.Booking, error) {
	f.confirmCalls++
	return f.confirmResult, f.confirmErr
}

func (f *fakeBookingRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.BookingStatus, reason string, actorID uuid.UUID) (*domain.UpdateStatusResult, error) {
	return f.updateStatusResult, f.updateStatusErr
}

// --- fakePaymentRepo: implements domain.PaymentRepository ---

type fakePaymentRepo struct {
	domain.PaymentRepository // nil methods -> only overridden methods used

	orderResult *domain.Payment
	orderErr    error

	authorizedResult *domain.UpdatePaymentResult
	authorizedErr    error

	capturedResult *domain.UpdatePaymentResult
	capturedErr    error

	getByIDResult *domain.Payment
	getByIDErr    error

	refundCalls int
	lastRefundStatus domain.PaymentStatus
	refundErr        error

	failedResult *domain.UpdatePaymentResult
	failedErr    error
	failedCalls  int
}

func (f *fakePaymentRepo) GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	return f.orderResult, f.orderErr
}

func (f *fakePaymentRepo) UpdateToFailed(ctx context.Context, orderID, reason string) (*domain.UpdatePaymentResult, error) {
	f.failedCalls++
	if f.failedErr != nil {
		return nil, f.failedErr
	}
	if f.failedResult != nil {
		return f.failedResult, nil
	}
	return &domain.UpdatePaymentResult{Updated: true}, nil
}

func (f *fakePaymentRepo) UpdateToAuthorized(ctx context.Context, orderID, razorpayPaymentID, razorpaySignature string) (*domain.UpdatePaymentResult, error) {
	return f.authorizedResult, f.authorizedErr
}

func (f *fakePaymentRepo) UpdateToCaptured(ctx context.Context, orderID, paymentID string, payload json.RawMessage) (*domain.UpdatePaymentResult, error) {
	return f.capturedResult, f.capturedErr
}

func (f *fakePaymentRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Payment, error) {
	return f.getByIDResult, f.getByIDErr
}

func (f *fakePaymentRepo) UpdateRefund(ctx context.Context, id uuid.UUID, refundID string, refundAmount int32, status domain.PaymentStatus) (*domain.UpdatePaymentResult, error) {
	f.refundCalls++
	f.lastRefundStatus = status
	if f.refundErr != nil {
		return nil, f.refundErr
	}
	return &domain.UpdatePaymentResult{Updated: true}, nil
}

// --- fakeVenueRepo: implements domain.VenueRepository ---

type fakeVenueRepo struct {
	domain.VenueRepository
	venue *domain.Venue
	err   error
}

func (f *fakeVenueRepo) GetVenueByID(ctx context.Context, venueID uuid.UUID) (*domain.Venue, error) {
	return f.venue, f.err
}

// --- fakePricingRepo: implements domain.VenuePricingRepository ---

type fakePricingRepo struct {
	domain.VenuePricingRepository
	pricing   []domain.VenuePricing
	pricingErr error
}

func (f *fakePricingRepo) GetByVenue(ctx context.Context, venueID uuid.UUID, activeOnly bool) ([]domain.VenuePricing, error) {
	return f.pricing, f.pricingErr
}

// --- fakeIdempotencyRepo: implements domain.IdempotencyRepository (unused) ---

type fakeIdempotencyRepo struct{}

func (f *fakeIdempotencyRepo) GetByKey(ctx context.Context, key string) (*domain.IdempotencyKey, error) {
	return nil, testErr
}
func (f *fakeIdempotencyRepo) Create(ctx context.Context, record *domain.IdempotencyKey) error { return nil }
func (f *fakeIdempotencyRepo) UpdateStatus(ctx context.Context, key string, status domain.IdempotencyStatus, responseStatus int32, responseBody json.RawMessage) error {
	return nil
}
func (f *fakeIdempotencyRepo) DeleteExpired(ctx context.Context) error { return nil }