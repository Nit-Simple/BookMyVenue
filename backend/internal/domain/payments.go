package domain

import (
	"encoding/json"
	"time"

	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type PaymentRepository interface {
	Create(ctx context.Context, booking *Booking) error

	// GetByID fetches a booking by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*Booking, error)

	// GetByUser fetches bookings for a user (paginated, with status filter).
	GetByUser(ctx context.Context, userID uuid.UUID, statuses []*BookingStatus, limit, offset int) ([]*Booking, int64, error)

	// GetByVenueAndDateRange fetches bookings for a venue within a date range.
	GetByVenueAndDateRange(ctx context.Context, venueID uuid.UUID, startDate, endDate time.Time) ([]*Booking, error)

	// GetVenueDailyBookings fetches bookings for a specific day.
	GetVenueDailyBookings(ctx context.Context, venueID uuid.UUID, date time.Time) ([]*Booking, error)

	// UpdateStatus updates the status of a booking.
	UpdateStatus(ctx context.Context, id uuid.UUID, status *BookingStatus, reason string, actorID uuid.UUID) error

	// ConfirmBooking updates a booking to CONFIRMED and sets payment_id.
	ConfirmBooking(ctx context.Context, id uuid.UUID, paymentID uuid.UUID) error
}

type PaymentStatus string

const (
	PaymentStatusPending           PaymentStatus = "PENDING"
	PaymentStatusAuthorized        PaymentStatus = "AUTHORIZED"
	PaymentStatusCaptured          PaymentStatus = "CAPTURED"
	PaymentStatusFailed            PaymentStatus = "FAILED"
	PaymentStatusRefunded          PaymentStatus = "REFUNDED"
	PaymentStatusPartiallyRefunded PaymentStatus = "PARTIALLY_REFUNDED"
)

type PaymentMethod string

const (
	MethodCard       PaymentMethod = "CARD"
	MethodUPI        PaymentMethod = "UPI"
	MethodNetbanking PaymentMethod = "NETBANKING"
	MethodWallet     PaymentMethod = "WALLET"
	MethodEMI        PaymentMethod = "EMI"
	MethodPayLater   PaymentMethod = "PAY_LATER"
)

type Payment struct {
	// IDs
	ID        uuid.UUID `db:"id" json:"id"`
	BookingID uuid.UUID `db:"booking_id" json:"booking_id"`

	// Razorpay Core
	RazorpayPaymentID pgtype.Text `db:"razorpay_payment_id" json:"razorpay_payment_id"`
	RazorpayOrderID   string      `db:"razorpay_order_id" json:"razorpay_order_id"`
	RazorpaySignature pgtype.Text `db:"razorpay_signature" json:"-"`

	// Financials
	Amount   int32  `db:"amount" json:"amount"`
	Currency string `db:"currency" json:"currency"`

	// Status
	Status         PaymentStatus `db:"status" json:"status"`
	RazorpayStatus pgtype.Text   `db:"razorpay_status" json:"razorpay_status"`

	// Payment Method Details
	Method    pgtype.Text `db:"method" json:"method"`
	CardLast4 pgtype.Text `db:"card_last_4" json:"card_last_4,omitempty"`
	BankName  pgtype.Text `db:"bank_name" json:"bank_name,omitempty"`
	VPA       pgtype.Text `db:"vpa" json:"vpa,omitempty"`

	// Refund
	RefundID     pgtype.Text `db:"refund_id" json:"refund_id"`
	RefundAmount pgtype.Int4 `db:"refund_amount" json:"refund_amount"`
	RefundStatus pgtype.Text `db:"refund_status" json:"refund_status"`

	// Audit
	WebhookPayload    json.RawMessage    `db:"webhook_payload" json:"-"`
	WebhookReceivedAt pgtype.Timestamptz `db:"webhook_received_at" json:"-"`
	CreatedAt         time.Time          `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `db:"updated_at" json:"updated_at"`
}

// Helper Methods
func (p *Payment) IsCaptured() bool {
	return p.Status == PaymentStatusCaptured
}

func (p *Payment) IsRefunded() bool {
	return p.Status == PaymentStatusRefunded
}

func (p *Payment) HasRazorpayPaymentID() bool {
	return p.RazorpayPaymentID.Valid
}
