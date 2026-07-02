package domain

import (
	"time"

	"github.com/google/uuid"
)

// -------- request DTOs --------

type CreateVenueRequest struct {
	VenueName          string              `json:"venue_name"`
	Addressline1       string              `json:"addressline_1"`
	Addressline2       *string             `json:"addressline_2,omitempty"`
	Phone              string              `json:"phone"`
	PhonePrivate       *string             `json:"phone_private,omitempty"`
	Email              string              `json:"email"`
	City               string              `json:"city"`
	District           string              `json:"district"`
	State              string              `json:"state"`
	PostalCode         string              `json:"postal_code"`
	CountryCode        string              `json:"country_code"`
	Latitude           *string             `json:"latitude,omitempty"`
	Longitude          *string             `json:"longitude,omitempty"`
	SeatingCapacity    int                 `json:"seating_capacity"`
	MinBookingDuration string              `json:"min_booking_duration"`
	OpeningPeriod      string              `json:"opening_period"`
	ClosingPeriod      string              `json:"closing_period"`
	RelaxationPeriod   string              `json:"relaxation_period"`
	IsAirConditioned   bool                `json:"is_air_conditioned"`
	VenueType          string              `json:"venue_type"`
	Media              []CreateMediaItem   `json:"media"`
	Pricing            []CreatePricingItem `json:"pricing"`
}

type CreateMediaItem struct {
	URL       string         `json:"url"`
	Primary   bool           `json:"primary"`
	Metadata  map[string]any `json:"metadata,omitempty"`
	SortOrder int32          `json:"sort_order"`
}

type CreatePricingItem struct {
	PricePerHour float64 `json:"price_per_hour" binding:"required"`
	IsWeekend    bool    `json:"is_weekend"`
	Currency     string  `json:"currency"`
	StartDate    string  `json:"start_date" binding:"required"`
	EndDate      *string `json:"end_date,omitempty"`
}

type ApproveRejectRequest struct {
	Notes string `json:"notes"`
}

// -------- response DTOs --------

type VenueListItem struct {
	VenueID             uuid.UUID         `json:"venue_id"`
	VenueName           string            `json:"venue_name"`
	OwnerID             string            `json:"owner_id"`
	City                string            `json:"city"`
	District            string            `json:"district"`
	State               string            `json:"state"`
	OnboardingStatus    OnboardingStatus  `json:"onboarding_status"`
	PrimaryImage        *string           `json:"primary_image,omitempty"`
	PricePerHour        *float64          `json:"price_per_hour,omitempty"`
	WeekendPricePerHour *float64          `json:"weekend_price_per_hour,omitempty"`
	Currency            string            `json:"currency,omitempty"`
	CreatedAt           time.Time         `json:"created_at"`
}

type VenueDetail struct {
	VenueID           uuid.UUID         `json:"venue_id"`
	OwnerID           string            `json:"owner_id"`
	OnboardingStatus  OnboardingStatus  `json:"onboarding_status"`
	ReviewedBy        *uuid.UUID        `json:"reviewed_by,omitempty"`
	AdminNotes        *string           `json:"admin_notes,omitempty"`
	VenueName         string            `json:"venue_name"`
	Addressline1      string            `json:"addressline_1"`
	Addressline2      *string           `json:"addressline_2,omitempty"`
	Phone             string            `json:"phone"`
	PhonePrivate      *string           `json:"phone_private,omitempty"`
	Email             string            `json:"email"`
	City              string            `json:"city"`
	District          string            `json:"district"`
	State             string            `json:"state"`
	PostalCode        string            `json:"postal_code"`
	CountryCode       string            `json:"country_code"`
	Latitude          *string           `json:"latitude,omitempty"`
	Longitude         *string           `json:"longitude,omitempty"`
	SeatingCapacity   int               `json:"seating_capacity"`
	MinBookingDuration string            `json:"min_booking_duration"`
	OpeningPeriod     string            `json:"opening_period"`
	ClosingPeriod     string            `json:"closing_period"`
	RelaxationPeriod  string            `json:"relaxation_period"`
	IsAirConditioned  bool              `json:"is_air_conditioned"`
	VenueType         string            `json:"venue_type"`
	Media             []VenueMedia      `json:"media"`
	Pricing           []VenuePricing    `json:"pricing,omitempty"`
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
}
