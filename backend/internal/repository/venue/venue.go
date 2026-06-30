package venue

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type venueRepository struct {
	DB *pgxpool.Pool
}

func NewVenueRepository(db *pgxpool.Pool) domain.VenueRepository {
	return &venueRepository{
		DB: db,
	}
}

func (v *venueRepository) CreateVenue(ctx context.Context, venue *domain.Venue) (*domain.Venue, error) {
	query := `
		INSERT INTO venue (
			owner_id, venue_name, addressline_1, addressline_2, phone, phone_private, email, 
			city, district, state, postal_code, country_code, location, 
			seating_capacity, min_booking_duration, relaxation_period, 
			opening_period, closing_period, is_air_conditioned, venue_type
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::geography, $14, $15, $16, $17::time, $18::time, $19, $20)
		RETURNING 
			venue_id, owner_id, onboarding_status, reviewed_by, admin_notes, 
			venue_name, addressline_1, addressline_2, phone, phone_private, email, 
			city, district, state, postal_code, country_code, 
			ST_Y(location::geometry)::text, ST_X(location::geometry)::text, 
			seating_capacity, min_booking_duration, relaxation_period, 
			opening_period::text, closing_period::text, is_air_conditioned, venue_type, 
			created_at, updated_at
	`

	var locStr *string
	if venue.Location != nil && venue.Location.Longitude != "" && venue.Location.Latitude != "" {
		s := fmt.Sprintf("POINT(%s %s)", venue.Location.Longitude, venue.Location.Latitude)
		locStr = &s
	}

	var retVenue domain.Venue
	var latVal sql.NullString
	var lonVal sql.NullString

	err := v.DB.QueryRow(ctx, query,
		venue.OwnerID,
		venue.VenueName,
		venue.Addressline1,
		venue.Addressline2,
		venue.Phone,
		venue.PhonePrivate,
		venue.Email,
		venue.City,
		venue.District,
		venue.State,
		venue.PostalCode,
		venue.CountryCode,
		locStr,
		venue.SeatingCapacity,
		venue.MinBookingDuration,
		venue.RelaxationPeriod,
		venue.OpeningPeriod,
		venue.ClosingPeriod,
		venue.IsAirConditioned,
		venue.VenueType,
	).Scan(
		&retVenue.VenueID,
		&retVenue.OwnerID,
		&retVenue.OnboardingStatus,
		&retVenue.ReviewedBy,
		&retVenue.AdminNotes,
		&retVenue.VenueName,
		&retVenue.Addressline1,
		&retVenue.Addressline2,
		&retVenue.Phone,
		&retVenue.PhonePrivate,
		&retVenue.Email,
		&retVenue.City,
		&retVenue.District,
		&retVenue.State,
		&retVenue.PostalCode,
		&retVenue.CountryCode,
		&latVal,
		&lonVal,
		&retVenue.SeatingCapacity,
		&retVenue.MinBookingDuration,
		&retVenue.RelaxationPeriod,
		&retVenue.OpeningPeriod,
		&retVenue.ClosingPeriod,
		&retVenue.IsAirConditioned,
		&retVenue.VenueType,
		&retVenue.CreatedAt,
		&retVenue.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if latVal.Valid && lonVal.Valid {
		retVenue.Location = &domain.Location{
			Latitude:  latVal.String,
			Longitude: lonVal.String,
		}
	}

	return &retVenue, nil
}

func (v *venueRepository) UpdateVenue(ctx context.Context, venue *domain.Venue) (*domain.Venue, error) {
	if venue.VenueID == nil {
		return nil, domain.ErrVenueIDRequired
	}

	query := `
		UPDATE venue
		SET
			venue_name = $1,
			addressline_1 = $2,
			addressline_2 = $3,
			phone = $4,
			phone_private = $5,
			email = $6,
			city = $7,
			district = $8,
			state = $9,
			postal_code = $10,
			country_code = $11,
			location = $12::geography,
			seating_capacity = $13,
			min_booking_duration = $14,
			relaxation_period = $15,
			opening_period = $16::time,
			closing_period = $17::time,
			is_air_conditioned = $18,
			venue_type = $19,
			updated_at = NOW()
		WHERE venue_id = $20
		RETURNING 
			venue_id, owner_id, onboarding_status, reviewed_by, admin_notes, 
			venue_name, addressline_1, addressline_2, phone, phone_private, email, 
			city, district, state, postal_code, country_code, 
			ST_Y(location::geometry)::text, ST_X(location::geometry)::text, 
			seating_capacity, min_booking_duration, relaxation_period, 
			opening_period::text, closing_period::text, is_air_conditioned, venue_type, 
			created_at, updated_at
	`

	var locStr *string
	if venue.Location != nil && venue.Location.Longitude != "" && venue.Location.Latitude != "" {
		s := fmt.Sprintf("POINT(%s %s)", venue.Location.Longitude, venue.Location.Latitude)
		locStr = &s
	}

	var retVenue domain.Venue
	var latVal sql.NullString
	var lonVal sql.NullString

	err := v.DB.QueryRow(ctx, query,
		venue.VenueName,
		venue.Addressline1,
		venue.Addressline2,
		venue.Phone,
		venue.PhonePrivate,
		venue.Email,
		venue.City,
		venue.District,
		venue.State,
		venue.PostalCode,
		venue.CountryCode,
		locStr,
		venue.SeatingCapacity,
		venue.MinBookingDuration,
		venue.RelaxationPeriod,
		venue.OpeningPeriod,
		venue.ClosingPeriod,
		venue.IsAirConditioned,
		venue.VenueType,
		venue.VenueID,
	).Scan(
		&retVenue.VenueID,
		&retVenue.OwnerID,
		&retVenue.OnboardingStatus,
		&retVenue.ReviewedBy,
		&retVenue.AdminNotes,
		&retVenue.VenueName,
		&retVenue.Addressline1,
		&retVenue.Addressline2,
		&retVenue.Phone,
		&retVenue.PhonePrivate,
		&retVenue.Email,
		&retVenue.City,
		&retVenue.District,
		&retVenue.State,
		&retVenue.PostalCode,
		&retVenue.CountryCode,
		&latVal,
		&lonVal,
		&retVenue.SeatingCapacity,
		&retVenue.MinBookingDuration,
		&retVenue.RelaxationPeriod,
		&retVenue.OpeningPeriod,
		&retVenue.ClosingPeriod,
		&retVenue.IsAirConditioned,
		&retVenue.VenueType,
		&retVenue.CreatedAt,
		&retVenue.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if latVal.Valid && lonVal.Valid {
		retVenue.Location = &domain.Location{
			Latitude:  latVal.String,
			Longitude: lonVal.String,
		}
	}

	return &retVenue, nil
}

func (v *venueRepository) UpdateVenueStatus(ctx context.Context, update *domain.VenueStatusUpdate) (*domain.VenueStatusResult, error) {
	if update.VenueID == uuid.Nil {
		return nil, domain.ErrVenueIDRequired
	}

	query := `
		UPDATE venue
		SET
			onboarding_status = $1::venue_onboarding_status,
			reviewed_by = $2,
			admin_notes = $3,
			updated_at = NOW()
		WHERE venue_id = $4
		RETURNING venue_id, reviewed_by, admin_notes, updated_at
	`

	var result domain.VenueStatusResult
	var scannedReviewedBy *uuid.UUID
	var scannedNotes sql.NullString

	err := v.DB.QueryRow(ctx, query, update.Status, update.AdminID, update.Notes, update.VenueID).Scan(
		&result.VenueID,
		&scannedReviewedBy,
		&scannedNotes,
		&result.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if scannedReviewedBy != nil {
		result.ReviewedBy = *scannedReviewedBy
	}
	result.AdminNotes = scannedNotes.String

	return &result, nil
}

func (v *venueRepository) GetVenueByID(ctx context.Context, venueID uuid.UUID) (*domain.Venue, error) {
	query := `
		SELECT 
			venue_id, owner_id, onboarding_status, 
			venue_name, addressline_1, addressline_2, phone, phone_private, email, 
			city, district, state, postal_code, country_code, 
			ST_Y(location::geometry)::text, ST_X(location::geometry)::text, 
			seating_capacity, min_booking_duration, relaxation_period, 
			opening_period::text, closing_period::text, is_air_conditioned, venue_type, 
			created_at, updated_at
		FROM venue
		WHERE venue_id = $1
	`

	var retVenue domain.Venue
	var latVal sql.NullString
	var lonVal sql.NullString

	err := v.DB.QueryRow(ctx, query, venueID).Scan(
		&retVenue.VenueID,
		&retVenue.OwnerID,
		&retVenue.OnboardingStatus,
		&retVenue.VenueName,
		&retVenue.Addressline1,
		&retVenue.Addressline2,
		&retVenue.Phone,
		&retVenue.PhonePrivate,
		&retVenue.Email,
		&retVenue.City,
		&retVenue.District,
		&retVenue.State,
		&retVenue.PostalCode,
		&retVenue.CountryCode,
		&latVal,
		&lonVal,
		&retVenue.SeatingCapacity,
		&retVenue.MinBookingDuration,
		&retVenue.RelaxationPeriod,
		&retVenue.OpeningPeriod,
		&retVenue.ClosingPeriod,
		&retVenue.IsAirConditioned,
		&retVenue.VenueType,
		&retVenue.CreatedAt,
		&retVenue.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrVenueNotFound
		}
		return nil, err
	}

	if latVal.Valid && lonVal.Valid {
		retVenue.Location = &domain.Location{
			Latitude:  latVal.String,
			Longitude: lonVal.String,
		}
	}

	return &retVenue, nil
}
func (v *venueRepository) ListVenueByFilter(ctx context.Context, filter *domain.VenueFilter) ([]*domain.Venue, error) {
	query := `
		SELECT 
			venue_id, owner_id, onboarding_status, reviewed_by, admin_notes, 
			venue_name, addressline_1, addressline_2, phone, phone_private, email, 
			city, district, state, postal_code, country_code, 
			ST_Y(location::geometry)::text, ST_X(location::geometry)::text, 
			seating_capacity, min_booking_duration, relaxation_period, 
			opening_period::text, closing_period::text, is_air_conditioned, venue_type, 
			created_at, updated_at
		FROM venue
	`

	args := make([]any, 0)
	argCount := 1

	if filter.Status != nil && *filter.Status != "" {
		query += fmt.Sprintf("WHERE onboarding_status = $%d::venue_onboarding_status", argCount)
		args = append(args, *filter.Status)
		argCount++
	} else {
		query += "WHERE onboarding_status = 'APPROVED'::venue_onboarding_status"
	}

	if filter.State != nil && *filter.State != "" {
		query += fmt.Sprintf(" AND state = $%d", argCount)
		args = append(args, *filter.State)
		argCount++
	}

	if filter.District != nil && *filter.District != "" {
		query += fmt.Sprintf(" AND district = $%d", argCount)
		args = append(args, *filter.District)
		argCount++
	}

	if filter.City != nil && *filter.City != "" {
		query += fmt.Sprintf(" AND city = $%d", argCount)
		args = append(args, *filter.City)
		argCount++
	}

	if filter.VenueType != nil && *filter.VenueType != "" {
		query += fmt.Sprintf(" AND venue_type = $%d", argCount)
		args = append(args, *filter.VenueType)
		argCount++
	}

	if filter.IsAirConditioned != nil {
		query += fmt.Sprintf(" AND is_air_conditioned = $%d", argCount)
		args = append(args, *filter.IsAirConditioned)
		argCount++
	}

	if filter.MinSeatingCapacity != nil {
		query += fmt.Sprintf(" AND seating_capacity >= $%d", argCount)
		args = append(args, *filter.MinSeatingCapacity)
		argCount++
	}

	if filter.OwnerID != nil {
		query += fmt.Sprintf(" AND owner_id = $%d", argCount)
		args = append(args, *filter.OwnerID)
		argCount++
	}

	sortBy := "created_at"
	if filter.SortBy != nil {
		switch *filter.SortBy {
		case "venue_name", "seating_capacity", "created_at", "updated_at":
			sortBy = *filter.SortBy
		}
	}

	sortOrder := "DESC"
	if filter.SortOrder != nil {
		switch *filter.SortOrder {
		case "ASC":
			sortOrder = "ASC"
		case "DESC":
			sortOrder = "DESC"
		}
	}

	query += fmt.Sprintf(" ORDER BY %s %s", sortBy, sortOrder)

	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	} else if limit > 100 {
		limit = 100
	}

	query += fmt.Sprintf(" LIMIT $%d", argCount)
	args = append(args, limit)
	argCount++

	if filter.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, filter.Offset)
		argCount++
	}

	rows, err := v.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	venues := make([]*domain.Venue, 0)
	for rows.Next() {
		var retVenue domain.Venue
		var latVal sql.NullString
		var lonVal sql.NullString

		err := rows.Scan(
			&retVenue.VenueID,
			&retVenue.OwnerID,
			&retVenue.OnboardingStatus,
			&retVenue.ReviewedBy,
			&retVenue.AdminNotes,
			&retVenue.VenueName,
			&retVenue.Addressline1,
			&retVenue.Addressline2,
			&retVenue.Phone,
			&retVenue.PhonePrivate,
			&retVenue.Email,
			&retVenue.City,
			&retVenue.District,
			&retVenue.State,
			&retVenue.PostalCode,
			&retVenue.CountryCode,
			&latVal,
			&lonVal,
			&retVenue.SeatingCapacity,
			&retVenue.MinBookingDuration,
			&retVenue.RelaxationPeriod,
			&retVenue.OpeningPeriod,
			&retVenue.ClosingPeriod,
			&retVenue.IsAirConditioned,
			&retVenue.VenueType,
			&retVenue.CreatedAt,
			&retVenue.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if latVal.Valid && lonVal.Valid {
			retVenue.Location = &domain.Location{
				Latitude:  latVal.String,
				Longitude: lonVal.String,
			}
		}

		venues = append(venues, &retVenue)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return venues, nil
}

