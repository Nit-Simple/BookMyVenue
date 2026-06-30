package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type OnboardingStatus string

const (
	StatusPendingApproval OnboardingStatus = "PENDING_APPROVAL"
	StatusApproved        OnboardingStatus = "APPROVED"
	StatusRejected        OnboardingStatus = "REJECTED"
)

type VenueRepository interface {
	CreateVenue(ctx context.Context, venue *Venue) (*Venue, error)
	UpdateVenue(ctx context.Context, venue *Venue) (*Venue, error)
	UpdateVenueStatus(ctx context.Context, update *VenueStatusUpdate) (*VenueStatusResult, error)
	GetVenueByID(ctx context.Context, venueID uuid.UUID) (*Venue, error)
	ListVenueByFilter(ctx context.Context, filter *VenueFilter) ([]*Venue, error)
}

type Location struct {
	Latitude  string
	Longitude string
}

type Venue struct {
	VenueID          *uuid.UUID       `json:"venue_id,omitempty"`
	OwnerID          uuid.UUID        `json:"owner_id"`
	OnboardingStatus OnboardingStatus `json:"onboarding_status"`

	// Nullable Admin Verification fields (use pointers)
	ReviewedBy *uuid.UUID `json:"reviewed_by,omitempty"`
	AdminNotes *string    `json:"admin_notes,omitempty"`

	// General Information
	VenueName    string  `json:"venue_name" binding:"required"`
	Addressline1 string  `json:"addressline_1" binding:"required"`
	Addressline2 *string `json:"addressline_2,omitempty"`
	Phone        string  `json:"phone" binding:"required"`
	PhonePrivate *string `json:"phone_private,omitempty"` // Kept hidden/optional
	Email        string  `json:"email" binding:"required,email"`

	// Regional Data
	City        string    `json:"city" binding:"required"`
	District    string    `json:"district" binding:"required"`
	State       string    `json:"state" binding:"required"`
	PostalCode  string    `json:"postal_code" binding:"required"`
	CountryCode string    `json:"country_code" binding:"required"`
	Location    *Location `json:"location,omitempty"`

	// Capacity & Operational Configurations
	SeatingCapacity    int           `json:"seating_capacity" binding:"required"`
	MinBookingDuration time.Duration `json:"min_booking_duration" binding:"required"`
	OpeningPeriod      string        `json:"opening_period" binding:"required"`
	ClosingPeriod      string        `json:"closing_period" binding:"required"`
	RelaxationPeriod   time.Duration `json:"relaxation_period" binding:"required"`
	IsAirConditioned   bool          `json:"is_air_conditioned"`
	VenueType          string        `json:"venue_type" binding:"required"`
	CreatedAt          time.Time     `json:"created_at,omitempty"`
	UpdatedAt          time.Time     `json:"updated_at,omitempty"`
}

type VenueFilter struct {
	State              *string
	District           *string
	City               *string
	VenueType          *string
	IsAirConditioned   *bool
	MinSeatingCapacity *int
	OwnerID            *uuid.UUID
	Status             *OnboardingStatus
	SortBy             *string
	SortOrder          *string
	Limit              int
	Offset             int
}

type VenueStatusUpdate struct {
	VenueID    uuid.UUID
	AdminID    uuid.UUID
	Status     OnboardingStatus
	Notes      string
}

type VenueStatusResult struct {
	VenueID    uuid.UUID
	ReviewedBy uuid.UUID
	AdminNotes string
	UpdatedAt  time.Time
}
