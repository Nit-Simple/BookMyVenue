package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type VenuePricing struct {
	ID           uuid.UUID  `json:"id"`
	VenueID      uuid.UUID  `json:"venue_id"`
	PricePerHour float64    `json:"price_per_hour"`
	IsWeekend    bool       `json:"is_weekend"`
	Currency     string     `json:"currency"`
	IsActive     bool       `json:"is_active"`
	StartDate    time.Time  `json:"start_date"`
	EndDate      *time.Time `json:"end_date,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type VenuePricingRepository interface {
	GetByVenue(ctx context.Context, venueID uuid.UUID, activeOnly bool) ([]VenuePricing, error)
	GetByVenues(ctx context.Context, venueIDs []uuid.UUID, activeOnly bool) (map[uuid.UUID][]VenuePricing, error)
	InsertBatch(ctx context.Context, venueID uuid.UUID, pricing []VenuePricing, isActive bool) error
	DeactivateActive(ctx context.Context, venueID uuid.UUID) error
}
