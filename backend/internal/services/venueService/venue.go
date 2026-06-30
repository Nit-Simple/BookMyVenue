package venueservice

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
)

type VenueService struct {
	venueRepo      domain.VenueRepository
	venueMediaRepo domain.VenueMediaRepository
}

func NewVenueService(venueRepo domain.VenueRepository, venueMediaRepo domain.VenueMediaRepository) *VenueService {
	return &VenueService{
		venueRepo:      venueRepo,
		venueMediaRepo: venueMediaRepo,
	}
}

func (s *VenueService) CreateVenue(ctx context.Context, ownerID uuid.UUID, venue *domain.Venue, media []domain.VenueMedia) (*domain.Venue, []*domain.VenueMedia, error) {
	venue.OwnerID = ownerID
	venue.OnboardingStatus = domain.StatusPendingApproval
	venue.CreatedAt = time.Now()
	venue.UpdatedAt = time.Now()

	created, err := s.venueRepo.CreateVenue(ctx, venue)
	if err != nil {
		return nil, nil, fmt.Errorf("create venue: %w", err)
	}

	createdMedia := make([]*domain.VenueMedia, 0, len(media))
	for _, m := range media {
		m.VenueID = *created.VenueID
		cm, err := s.venueMediaRepo.Create(ctx, &m)
		if err != nil {
			return nil, nil, fmt.Errorf("create venue media: %w", err)
		}
		createdMedia = append(createdMedia, cm)
	}

	return created, createdMedia, nil
}

func (s *VenueService) GetVenueDetail(ctx context.Context, venueID uuid.UUID) (*domain.Venue, []*domain.VenueMedia, error) {
	venue, err := s.venueRepo.GetVenueByID(ctx, venueID)
	if err != nil {
		return nil, nil, err
	}

	media, err := s.venueMediaRepo.ListByVenue(ctx, venueID)
	if err != nil {
		return nil, nil, fmt.Errorf("list venue media: %w", err)
	}

	return venue, media, nil
}

func (s *VenueService) ListVenues(ctx context.Context, filter *domain.VenueFilter) ([]domain.VenueListItem, error) {
	venues, err := s.venueRepo.ListVenueByFilter(ctx, filter)
	if err != nil {
		return nil, err
	}

	items := make([]domain.VenueListItem, 0, len(venues))
	for _, v := range venues {
		item := domain.VenueListItem{
			VenueID:          *v.VenueID,
			VenueName:        v.VenueName,
			OwnerID:          v.OwnerID.String(),
			City:             v.City,
			District:         v.District,
			State:            v.State,
			OnboardingStatus: v.OnboardingStatus,
			CreatedAt:        v.CreatedAt,
		}

		media, err := s.venueMediaRepo.ListByVenue(ctx, *v.VenueID)
		if err == nil {
			for _, m := range media {
				if m.Primary {
					item.PrimaryImage = &m.URL
					break
				}
			}
			if item.PrimaryImage == nil && len(media) > 0 {
				item.PrimaryImage = &media[0].URL
			}
		}

		items = append(items, item)
	}

	return items, nil
}

func (s *VenueService) UpdateVenue(ctx context.Context, venue *domain.Venue) (*domain.Venue, error) {
	if venue.VenueID == nil {
		return nil, domain.ErrVenueIDRequired
	}

	existing, err := s.venueRepo.GetVenueByID(ctx, *venue.VenueID)
	if err != nil {
		return nil, err
	}

	if existing.OnboardingStatus != domain.StatusPendingApproval {
		return nil, errors.New("can only update venue while in PENDING_APPROVAL status")
	}

	return s.venueRepo.UpdateVenue(ctx, venue)
}

func (s *VenueService) UpdateVenueStatus(ctx context.Context, update *domain.VenueStatusUpdate) (*domain.VenueStatusResult, error) {
	return s.venueRepo.UpdateVenueStatus(ctx, update)
}
