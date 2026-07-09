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
	venueRepo             domain.VenueRepository
	venueMediaRepo        domain.VenueMediaRepository
	venuePricingRepo      domain.VenuePricingRepository
	venueApplicationRepo  domain.VenueApplicationRepository
}

func NewVenueService(
	venueRepo domain.VenueRepository,
	venueMediaRepo domain.VenueMediaRepository,
	venuePricingRepo domain.VenuePricingRepository,
	venueApplicationRepo domain.VenueApplicationRepository,
) *VenueService {
	return &VenueService{
		venueRepo:            venueRepo,
		venueMediaRepo:       venueMediaRepo,
		venuePricingRepo:     venuePricingRepo,
		venueApplicationRepo: venueApplicationRepo,
	}
}

func (s *VenueService) CreateVenue(ctx context.Context, ownerID uuid.UUID, venue *domain.Venue, media []domain.VenueMedia, pricing []domain.VenuePricing) (*domain.Venue, []*domain.VenueMedia, error) {
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

	if len(pricing) > 0 {
		if err := s.venuePricingRepo.InsertBatch(ctx, *created.VenueID, pricing, true); err != nil {
			return nil, nil, fmt.Errorf("create venue pricing: %w", err)
		}
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

	venueIDs := make([]uuid.UUID, 0, len(items))
	for _, item := range items {
		venueIDs = append(venueIDs, item.VenueID)
	}

	if len(venueIDs) > 0 {
		pricingMap, err := s.venuePricingRepo.GetByVenues(ctx, venueIDs, true)
		if err == nil {
			for i, item := range items {
				if pricing, ok := pricingMap[item.VenueID]; ok {
					for _, p := range pricing {
						price := p.PricePerHour
						if !p.IsWeekend && items[i].PricePerHour == nil {
							items[i].PricePerHour = &price
							items[i].Currency = p.Currency
						}
						if p.IsWeekend && items[i].WeekendPricePerHour == nil {
							items[i].WeekendPricePerHour = &price
							items[i].Currency = p.Currency
						}
					}
				}
			}
		}
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

func (s *VenueService) GetVenuePricing(ctx context.Context, venueID uuid.UUID) ([]domain.VenuePricing, error) {
	return s.venuePricingRepo.GetByVenue(ctx, venueID, true)
}

func (s *VenueService) SubmitVenuePricing(ctx context.Context, venueID, ownerID uuid.UUID, pricing []domain.VenuePricing) ([]domain.VenuePricing, error) {
	venue, err := s.venueRepo.GetVenueByID(ctx, venueID)
	if err != nil {
		return nil, fmt.Errorf("get venue: %w", err)
	}
	if venue.OwnerID != ownerID {
		return nil, errors.New("venue does not belong to user")
	}

	// Remove old pending pricing before inserting new set
	if err := s.venuePricingRepo.DeletePending(ctx, venueID); err != nil {
		return nil, fmt.Errorf("delete old pending pricing: %w", err)
	}

	if err := s.venuePricingRepo.InsertBatch(ctx, venueID, pricing, false); err != nil {
		return nil, fmt.Errorf("insert pending pricing: %w", err)
	}

	return s.venuePricingRepo.GetByVenue(ctx, venueID, false)
}

// -------- venue application methods --------

func (s *VenueService) CreateVenueApplication(ctx context.Context, venueID, ownerID uuid.UUID, appType domain.ApplicationType) (*domain.VenueApplication, error) {
	app := &domain.VenueApplication{
		VenueID: venueID,
		OwnerID: ownerID,
		Type:    appType,
		Status:  domain.AppStatusPendingReview,
	}

	created, err := s.venueApplicationRepo.Create(ctx, app)
	if err != nil {
		return nil, fmt.Errorf("create venue application: %w", err)
	}

	if err := s.venueApplicationRepo.CancelOtherPending(ctx, venueID, created.ApplicationID); err != nil {
		return nil, fmt.Errorf("cancel other pending: %w", err)
	}

	return created, nil
}

func (s *VenueService) ApproveApplication(ctx context.Context, appID, adminID uuid.UUID, notes string) (*domain.VenueApplication, error) {
	app, err := s.venueApplicationRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, err
	}

	if app.Status != domain.AppStatusPendingReview {
		return nil, errors.New("application is not in PENDING_REVIEW status")
	}

	switch app.Type {
	case domain.AppTypeNewVenue:
		if _, err := s.venueRepo.UpdateVenueStatus(ctx, &domain.VenueStatusUpdate{
			VenueID: app.VenueID,
			AdminID: adminID,
			Status:  domain.StatusApproved,
			Notes:   notes,
		}); err != nil {
			return nil, fmt.Errorf("approve venue: %w", err)
		}

	case domain.AppTypePricingUpdate:
		if err := s.venuePricingRepo.ActivatePending(ctx, app.VenueID); err != nil {
			return nil, fmt.Errorf("activate pending pricing: %w", err)
		}
		// Also approve venue if still pending (first-time approval via pricing update)
		venue, _ := s.venueRepo.GetVenueByID(ctx, app.VenueID)
		if venue != nil && venue.OnboardingStatus != domain.StatusApproved {
			if _, err := s.venueRepo.UpdateVenueStatus(ctx, &domain.VenueStatusUpdate{
				VenueID: app.VenueID,
				AdminID: adminID,
				Status:  domain.StatusApproved,
				Notes:   notes,
			}); err != nil {
				return nil, fmt.Errorf("approve venue: %w", err)
			}
		}
	}

	updated, err := s.venueApplicationRepo.UpdateStatus(ctx, appID, domain.AppStatusApproved, adminID, notes)
	if err != nil {
		return nil, fmt.Errorf("update application status: %w", err)
	}

	return updated, nil
}

func (s *VenueService) RejectApplication(ctx context.Context, appID, adminID uuid.UUID, notes string) (*domain.VenueApplication, error) {
	app, err := s.venueApplicationRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, err
	}

	if app.Status != domain.AppStatusPendingReview {
		return nil, errors.New("application is not in PENDING_REVIEW status")
	}

	switch app.Type {
	case domain.AppTypeNewVenue:
		if _, err := s.venueRepo.UpdateVenueStatus(ctx, &domain.VenueStatusUpdate{
			VenueID: app.VenueID,
			AdminID: adminID,
			Status:  domain.StatusRejected,
			Notes:   notes,
		}); err != nil {
			return nil, fmt.Errorf("reject venue: %w", err)
		}

	case domain.AppTypePricingUpdate:
		if err := s.venuePricingRepo.DeletePending(ctx, app.VenueID); err != nil {
			return nil, fmt.Errorf("delete pending pricing: %w", err)
		}
	}

	updated, err := s.venueApplicationRepo.UpdateStatus(ctx, appID, domain.AppStatusRejected, adminID, notes)
	if err != nil {
		return nil, fmt.Errorf("update application status: %w", err)
	}

	return updated, nil
}

func (s *VenueService) ListApplications(ctx context.Context, status domain.ApplicationStatus) ([]*domain.VenueApplication, error) {
	return s.venueApplicationRepo.ListByStatus(ctx, status)
}

func (s *VenueService) ListManagerApplications(ctx context.Context, ownerID uuid.UUID) ([]*domain.VenueApplication, error) {
	return s.venueApplicationRepo.ListByOwner(ctx, ownerID)
}

func (s *VenueService) GetApplicationByID(ctx context.Context, appID uuid.UUID) (*domain.VenueApplication, error) {
	return s.venueApplicationRepo.GetByID(ctx, appID)
}
