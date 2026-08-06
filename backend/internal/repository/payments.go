package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type paymentRepository struct {
	DB *pgxpool.Pool
}

func NewPaymentRepository(db *pgxpool.Pool) domain.PaymentRepository {
	return &paymentRepository{
		DB: db,
	}
}

func (s *paymentRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Payment, error) {
	query := `
		SELECT
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at
		FROM payments
		WHERE id = $1;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, id).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get payment by id: %w", err)
	}

	return &p, nil
}

func (s *paymentRepository) GetByBookingID(ctx context.Context, bookingID uuid.UUID) (*domain.Payment, error) {
	query := `
		SELECT
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at
		FROM payments
		WHERE booking_id = $1
		ORDER BY created_at DESC
		LIMIT 1;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, bookingID).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get payment by booking id: %w", err)
	}

	return &p, nil
}

func (s *paymentRepository) GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error) {
	query := `
		SELECT
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at
		FROM payments
		WHERE razorpay_order_id = $1;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, orderID).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get payment by order id: %w", err)
	}

	return &p, nil
}

func (s *paymentRepository) UpdateOrderID(ctx context.Context, id uuid.UUID, orderID string) (*domain.UpdatePaymentResult, error) {
	query := `
		UPDATE payments
		SET
			razorpay_order_id = $1,
			updated_at = NOW()
		WHERE id = $2
		RETURNING
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, orderID, id).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.UpdatePaymentResult{Updated: false, Payment: nil}, nil
		}
		return nil, fmt.Errorf("failed to update payment order id: %w", err)
	}

	return &domain.UpdatePaymentResult{Updated: true, Payment: &p}, nil
}

func (s *paymentRepository) UpdateToAuthorized(ctx context.Context, orderID, razorpayPaymentID, razorpaySignature string) (*domain.UpdatePaymentResult, error) {
	query := `
		UPDATE payments
		SET
			status = 'AUTHORIZED',
			razorpay_payment_id = $1,
			razorpay_signature = $2,
			updated_at = NOW()
		WHERE razorpay_order_id = $3
		  AND status = 'PENDING'
		RETURNING
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, razorpayPaymentID, razorpaySignature, orderID).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.UpdatePaymentResult{Updated: false, Payment: nil}, nil
		}
		return nil, fmt.Errorf("failed to authorize payment: %w", err)
	}

	return &domain.UpdatePaymentResult{Updated: true, Payment: &p}, nil
}

func (s *paymentRepository) UpdateToCaptured(ctx context.Context, orderID, paymentID string, payload json.RawMessage) (*domain.UpdatePaymentResult, error) {
	// Parse method details from webhook payload if available
	var method, cardLast4, bankName, vpa *string
	if len(payload) > 0 {
		var event domain.WebhookEvent
		if err := json.Unmarshal(payload, &event); err == nil {
			p := event.Payload.Payment
			if p.Method != "" {
				m := mapPaymentMethod(p.Method)
				if m != "" {
					method = &m
				}
			}
			if p.CardLast4 != "" {
				cardLast4 = &p.CardLast4
			}
			if p.Bank != "" {
				bankName = &p.Bank
			}
			if p.VPA != "" {
				vpa = &p.VPA
			}
		}
	}

	query := `
		UPDATE payments
		SET
			status = 'CAPTURED',
			razorpay_payment_id = $1,
			method = COALESCE($2, method),
			card_last_4 = COALESCE($3, card_last_4),
			bank_name = COALESCE($4, bank_name),
			vpa = COALESCE($5, vpa),
			webhook_payload = $6,
			webhook_received_at = NOW(),
			updated_at = NOW()
		WHERE razorpay_order_id = $7
		  AND status IN ('PENDING', 'AUTHORIZED')
		RETURNING
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, paymentID, method, cardLast4, bankName, vpa, payload, orderID).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.UpdatePaymentResult{Updated: false, Payment: nil}, nil
		}
		return nil, fmt.Errorf("failed to update payment to captured: %w", err)
	}

	return &domain.UpdatePaymentResult{Updated: true, Payment: &p}, nil
}

func (s *paymentRepository) UpdateToFailed(ctx context.Context, orderID string, reason string) (*domain.UpdatePaymentResult, error) {
	query := `
		UPDATE payments
		SET
			status = 'FAILED',
			razorpay_status = $1,
			updated_at = NOW()
		WHERE razorpay_order_id = $2
		  AND status NOT IN ('CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED')
		RETURNING
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, reason, orderID).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.UpdatePaymentResult{Updated: false, Payment: nil}, nil
		}
		return nil, fmt.Errorf("failed to update payment to failed: %w", err)
	}

	return &domain.UpdatePaymentResult{Updated: true, Payment: &p}, nil
}

func (s *paymentRepository) UpdateRefund(ctx context.Context, id uuid.UUID, refundID string, refundAmount int32, status domain.PaymentStatus) (*domain.UpdatePaymentResult, error) {
	query := `
		UPDATE payments
		SET
			refund_id = $1,
			refund_amount = $2,
			status = $3,
			refund_status = $3,
			updated_at = NOW()
		WHERE id = $4
		  AND status = 'CAPTURED'
		RETURNING
			id, booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature,
			amount, currency, status, razorpay_status,
			method, card_last_4, bank_name, vpa,
			refund_id, refund_amount, refund_status,
			webhook_payload, webhook_received_at,
			created_at, updated_at;
	`

	var p domain.Payment
	err := s.DB.QueryRow(ctx, query, refundID, refundAmount, status, id).Scan(
		&p.ID,
		&p.BookingID,
		&p.RazorpayPaymentID,
		&p.RazorpayOrderID,
		&p.RazorpaySignature,
		&p.Amount,
		&p.Currency,
		&p.Status,
		&p.RazorpayStatus,
		&p.Method,
		&p.CardLast4,
		&p.BankName,
		&p.VPA,
		&p.RefundID,
		&p.RefundAmount,
		&p.RefundStatus,
		&p.WebhookPayload,
		&p.WebhookReceivedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.UpdatePaymentResult{Updated: false, Payment: nil}, nil
		}
		return nil, fmt.Errorf("failed to update payment refund: %w", err)
	}

	return &domain.UpdatePaymentResult{Updated: true, Payment: &p}, nil
}

func (s *paymentRepository) GetPaymentMetrics(ctx context.Context, startDate, endDate time.Time) (*domain.PaymentMetrics, error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN amount END), 0) AS total_revenue,
			COALESCE(SUM(refund_amount), 0) AS total_refunds,
			COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN amount END), 0) -
			COALESCE(SUM(refund_amount), 0) AS net_revenue,
			COUNT(*) FILTER (WHERE status = 'CAPTURED') AS successful_payments,
			COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_payments,
			COUNT(*) FILTER (WHERE status IN ('REFUNDED', 'PARTIALLY_REFUNDED')) AS refunded_payments
		FROM payments
		WHERE created_at >= $1
		  AND created_at < $2;
	`

	var metrics domain.PaymentMetrics
	err := s.DB.QueryRow(ctx, query, startDate, endDate).Scan(
		&metrics.TotalRevenue,
		&metrics.TotalRefunds,
		&metrics.NetRevenue,
		&metrics.SuccessfulPayments,
		&metrics.FailedPayments,
		&metrics.RefundedPayments,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment metrics: %w", err)
	}

	return &metrics, nil
}

func mapPaymentMethod(method string) string {
	switch method {
	case "paylater":
		return "PAY_LATER"
	case "bank_transfer":
		return ""
	default:
		return strings.ToUpper(method)
	}
}
