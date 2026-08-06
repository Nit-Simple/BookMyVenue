package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type PaymentRepository interface {

	// GetByID fetches a payment by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*Payment, error)

	// GetByBookingID fetches the payment for a specific booking.
	GetByBookingID(ctx context.Context, bookingID uuid.UUID) (*Payment, error)

	// GetByOrderID fetches a payment by Razorpay order_id.
	GetByOrderID(ctx context.Context, orderID string) (*Payment, error)

	// UpdateOrderID updates the razorpay_order_id on a payment.
	UpdateOrderID(ctx context.Context, id uuid.UUID, orderID string) (*UpdatePaymentResult, error)

	// UpdateToAuthorized transitions a payment from PENDING to AUTHORIZED
	// with the razorpay_payment_id and signature from the confirm callback.
	UpdateToAuthorized(ctx context.Context, orderID, razorpayPaymentID, razorpaySignature string) (*UpdatePaymentResult, error)

	// UpdateToCaptured updates a payment to CAPTURED with webhook data.
	UpdateToCaptured(ctx context.Context, orderID, paymentID string, payload json.RawMessage) (*UpdatePaymentResult, error)

	// UpdateToFailed updates a payment to FAILED.
	UpdateToFailed(ctx context.Context, orderID string, reason string) (*UpdatePaymentResult, error)

	// UpdateRefund updates a payment with refund details.
	UpdateRefund(ctx context.Context, id uuid.UUID, refundID string, refundAmount int32, status PaymentStatus) (*UpdatePaymentResult, error)

	// GetPaymentMetrics returns aggregated payment statistics.
	GetPaymentMetrics(ctx context.Context, startDate, endDate time.Time) (*PaymentMetrics, error)
}

// UpdatePaymentResult is returned by payment update operations.
type UpdatePaymentResult struct {
	Updated bool
	Payment *Payment
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

type PaymentMetrics struct {
	TotalRevenue       int64 `json:"total_revenue"`
	TotalRefunds       int64 `json:"total_refunds"`
	NetRevenue         int64 `json:"net_revenue"`
	SuccessfulPayments int64 `json:"successful_payments"`
	FailedPayments     int64 `json:"failed_payments"`
	RefundedPayments   int64 `json:"refunded_payments"`
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
