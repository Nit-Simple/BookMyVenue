package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type venuePricingRepository struct {
	DB *pgxpool.Pool
}

func NewVenuePricingRepository(db *pgxpool.Pool) domain.VenuePricingRepository {
	return &venuePricingRepository{DB: db}
}

func (r *venuePricingRepository) GetByVenue(ctx context.Context, venueID uuid.UUID, activeOnly bool) ([]domain.VenuePricing, error) {
	query := `
		SELECT id, venue_id, price_per_hour, is_weekend, currency, is_active,
		       start_date, end_date, created_at, updated_at
		FROM venue_pricing
		WHERE venue_id = $1
	`
	if activeOnly {
		query += `  AND is_active = true`
	}
	query += ` ORDER BY is_weekend, start_date;`

	rows, err := r.DB.Query(ctx, query, venueID)
	if err != nil {
		return nil, fmt.Errorf("failed to query venue pricing: %w", err)
	}
	defer rows.Close()

	var pricing []domain.VenuePricing
	for rows.Next() {
		var p domain.VenuePricing
		var endDate *time.Time
		err := rows.Scan(
			&p.ID, &p.VenueID, &p.PricePerHour, &p.IsWeekend,
			&p.Currency, &p.IsActive, &p.StartDate, &endDate,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue pricing: %w", err)
		}
		p.EndDate = endDate
		pricing = append(pricing, p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	if pricing == nil {
		pricing = []domain.VenuePricing{}
	}
	return pricing, nil
}

func (r *venuePricingRepository) GetByVenues(ctx context.Context, venueIDs []uuid.UUID, activeOnly bool) (map[uuid.UUID][]domain.VenuePricing, error) {
	if len(venueIDs) == 0 {
		return map[uuid.UUID][]domain.VenuePricing{}, nil
	}

	query := `
		SELECT id, venue_id, price_per_hour, is_weekend, currency, is_active,
		       start_date, end_date, created_at, updated_at
		FROM venue_pricing
		WHERE venue_id = ANY($1)
	`
	if activeOnly {
		query += `  AND is_active = true`
	}
	query += ` ORDER BY venue_id, is_weekend, start_date`

	rows, err := r.DB.Query(ctx, query, venueIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to query venue pricing by venues: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]domain.VenuePricing)
	for rows.Next() {
		var p domain.VenuePricing
		var endDate *time.Time
		err := rows.Scan(
			&p.ID, &p.VenueID, &p.PricePerHour, &p.IsWeekend,
			&p.Currency, &p.IsActive, &p.StartDate, &endDate,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue pricing: %w", err)
		}
		p.EndDate = endDate
		result[p.VenueID] = append(result[p.VenueID], p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return result, nil
}

func (r *venuePricingRepository) InsertBatch(ctx context.Context, venueID uuid.UUID, pricing []domain.VenuePricing, isActive bool) error {
	query := `
		INSERT INTO venue_pricing (venue_id, price_per_hour, is_weekend, currency, is_active, start_date, end_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7);
	`

	for _, p := range pricing {
		_, err := r.DB.Exec(ctx, query,
			venueID, p.PricePerHour, p.IsWeekend, p.Currency, isActive, p.StartDate, p.EndDate,
		)
		if err != nil {
			return fmt.Errorf("failed to insert venue pricing: %w", err)
		}
	}

	return nil
}

func (r *venuePricingRepository) ActivatePending(ctx context.Context, venueID uuid.UUID) error {
	// First, collect IDs of currently pending (inactive) rows
	rows, err := r.DB.Query(ctx, `SELECT id FROM venue_pricing WHERE venue_id = $1 AND is_active = false`, venueID)
	if err != nil {
		return fmt.Errorf("failed to query pending pricing: %w", err)
	}
	defer rows.Close()

	var pendingIDs []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return fmt.Errorf("failed to scan pending id: %w", err)
		}
		pendingIDs = append(pendingIDs, id)
	}
	if rows.Err() != nil {
		return fmt.Errorf("failed to iterate pending rows: %w", err)
	}

	if len(pendingIDs) == 0 {
		return fmt.Errorf("no pending pricing found for venue")
	}

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Deactivate all currently active pricing
	_, err = tx.Exec(ctx, `UPDATE venue_pricing SET is_active = false WHERE venue_id = $1 AND is_active = true`, venueID)
	if err != nil {
		return fmt.Errorf("failed to deactivate active pricing: %w", err)
	}

	// Activate only the rows that were pending before the transaction
	_, err = tx.Exec(ctx, `UPDATE venue_pricing SET is_active = true WHERE id = ANY($1)`, pendingIDs)
	if err != nil {
		return fmt.Errorf("failed to activate pending pricing: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *venuePricingRepository) DeletePending(ctx context.Context, venueID uuid.UUID) error {
	_, err := r.DB.Exec(ctx, `DELETE FROM venue_pricing WHERE venue_id = $1 AND is_active = false`, venueID)
	if err != nil {
		return fmt.Errorf("failed to delete pending pricing: %w", err)
	}
	return nil
}
