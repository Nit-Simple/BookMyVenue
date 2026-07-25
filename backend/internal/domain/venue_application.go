package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ApplicationStatus string

const (
	AppStatusPendingReview ApplicationStatus = "PENDING_REVIEW"
	AppStatusApproved      ApplicationStatus = "APPROVED"
	AppStatusRejected      ApplicationStatus = "REJECTED"
	AppStatusCancelled     ApplicationStatus = "CANCELLED"
)

type ApplicationType string

const (
	AppTypeNewVenue ApplicationType = "NEW_VENUE"
)

type VenueApplication struct {
	ApplicationID uuid.UUID          `json:"application_id"`
	VenueID       uuid.UUID          `json:"venue_id"`
	OwnerID       uuid.UUID          `json:"owner_id"`
	Type          ApplicationType    `json:"type"`
	Status        ApplicationStatus  `json:"status"`
	ReviewedBy    *uuid.UUID         `json:"reviewed_by,omitempty"`
	AdminNotes    *string            `json:"admin_notes,omitempty"`
	SubmittedAt   time.Time          `json:"submitted_at"`
	ReviewedAt    *time.Time         `json:"reviewed_at,omitempty"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
}

type VenueApplicationRepository interface {
	Create(ctx context.Context, app *VenueApplication) (*VenueApplication, error)
	GetByID(ctx context.Context, id uuid.UUID) (*VenueApplication, error)
	GetPendingByVenue(ctx context.Context, venueID uuid.UUID, appType ApplicationType) (*VenueApplication, error)
	ListByOwner(ctx context.Context, ownerID uuid.UUID) ([]*VenueApplication, error)
	ListByStatus(ctx context.Context, status ApplicationStatus) ([]*VenueApplication, error)
	CancelOtherPending(ctx context.Context, venueID uuid.UUID, excludeID uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status ApplicationStatus, reviewedBy uuid.UUID, notes string) (*VenueApplication, error)
}
