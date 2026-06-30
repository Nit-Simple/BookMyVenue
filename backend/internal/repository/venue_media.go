package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type venueMediaRepository struct {
	DB *pgxpool.Pool
}

func NewVenueMediaRepository(db *pgxpool.Pool) domain.VenueMediaRepository {
	return &venueMediaRepository{DB: db}
}

func (r *venueMediaRepository) Create(ctx context.Context, media *domain.VenueMedia) (*domain.VenueMedia, error) {
	query := `
		INSERT INTO venue_media (
			venue_id, url, "primary", metadata, sort_order
		) VALUES (
			$1, $2, $3, $4, $5
		)
		RETURNING
			media_id, venue_id, url, "primary", metadata, sort_order, created_at;
	`

	var m domain.VenueMedia
	err := r.DB.QueryRow(ctx, query,
		media.VenueID,
		media.URL,
		media.Primary,
		media.Metadata,
		media.SortOrder,
	).Scan(
		&m.MediaID,
		&m.VenueID,
		&m.URL,
		&m.Primary,
		&m.Metadata,
		&m.SortOrder,
		&m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create venue media: %w", err)
	}

	return &m, nil
}

func (r *venueMediaRepository) GetByID(ctx context.Context, mediaID uuid.UUID) (*domain.VenueMedia, error) {
	query := `
		SELECT
			media_id, venue_id, url, "primary", metadata, sort_order, created_at
		FROM venue_media
		WHERE media_id = $1;
	`

	var m domain.VenueMedia
	err := r.DB.QueryRow(ctx, query, mediaID).Scan(
		&m.MediaID,
		&m.VenueID,
		&m.URL,
		&m.Primary,
		&m.Metadata,
		&m.SortOrder,
		&m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrVenueMediaNotFound
		}
		return nil, fmt.Errorf("failed to get venue media by id: %w", err)
	}

	return &m, nil
}

func (r *venueMediaRepository) ListByVenue(ctx context.Context, venueID uuid.UUID) ([]*domain.VenueMedia, error) {
	query := `
		SELECT
			media_id, venue_id, url, "primary", metadata, sort_order, created_at
		FROM venue_media
		WHERE venue_id = $1
		ORDER BY sort_order ASC, created_at ASC;
	`

	rows, err := r.DB.Query(ctx, query, venueID)
	if err != nil {
		return nil, fmt.Errorf("failed to list venue media: %w", err)
	}
	defer rows.Close()

	media := make([]*domain.VenueMedia, 0)
	for rows.Next() {
		var m domain.VenueMedia
		err := rows.Scan(
			&m.MediaID,
			&m.VenueID,
			&m.URL,
			&m.Primary,
			&m.Metadata,
			&m.SortOrder,
			&m.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue media: %w", err)
		}
		media = append(media, &m)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return media, nil
}

func (r *venueMediaRepository) UpdateSortOrder(ctx context.Context, mediaID uuid.UUID, sortOrder int32) (*domain.VenueMedia, error) {
	query := `
		UPDATE venue_media
		SET
			sort_order = $1
		WHERE media_id = $2
		RETURNING
			media_id, venue_id, url, "primary", metadata, sort_order, created_at;
	`

	var m domain.VenueMedia
	err := r.DB.QueryRow(ctx, query, sortOrder, mediaID).Scan(
		&m.MediaID,
		&m.VenueID,
		&m.URL,
		&m.Primary,
		&m.Metadata,
		&m.SortOrder,
		&m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrVenueMediaNotFound
		}
		return nil, fmt.Errorf("failed to update venue media sort order: %w", err)
	}

	return &m, nil
}

func (r *venueMediaRepository) SetPrimary(ctx context.Context, mediaID uuid.UUID) (*domain.VenueMedia, error) {
	query := `
		WITH unset_primary AS (
			UPDATE venue_media
			SET "primary" = FALSE
			WHERE venue_id = (SELECT venue_id FROM venue_media WHERE media_id = $1)
			  AND "primary" = TRUE
		)
		UPDATE venue_media
		SET "primary" = TRUE
		WHERE media_id = $1
		RETURNING
			media_id, venue_id, url, "primary", metadata, sort_order, created_at;
	`

	var m domain.VenueMedia
	err := r.DB.QueryRow(ctx, query, mediaID).Scan(
		&m.MediaID,
		&m.VenueID,
		&m.URL,
		&m.Primary,
		&m.Metadata,
		&m.SortOrder,
		&m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrVenueMediaNotFound
		}
		return nil, fmt.Errorf("failed to set primary venue media: %w", err)
	}

	return &m, nil
}

func (r *venueMediaRepository) Delete(ctx context.Context, mediaID uuid.UUID) error {
	query := `
		DELETE FROM venue_media
		WHERE media_id = $1;
	`

	_, err := r.DB.Exec(ctx, query, mediaID)
	if err != nil {
		return fmt.Errorf("failed to delete venue media: %w", err)
	}

	return nil
}

func (r *venueMediaRepository) DeleteByVenue(ctx context.Context, venueID uuid.UUID) error {
	query := `
		DELETE FROM venue_media
		WHERE venue_id = $1;
	`

	_, err := r.DB.Exec(ctx, query, venueID)
	if err != nil {
		return fmt.Errorf("failed to delete venue media by venue: %w", err)
	}

	return nil
}
