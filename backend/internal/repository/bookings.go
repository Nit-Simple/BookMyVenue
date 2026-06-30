package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type bookingRepository struct {
	DB *pgxpool.Pool
}

func NewBookingRepository(db *pgxpool.Pool) domain.BookingRepository {
	return &bookingRepository{
		DB: db,
	}
}

func (r *bookingRepository) Create(ctx context.Context, booking *domain.Booking) (*domain.CreateBookingResult, error) {
	query := `
        WITH availability_check AS (
            SELECT NOT EXISTS (
                SELECT 1
                FROM bookings
                WHERE venue_id = $1
                  AND status NOT IN ('CANCELLED', 'NO_SHOW')
                  AND tstzrange(start_time, end_time, '[)') && tstzrange($2, $3, '[)')
            ) AS is_available
        ),
        insert_booking AS (
            INSERT INTO bookings (
                id, venue_id, user_id, start_time, end_time,
                total_amount, currency, booking_reference, guest_count, special_requests,
                status, created_at, updated_at
            )
            SELECT
                $4, $1, $5, $2, $3,
                $6, $7, $8, $9, $10,
                $11, $12, $13
            WHERE (SELECT is_available FROM availability_check) = true
            RETURNING
                id, venue_id, user_id, payment_id,
                start_time, end_time, time_range, booking_date,
                total_amount, currency, status,
                cancellation_reason, cancelled_at,
                booking_reference, special_requests, guest_count,
                created_at, updated_at
        )
        SELECT
            COALESCE(
                (SELECT is_available FROM availability_check),
                false
            ) AS is_available,
            (SELECT row_to_json(insert_booking.*) FROM insert_booking) AS booking_json;
    `

	err := r.DB.QueryRow(
		ctx,
		query,
		booking.VenueID,
		booking.StartTime,
		booking.EndTime,
		booking.ID,
		booking.UserID,
		booking.TotalAmount,
		booking.Currency,
		booking.BookingReference,
		booking.GuestCount,
		booking.SpecialRequests,
		booking.Status,
		booking.CreatedAt,
		booking.UpdatedAt,
	).Scan(
		&booking.ID,
		&booking.VenueID,
		&booking.UserID,
		&booking.PaymentID,
		&booking.StartTime,
		&booking.EndTime,
		&booking.TimeRange,
		&booking.BookingDate,
		&booking.TotalAmount,
		&booking.Currency,
		&booking.Status,
		&booking.CancellationReason,
		&booking.CancelledAt,
		&booking.BookingReference,
		&booking.SpecialRequests,
		&booking.GuestCount,
		&booking.CreatedAt,
		&booking.UpdatedAt,
	)

	//Slot was NOT available (INSERT skipped)
	if errors.Is(err, pgx.ErrNoRows) {
		return &domain.CreateBookingResult{
			IsAvailable: false,
			Booking:     nil,
		}, nil
	}

	// Case 2: Exclusion constraint violation (Race condition)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23P01" {
		return nil, domain.ErrBookingConflict
	}

	// Case 3: Other database error
	if err != nil {
		return nil, fmt.Errorf("failed to create booking: %w", err)
	}

	// Case 4: Success!
	return &domain.CreateBookingResult{
		IsAvailable: true,
		Booking:     booking,
	}, nil
}

func (r *bookingRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Booking, error) {
	query := `
        SELECT
            id, venue_id, user_id, payment_id,
            start_time, end_time, time_range, booking_date,
            total_amount, currency, status,
            cancellation_reason, cancelled_at,
            booking_reference, special_requests, guest_count,
            created_at, updated_at
        FROM bookings
        WHERE id = $1;
    `

	var booking domain.Booking
	err := r.DB.QueryRow(ctx, query, id).Scan(
		&booking.ID,
		&booking.VenueID,
		&booking.UserID,
		&booking.PaymentID,
		&booking.StartTime,
		&booking.EndTime,
		&booking.TimeRange,
		&booking.BookingDate,
		&booking.TotalAmount,
		&booking.Currency,
		&booking.Status,
		&booking.CancellationReason,
		&booking.CancelledAt,
		&booking.BookingReference,
		&booking.SpecialRequests,
		&booking.GuestCount,
		&booking.CreatedAt,
		&booking.UpdatedAt,
	)

	if err != nil {
		// No rows found - return nil, nil (not an error)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get booking: %w", err)
	}

	return &booking, nil
}

func (r *bookingRepository) GetByUser(ctx context.Context, userID uuid.UUID, statuses []*domain.BookingStatus, limit, offset int) ([]*domain.Booking, int64, error) {
	countQuery := `SELECT COUNT(*) FROM bookings WHERE user_id = $1`
	countArgs := []interface{}{userID}

	// Add status filter if provided
	if len(statuses) > 0 {
		countQuery += " AND status = ANY($2)"
		countArgs = append(countArgs, statuses)
	}

	var total int64
	err := r.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count bookings: %w", err)
	}

	// If no bookings, return early
	if total == 0 {
		return []*domain.Booking{}, 0, nil
	}

	dataQuery := `
        SELECT
            id, venue_id, user_id, payment_id,
            start_time, end_time, time_range, booking_date,
            total_amount, currency, status,
            cancellation_reason, cancelled_at,
            booking_reference, special_requests, guest_count,
            created_at, updated_at
        FROM bookings
        WHERE user_id = $1
    `
	dataArgs := []interface{}{userID}
	argIndex := 2

	// Add status filter if provided
	if len(statuses) > 0 {
		dataQuery += fmt.Sprintf(" AND status = ANY($%d)", argIndex)
		dataArgs = append(dataArgs, statuses)
		argIndex++
	}

	// Add ordering and pagination
	dataQuery += " ORDER BY start_time DESC LIMIT $%d OFFSET $%d"
	dataArgs = append(dataArgs, limit, offset)

	rows, err := r.DB.Query(ctx, dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch bookings: %w", err)
	}
	defer rows.Close()

	// =============================================
	// 3. SCAN RESULTS
	// =============================================
	bookings := make([]*domain.Booking, 0, limit)
	for rows.Next() {
		var b domain.Booking
		err := rows.Scan(
			&b.ID,
			&b.VenueID,
			&b.UserID,
			&b.PaymentID,
			&b.StartTime,
			&b.EndTime,
			&b.TimeRange,
			&b.BookingDate,
			&b.TotalAmount,
			&b.Currency,
			&b.Status,
			&b.CancellationReason,
			&b.CancelledAt,
			&b.BookingReference,
			&b.SpecialRequests,
			&b.GuestCount,
			&b.CreatedAt,
			&b.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, &b)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows iteration error: %w", err)
	}

	return bookings, total, nil

}

func (r *bookingRepository) GetByVenueAndDateRange(
	ctx context.Context,
	venueID uuid.UUID,
	startDate, endDate time.Time,
) ([]*domain.Booking, error) {
	query := `
        SELECT
            id, venue_id, user_id, payment_id,
            start_time, end_time, time_range, booking_date,
            total_amount, currency, status,
            cancellation_reason, cancelled_at,
            booking_reference, special_requests, guest_count,
            created_at, updated_at
        FROM bookings
        WHERE venue_id = $1
          AND start_time >= $2
          AND start_time < $3
          AND status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
        ORDER BY start_time ASC;
    `

	rows, err := r.DB.Query(ctx, query, venueID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch venue bookings: %w", err)
	}
	defer rows.Close()

	bookings := make([]*domain.Booking, 0)
	for rows.Next() {
		var b domain.Booking
		err := rows.Scan(
			&b.ID,
			&b.VenueID,
			&b.UserID,
			&b.PaymentID,
			&b.StartTime,
			&b.EndTime,
			&b.TimeRange,
			&b.BookingDate,
			&b.TotalAmount,
			&b.Currency,
			&b.Status,
			&b.CancellationReason,
			&b.CancelledAt,
			&b.BookingReference,
			&b.SpecialRequests,
			&b.GuestCount,
			&b.CreatedAt,
			&b.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, &b)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return bookings, nil
}

func (r *bookingRepository) GetVenueDailyBookings(
	ctx context.Context,
	venueID uuid.UUID,
	date time.Time,
) ([]*domain.Booking, error) {
	// Truncate to midnight (UTC) to ensure clean date comparison
	date = date.Truncate(24 * time.Hour)

	query := `
        SELECT
            id, venue_id, user_id, payment_id,
            start_time, end_time, time_range, booking_date,
            total_amount, currency, status,
            cancellation_reason, cancelled_at,
            booking_reference, special_requests, guest_count,
            created_at, updated_at
        FROM bookings
        WHERE venue_id = $1
          AND booking_date = $2
          AND status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
        ORDER BY start_time ASC;
    `

	rows, err := r.DB.Query(ctx, query, venueID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch daily bookings: %w", err)
	}
	defer rows.Close()

	bookings := make([]*domain.Booking, 0)
	for rows.Next() {
		var b domain.Booking
		err := rows.Scan(
			&b.ID,
			&b.VenueID,
			&b.UserID,
			&b.PaymentID,
			&b.StartTime,
			&b.EndTime,
			&b.TimeRange,
			&b.BookingDate,
			&b.TotalAmount,
			&b.Currency,
			&b.Status,
			&b.CancellationReason,
			&b.CancelledAt,
			&b.BookingReference,
			&b.SpecialRequests,
			&b.GuestCount,
			&b.CreatedAt,
			&b.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, &b)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return bookings, nil
}

func (r *bookingRepository) UpdateStatus(
	ctx context.Context,
	id uuid.UUID,
	status domain.BookingStatus,
	reason string,
	actorID uuid.UUID,
) (*domain.UpdateStatusResult, error) {
	query := `
        UPDATE bookings
        SET
            status = $1,
            cancellation_reason = CASE
                WHEN $1 IN ('CANCELLED', 'NO_SHOW') THEN $2
                ELSE cancellation_reason
            END,
            cancelled_at = CASE
                WHEN $1 IN ('CANCELLED', 'NO_SHOW') THEN NOW()
                ELSE cancelled_at
            END,
            cancelled_by = CASE
                WHEN $1 IN ('CANCELLED', 'NO_SHOW') THEN $3
                ELSE cancelled_by
            END,
            updated_at = NOW()
        WHERE id = $4
          AND status IN ('PENDING', 'CONFIRMED')
          AND status != $1
        RETURNING
            id, venue_id, user_id, payment_id,
            start_time, end_time, time_range, booking_date,
            total_amount, currency, status,
            cancellation_reason, cancelled_at,
            booking_reference, special_requests, guest_count,
            created_at, updated_at;
    `

	var booking domain.Booking
	err := r.DB.QueryRow(
		ctx,
		query,
		status,
		reason,
		actorID,
		id,
	).Scan(
		&booking.ID,
		&booking.VenueID,
		&booking.UserID,
		&booking.PaymentID,
		&booking.StartTime,
		&booking.EndTime,
		&booking.TimeRange,
		&booking.BookingDate,
		&booking.TotalAmount,
		&booking.Currency,
		&booking.Status,
		&booking.CancellationReason,
		&booking.CancelledAt,
		&booking.BookingReference,
		&booking.SpecialRequests,
		&booking.GuestCount,
		&booking.CreatedAt,
		&booking.UpdatedAt,
	)

	// Case 1: No rows updated (booking not in valid state or already has this status)
	if errors.Is(err, pgx.ErrNoRows) {
		return &domain.UpdateStatusResult{
			Updated: false,
			Booking: nil,
		}, nil
	}

	// Case 2: Database error
	if err != nil {
		return nil, fmt.Errorf("failed to update booking status: %w", err)
	}

	// Case 3: Success!
	return &domain.UpdateStatusResult{
		Updated: true,
		Booking: &booking,
	}, nil
}

func (r *bookingRepository) ConfirmBooking(
	ctx context.Context,
	id uuid.UUID,
	paymentID uuid.UUID,
) (*domain.Booking, error) {
	query := `
        UPDATE bookings
        SET
            status = 'CONFIRMED',
            payment_id = $1,
            updated_at = NOW()
        WHERE id = $2
          AND status = 'PENDING'
        RETURNING
            id, venue_id, user_id, payment_id,
            start_time, end_time, time_range, booking_date,
            total_amount, currency, status,
            cancellation_reason, cancelled_at,
            booking_reference, special_requests, guest_count,
            created_at, updated_at;
    `

	var booking domain.Booking
	err := r.DB.QueryRow(
		ctx,
		query,
		paymentID, // $1
		id,        // $2
	).Scan(
		&booking.ID,
		&booking.VenueID,
		&booking.UserID,
		&booking.PaymentID,
		&booking.StartTime,
		&booking.EndTime,
		&booking.TimeRange,
		&booking.BookingDate,
		&booking.TotalAmount,
		&booking.Currency,
		&booking.Status,
		&booking.CancellationReason,
		&booking.CancelledAt,
		&booking.BookingReference,
		&booking.SpecialRequests,
		&booking.GuestCount,
		&booking.CreatedAt,
		&booking.UpdatedAt,
	)

	// Case 1: No rows updated (booking not in PENDING state)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	// Case 2: Database error
	if err != nil {
		return nil, fmt.Errorf("failed to confirm booking: %w", err)
	}

	// Case 3: Success!
	return &booking, nil
}
