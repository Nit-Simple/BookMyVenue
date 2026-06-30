package domain

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type BookingRepository interface {
	Create(ctx context.Context, booking *Booking) (*CreateBookingResult, error)

	// GetByID fetches a booking by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*Booking, error)

	// GetByUser fetches bookings for a user (paginated, with status filter).
	GetByUser(ctx context.Context, userID uuid.UUID, statuses []*BookingStatus, limit, offset int) ([]*Booking, int64, error)

	// GetByVenueAndDateRange fetches bookings for a venue within a date range.
	GetByVenueAndDateRange(ctx context.Context, venueID uuid.UUID, startDate, endDate time.Time) ([]*Booking, error)

	// GetVenueDailyBookings fetches bookings for a specific day.
	GetVenueDailyBookings(ctx context.Context, venueID uuid.UUID, date time.Time) ([]*Booking, error)

	// UpdateStatus updates the status of a booking.
	UpdateStatus(ctx context.Context, id uuid.UUID, status BookingStatus, reason string, actorID uuid.UUID) (*UpdateStatusResult, error)

	// ConfirmBooking updates a booking to CONFIRMED and sets payment_id.
	ConfirmBooking(ctx context.Context, id uuid.UUID, paymentID uuid.UUID) (*Booking, error)
}

type CreateBookingRequest struct {
	VenueID         uuid.UUID
	UserID          uuid.UUID // From JWT context, not from request body
	StartTime       time.Time
	EndTime         time.Time
	GuestCount      int32
	SpecialRequests string
}
type CreateBookingResult struct {
	IsAvailable bool
	Booking     *Booking
}

type BookingStatus string

const (
	BookingStatusPending   BookingStatus = "PENDING"
	BookingStatusConfirmed BookingStatus = "CONFIRMED"
	BookingStatusCompleted BookingStatus = "COMPLETED"
	BookingStatusCancelled BookingStatus = "CANCELLED"
	BookingStatusNoShow    BookingStatus = "NO_SHOW"
)

type Booking struct {
	ID      uuid.UUID `db:"id" json:"id"`
	VenueID uuid.UUID `db:"venue_id" json:"venue_id"`
	UserID  uuid.UUID `db:"user_id" json:"user_id"`

	PaymentID pgtype.UUID `db:"payment_id" json:"payment_id"`

	// Time Core
	StartTime   time.Time                        `db:"start_time" json:"start_time"`
	EndTime     time.Time                        `db:"end_time" json:"end_time"`
	TimeRange   pgtype.Range[pgtype.Timestamptz] `db:"time_range" json:"-"`              // Generated, scan-only
	BookingDate time.Time                        `db:"booking_date" json:"booking_date"` // Generated, scan-only

	// Financials
	TotalAmount pgtype.Numeric `db:"total_amount" json:"total_amount"`
	Currency    string         `db:"currency" json:"currency"`

	// Status & Lifecycle
	Status             BookingStatus      `db:"status" json:"status"`
	CancellationReason pgtype.Text        `db:"cancellation_reason" json:"cancellation_reason"`
	CancelledAt        pgtype.Timestamptz `db:"cancelled_at" json:"cancelled_at"`

	BookingReference string `db:"booking_reference" json:"booking_reference"`

	SpecialRequests pgtype.Text `db:"special_requests" json:"special_requests"`
	GuestCount      int32       `db:"guest_count" json:"guest_count"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type BookNowRequest struct {
	VenueID string `json:"venue_id" validate:"required,uuid"`

	StartTime time.Time `json:"start_time" validate:"required"`

	EndTime time.Time `json:"end_time" validate:"required"`

	GuestCount int32 `json:"guest_count" validate:"required,min=1"`

	SpecialRequests string `json:"special_requests" validate:"omitempty,max=500"`
}

type CreateBookingResponse struct {
	// Booking Core Details (for the confirmation page)
	BookingID        string    `json:"booking_id"`
	BookingReference string    `json:"booking_reference"`
	VenueID          string    `json:"venue_id"`
	VenueName        string    `json:"venue_name"`
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	GuestCount       int32     `json:"guest_count"`
	TotalAmount      string    `json:"total_amount"`       //
	TotalAmountPaise int64     `json:"total_amount_paise"` // amount in paise for razorpay for Razorpay
	Currency         string    `json:"currency"`           // "INR"
	Status           string    `json:"status"`             // "PENDING"

	// Razorpay Payment Details (for frontend checkout)
	RazorpayKeyID          string `json:"razorpay_key_id"`                    // Your public key from Razorpay dashboard
	RazorpayOrderID        string `json:"razorpay_order_id"`                  // The order_id returned by Razorpay
	RazorpayPrefillEmail   string `json:"razorpay_prefill_email,omitempty"`   // Optional: prefill user email
	RazorpayPrefillContact string `json:"razorpay_prefill_contact,omitempty"` // Optional: prefill user phone

	//
	ExpiresAt time.Time `json:"expires_at"` // When the pending booking will expire
}

type UpdateStatusResult struct {
	// Updated indicates if the booking was actually updated.
	// If false, the booking was not in a valid state for the update.
	Updated bool `json:"updated"`

	// Booking contains the updated booking (only populated if Updated is true).
	Booking *Booking `json:"booking,omitempty"`
}

func IsWeekend(t time.Time) bool {
	weekday := t.Weekday()
	return weekday == time.Saturday || weekday == time.Sunday
}

// CalculateDurationHours returns the duration in hours between start and end.
func CalculateDurationHours(start, end time.Time) float64 {
	return end.Sub(start).Hours()
}

func RoundToTwoDecimals(value float64) float64 {
	return math.Round(value*100) / 100
}

type CancelBookingRequest struct {
	BookingID string `json:"booking_id" validate:"required,uuid"`
	Reason    string `json:"reason" validate:"required,min=5,max=500"`
}

func (r *CancelBookingRequest) Validate() error {
	if r.BookingID == "" {
		return errors.New("booking_id is required")
	}
	if _, err := uuid.Parse(r.BookingID); err != nil {
		return errors.New("invalid booking_id format")
	}
	if len(r.Reason) < 5 {
		return errors.New("reason must be at least 5 characters")
	}
	if len(r.Reason) > 500 {
		return errors.New("reason must be less than 500 characters")
	}
	return nil
}

type CancelBookingResponse struct {
	BookingID          string    `json:"booking_id"`
	Status             string    `json:"status"` // "CANCELLED"
	CancelledAt        time.Time `json:"cancelled_at"`
	CancellationReason string    `json:"cancellation_reason"`
	RefundStatus       string    `json:"refund_status,omitempty"` // "PENDING", "PROCESSED", "FAILED"
}

type AvailabilityCheckRequest struct {
	VenueID   string    `form:"venue_id" validate:"required,uuid"`
	StartTime time.Time `form:"start_time" validate:"required"`
	EndTime   time.Time `form:"end_time" validate:"required"`
}

func (r *AvailabilityCheckRequest) Validate() error {
	if r.VenueID == "" {
		return errors.New("venue_id is required")
	}
	if _, err := uuid.Parse(r.VenueID); err != nil {
		return errors.New("invalid venue_id format")
	}
	if r.StartTime.IsZero() || r.EndTime.IsZero() {
		return errors.New("start_time and end_time are required")
	}
	if !r.EndTime.After(r.StartTime) {
		return errors.New("end_time must be after start_time")
	}
	return nil
}

type AvailabilityCheckResponse struct {
	Available bool   `json:"available"`
	Status    string `json:"status"` // "AVAILABLE", "VENUE_NOT_FOUND", "OUTSIDE_OPERATING_HOURS", "CONFLICT_EXISTS"
	Message   string `json:"message,omitempty"`
}
