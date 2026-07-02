package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type venueApplicationRepository struct {
	DB *pgxpool.Pool
}

func NewVenueApplicationRepository(db *pgxpool.Pool) domain.VenueApplicationRepository {
	return &venueApplicationRepository{DB: db}
}

func (r *venueApplicationRepository) Create(ctx context.Context, app *domain.VenueApplication) (*domain.VenueApplication, error) {
	query := `
		INSERT INTO venue_application (
			venue_id, owner_id, type, status
		) VALUES (
			$1, $2, $3, $4
		)
		RETURNING
			application_id, venue_id, owner_id, type, status,
			reviewed_by, admin_notes, submitted_at, reviewed_at,
			created_at, updated_at
	`

	var a domain.VenueApplication
	var reviewedBy *uuid.UUID
	var adminNotes *string
	var reviewedAt *time.Time

	err := r.DB.QueryRow(ctx, query,
		app.VenueID, app.OwnerID, app.Type, app.Status,
	).Scan(
		&a.ApplicationID, &a.VenueID, &a.OwnerID, &a.Type, &a.Status,
		&reviewedBy, &adminNotes, &a.SubmittedAt, &reviewedAt,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create venue application: %w", err)
	}

	a.ReviewedBy = reviewedBy
	a.AdminNotes = adminNotes
	a.ReviewedAt = reviewedAt

	return &a, nil
}

func (r *venueApplicationRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.VenueApplication, error) {
	query := `
		SELECT
			application_id, venue_id, owner_id, type, status,
			reviewed_by, admin_notes, submitted_at, reviewed_at,
			created_at, updated_at
		FROM venue_application
		WHERE application_id = $1
	`

	var a domain.VenueApplication
	var reviewedBy *uuid.UUID
	var adminNotes *string
	var reviewedAt *time.Time

	err := r.DB.QueryRow(ctx, query, id).Scan(
		&a.ApplicationID, &a.VenueID, &a.OwnerID, &a.Type, &a.Status,
		&reviewedBy, &adminNotes, &a.SubmittedAt, &reviewedAt,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("venue application not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get venue application: %w", err)
	}

	a.ReviewedBy = reviewedBy
	a.AdminNotes = adminNotes
	a.ReviewedAt = reviewedAt

	return &a, nil
}

func (r *venueApplicationRepository) GetPendingByVenue(ctx context.Context, venueID uuid.UUID, appType domain.ApplicationType) (*domain.VenueApplication, error) {
	query := `
		SELECT
			application_id, venue_id, owner_id, type, status,
			reviewed_by, admin_notes, submitted_at, reviewed_at,
			created_at, updated_at
		FROM venue_application
		WHERE venue_id = $1 AND type = $2 AND status = 'PENDING_REVIEW'
		ORDER BY submitted_at DESC
		LIMIT 1
	`

	var a domain.VenueApplication
	var reviewedBy *uuid.UUID
	var adminNotes *string
	var reviewedAt *time.Time

	err := r.DB.QueryRow(ctx, query, venueID, appType).Scan(
		&a.ApplicationID, &a.VenueID, &a.OwnerID, &a.Type, &a.Status,
		&reviewedBy, &adminNotes, &a.SubmittedAt, &reviewedAt,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get pending venue application: %w", err)
	}

	a.ReviewedBy = reviewedBy
	a.AdminNotes = adminNotes
	a.ReviewedAt = reviewedAt

	return &a, nil
}

func (r *venueApplicationRepository) ListByOwner(ctx context.Context, ownerID uuid.UUID) ([]*domain.VenueApplication, error) {
	query := `
		SELECT
			application_id, venue_id, owner_id, type, status,
			reviewed_by, admin_notes, submitted_at, reviewed_at,
			created_at, updated_at
		FROM venue_application
		WHERE owner_id = $1
		ORDER BY submitted_at DESC
	`

	rows, err := r.DB.Query(ctx, query, ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to list venue applications: %w", err)
	}
	defer rows.Close()

	return scanApplications(rows)
}

func (r *venueApplicationRepository) ListByStatus(ctx context.Context, status domain.ApplicationStatus) ([]*domain.VenueApplication, error) {
	query := `
		SELECT
			application_id, venue_id, owner_id, type, status,
			reviewed_by, admin_notes, submitted_at, reviewed_at,
			created_at, updated_at
		FROM venue_application
		WHERE status = $1
		ORDER BY submitted_at DESC
	`

	rows, err := r.DB.Query(ctx, query, status)
	if err != nil {
		return nil, fmt.Errorf("failed to list venue applications: %w", err)
	}
	defer rows.Close()

	return scanApplications(rows)
}

func (r *venueApplicationRepository) CancelOtherPending(ctx context.Context, venueID uuid.UUID, excludeID uuid.UUID) error {
	_, err := r.DB.Exec(ctx, `
		UPDATE venue_application
		SET status = 'CANCELLED', updated_at = NOW()
		WHERE venue_id = $1 AND application_id != $2 AND status = 'PENDING_REVIEW'
	`, venueID, excludeID)
	if err != nil {
		return fmt.Errorf("failed to cancel pending applications: %w", err)
	}
	return nil
}

func (r *venueApplicationRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.ApplicationStatus, reviewedBy uuid.UUID, notes string) (*domain.VenueApplication, error) {
	query := `
		UPDATE venue_application
		SET
			status = $1,
			reviewed_by = $2,
			admin_notes = $3,
			reviewed_at = NOW(),
			updated_at = NOW()
		WHERE application_id = $4
		RETURNING
			application_id, venue_id, owner_id, type, status,
			reviewed_by, admin_notes, submitted_at, reviewed_at,
			created_at, updated_at
	`

	var a domain.VenueApplication
	var revBy *uuid.UUID
	var adminNotes *string
	var reviewedAt *time.Time

	err := r.DB.QueryRow(ctx, query, status, reviewedBy, notes, id).Scan(
		&a.ApplicationID, &a.VenueID, &a.OwnerID, &a.Type, &a.Status,
		&revBy, &adminNotes, &a.SubmittedAt, &reviewedAt,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("venue application not found: %w", err)
		}
		return nil, fmt.Errorf("failed to update venue application status: %w", err)
	}

	a.ReviewedBy = revBy
	a.AdminNotes = adminNotes
	a.ReviewedAt = reviewedAt

	return &a, nil
}

func scanApplications(rows pgx.Rows) ([]*domain.VenueApplication, error) {
	apps := make([]*domain.VenueApplication, 0)
	for rows.Next() {
		var a domain.VenueApplication
		var reviewedBy *uuid.UUID
		var adminNotes *string
		var reviewedAt *time.Time

		err := rows.Scan(
			&a.ApplicationID, &a.VenueID, &a.OwnerID, &a.Type, &a.Status,
			&reviewedBy, &adminNotes, &a.SubmittedAt, &reviewedAt,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue application: %w", err)
		}

		a.ReviewedBy = reviewedBy
		a.AdminNotes = adminNotes
		a.ReviewedAt = reviewedAt

		apps = append(apps, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	return apps, nil
}
