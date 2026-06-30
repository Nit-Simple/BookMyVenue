package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type VenueMediaRepository interface {
	Create(ctx context.Context, media *VenueMedia) (*VenueMedia, error)
	GetByID(ctx context.Context, mediaID uuid.UUID) (*VenueMedia, error)
	ListByVenue(ctx context.Context, venueID uuid.UUID) ([]*VenueMedia, error)
	UpdateSortOrder(ctx context.Context, mediaID uuid.UUID, sortOrder int32) (*VenueMedia, error)
	SetPrimary(ctx context.Context, mediaID uuid.UUID) (*VenueMedia, error)
	Delete(ctx context.Context, mediaID uuid.UUID) error
	DeleteByVenue(ctx context.Context, venueID uuid.UUID) error
}

type VenueMedia struct {
	MediaID   uuid.UUID       `db:"media_id" json:"media_id"`
	VenueID   uuid.UUID       `db:"venue_id" json:"venue_id"`
	URL       string          `db:"url" json:"url"`
	Primary   bool            `db:"primary" json:"primary"`
	Metadata  json.RawMessage `db:"metadata" json:"metadata,omitempty"`
	SortOrder int32           `db:"sort_order" json:"sort_order"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
}
