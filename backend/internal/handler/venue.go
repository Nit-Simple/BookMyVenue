package handler

import (
	"context"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) createManagerVenueHandler(c *gin.Context) {
	ctx := c.Request.Context()
	contentType := c.GetHeader("Content-Type")
	isMultipart := strings.HasPrefix(contentType, "multipart/form-data")

	var req domain.CreateVenueRequest
	var fileHeaders []*multipart.FileHeader

	if isMultipart {
		dataJSON := c.PostForm("data")
		if dataJSON == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing venue data"})
			return
		}
		if err := json.Unmarshal([]byte(dataJSON), &req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue data"})
			return
		}
		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form data"})
			return
		}
		fileHeaders = form.File["media"]
	} else {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	if req.VenueName == "" || req.Addressline1 == "" || req.Phone == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "venue_name, addressline_1, phone, email are required"})
		return
	}
	if (isMultipart && len(fileHeaders) < 3) || (!isMultipart && len(req.Media) < 3) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least 3 images are required"})
		return
	}

	minDur, err := time.ParseDuration(req.MinBookingDuration)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid min_booking_duration"})
		return
	}
	relaxDur, err := time.ParseDuration(req.RelaxationPeriod)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid relaxation_period"})
		return
	}

	ownerUUID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	venue := &domain.Venue{
		VenueName:          req.VenueName,
		Addressline1:       req.Addressline1,
		Addressline2:       req.Addressline2,
		Phone:              req.Phone,
		PhonePrivate:       req.PhonePrivate,
		Email:              req.Email,
		City:               req.City,
		District:           req.District,
		State:              req.State,
		PostalCode:         req.PostalCode,
		CountryCode:        req.CountryCode,
		SeatingCapacity:    req.SeatingCapacity,
		MinBookingDuration: minDur,
		OpeningPeriod:      req.OpeningPeriod,
		ClosingPeriod:      req.ClosingPeriod,
		RelaxationPeriod:   relaxDur,
		IsAirConditioned:   req.IsAirConditioned,
		VenueType:          req.VenueType,
	}
	if req.Latitude != nil && req.Longitude != nil {
		venue.Location = &domain.Location{Latitude: *req.Latitude, Longitude: *req.Longitude}
	}

	pricing := parsePricingInputs(req.Pricing)

	var created *domain.Venue
	var createdMedia []*domain.VenueMedia

	if isMultipart {
		created, _, err = s.venueService.CreateVenue(ctx, ownerUUID, venue, nil, pricing)
		if err != nil {
			s.logger.Error("failed to create venue", "err", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create venue"})
			return
		}

		for i, fh := range fileHeaders {
			file, err := fh.Open()
			if err != nil {
				s.logger.Error("failed to open uploaded file", "err", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process uploaded images"})
				return
			}
			uploaded, err := s.mediaService.Upload(ctx, *created.VenueID, file, fh.Filename, i == 0, int32(i))
			file.Close()
			if err != nil {
				s.logger.Error("failed to upload image to cloudinary", "err", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload images"})
				return
			}
			createdMedia = append(createdMedia, uploaded)
		}
	} else {
		media := make([]domain.VenueMedia, 0, len(req.Media))
		for _, m := range req.Media {
			var metadataJSON []byte
			if m.Metadata != nil {
				metadataJSON, _ = json.Marshal(m.Metadata)
			}
			media = append(media, domain.VenueMedia{
				URL:       m.URL,
				Primary:   m.Primary,
				Metadata:  metadataJSON,
				SortOrder: m.SortOrder,
			})
		}

		created, createdMedia, err = s.venueService.CreateVenue(ctx, ownerUUID, venue, media, pricing)
		if err != nil {
			s.logger.Error("failed to create venue", "err", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create venue"})
			return
		}
	}

	if _, err := s.venueService.CreateVenueApplication(ctx, *created.VenueID, ownerUUID, domain.AppTypeNewVenue); err != nil {
		s.logger.Error("failed to create venue application", "err", err)
	}

	c.JSON(http.StatusCreated, s.venueDetailResponse(ctx, created, createdMedia))
}

func (s *Server) listManagerVenuesHandler(c *gin.Context) {
	ctx := c.Request.Context()

	ownerUUID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	items, err := s.venueService.ListVenues(ctx, &domain.VenueFilter{
		OwnerID: &ownerUUID,
		Limit:   50,
	})
	if err != nil {
		s.logger.Error("failed to list manager venues", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list venues"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (s *Server) getManagerVenueByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	venue, media, err := s.venueService.GetVenueDetail(ctx, venueID)
	if err != nil {
		if errors.Is(err, domain.ErrVenueNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		s.logger.Error("failed to get venue", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get venue"})
		return
	}

	c.JSON(http.StatusOK, s.venueDetailResponse(ctx, venue, media))
}

func (s *Server) updateManagerVenueHandler(c *gin.Context) {
	ctx := c.Request.Context()
	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	userUUID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	existing, _, err := s.venueService.GetVenueDetail(ctx, venueID)
	if err != nil {
		if errors.Is(err, domain.ErrVenueNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		s.logger.Error("failed to get venue", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get venue"})
		return
	}

	if existing.OwnerID != userUUID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you do not own this venue"})
		return
	}

	if existing.OnboardingStatus != domain.StatusPendingApproval {
		c.JSON(http.StatusForbidden, gin.H{"error": "can only update venue while in PENDING_APPROVAL status"})
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if v, ok := updates["venue_name"].(string); ok {
		existing.VenueName = v
	}
	if v, ok := updates["addressline_1"].(string); ok {
		existing.Addressline1 = v
	}
	if v, ok := updates["addressline_2"]; ok {
		if v == nil {
			existing.Addressline2 = nil
		} else if s, ok := v.(string); ok {
			existing.Addressline2 = &s
		}
	}
	if v, ok := updates["phone"].(string); ok {
		existing.Phone = v
	}
	if v, ok := updates["phone_private"]; ok {
		if v == nil {
			existing.PhonePrivate = nil
		} else if s, ok := v.(string); ok {
			existing.PhonePrivate = &s
		}
	}
	if v, ok := updates["email"].(string); ok {
		existing.Email = v
	}
	if v, ok := updates["city"].(string); ok {
		existing.City = v
	}
	if v, ok := updates["district"].(string); ok {
		existing.District = v
	}
	if v, ok := updates["state"].(string); ok {
		existing.State = v
	}
	if v, ok := updates["postal_code"].(string); ok {
		existing.PostalCode = v
	}
	if v, ok := updates["country_code"].(string); ok {
		existing.CountryCode = v
	}
	if v, ok := updates["seating_capacity"].(float64); ok {
		existing.SeatingCapacity = int(v)
	}
	if v, ok := updates["min_booking_duration"].(string); ok {
		d, err := time.ParseDuration(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid min_booking_duration"})
			return
		}
		existing.MinBookingDuration = d
	}
	if v, ok := updates["opening_period"].(string); ok {
		existing.OpeningPeriod = v
	}
	if v, ok := updates["closing_period"].(string); ok {
		existing.ClosingPeriod = v
	}
	if v, ok := updates["relaxation_period"].(string); ok {
		d, err := time.ParseDuration(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid relaxation_period"})
			return
		}
		existing.RelaxationPeriod = d
	}
	if v, ok := updates["is_air_conditioned"].(bool); ok {
		existing.IsAirConditioned = v
	}
	if v, ok := updates["venue_type"].(string); ok {
		existing.VenueType = v
	}
	if v, ok := updates["latitude"].(string); ok {
		if existing.Location == nil {
			existing.Location = &domain.Location{}
		}
		existing.Location.Latitude = v
	}
	if v, ok := updates["longitude"].(string); ok {
		if existing.Location == nil {
			existing.Location = &domain.Location{}
		}
		existing.Location.Longitude = v
	}

	updated, err := s.venueService.UpdateVenue(ctx, existing)
	if err != nil {
		s.logger.Error("failed to update venue", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update venue"})
		return
	}

	_, media, _ := s.venueService.GetVenueDetail(ctx, venueID)
	c.JSON(http.StatusOK, s.venueDetailResponse(ctx, updated, media))
}

func (s *Server) listAdminVenuesHandler(c *gin.Context) {
	ctx := c.Request.Context()

	filter := &domain.VenueFilter{Limit: 50}
	if status := c.Query("onboarding_status"); status != "" {
		s := domain.OnboardingStatus(strings.ToUpper(status))
		filter.Status = &s
	}
	if state := c.Query("state"); state != "" {
		filter.State = &state
	}
	if district := c.Query("district"); district != "" {
		filter.District = &district
	}
	if oid := c.Query("owner_id"); oid != "" {
		if id, err := uuid.Parse(oid); err == nil {
			filter.OwnerID = &id
		}
	}

	items, err := s.venueService.ListVenues(ctx, filter)
	if err != nil {
		s.logger.Error("failed to list admin venues", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list venues"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (s *Server) listVenuesHandler(c *gin.Context) {
	ctx := c.Request.Context()

	approved := domain.StatusApproved
	filter := &domain.VenueFilter{Limit: 50, Status: &approved}
	if state := c.Query("state"); state != "" {
		filter.State = &state
	}
	if district := c.Query("district"); district != "" {
		filter.District = &district
	}
	if city := c.Query("city"); city != "" {
		filter.City = &city
	}
	if venueType := c.Query("venue_type"); venueType != "" {
		filter.VenueType = &venueType
	}

	items, err := s.venueService.ListVenues(ctx, filter)
	if err != nil {
		s.logger.Error("failed to list venues", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list venues"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (s *Server) getVenueByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	venue, media, err := s.venueService.GetVenueDetail(ctx, venueID)
	if err != nil {
		if errors.Is(err, domain.ErrVenueNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
			return
		}
		s.logger.Error("failed to get venue", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get venue"})
		return
	}

	if venue.OnboardingStatus != domain.StatusApproved {
		c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
		return
	}

	c.JSON(http.StatusOK, s.venueDetailResponse(ctx, venue, media))
}

// -------- pricing --------

func parsePricingInputs(inputs []domain.CreatePricingItem) []domain.VenuePricing {
	pricing := make([]domain.VenuePricing, 0, len(inputs))
	for _, in := range inputs {
		startDate, _ := time.Parse("2006-01-02", in.StartDate)
		currency := in.Currency
		if currency == "" {
			currency = "INR"
		}
		p := domain.VenuePricing{
			PricePerHour: in.PricePerHour,
			IsWeekend:    in.IsWeekend,
			Currency:     currency,
			StartDate:    startDate,
		}
		if in.EndDate != nil {
			endDate, _ := time.Parse("2006-01-02", *in.EndDate)
			p.EndDate = &endDate
		}
		pricing = append(pricing, p)
	}
	return pricing
}

func (s *Server) getManagerVenuePricingHandler(c *gin.Context) {
	ctx := c.Request.Context()
	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	pricing, err := s.venueService.GetVenuePricing(ctx, venueID)
	if err != nil {
		s.logger.Error("failed to get venue pricing", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get pricing"})
		return
	}

	c.JSON(http.StatusOK, pricing)
}

func (s *Server) createManagerVenuePricingHandler(c *gin.Context) {
	ctx := c.Request.Context()
	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	ownerID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var inputs []domain.CreatePricingItem
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(inputs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one pricing entry is required"})
		return
	}

	pricing := parsePricingInputs(inputs)

	result, err := s.venueService.SubmitVenuePricing(ctx, venueID, ownerID, pricing)
	if err != nil {
		s.logger.Error("failed to set venue pricing", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set pricing"})
		return
	}

	if _, err := s.venueService.CreateVenueApplication(ctx, venueID, ownerID, domain.AppTypePricingUpdate); err != nil {
		s.logger.Error("failed to create pricing application", "err", err)
	}

	c.JSON(http.StatusCreated, result)
}

// -------- helpers --------

func getUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("userID")
	if !exists {
		return uuid.Nil, errors.New("userID not found in context")
	}
	str, ok := val.(string)
	if !ok {
		return uuid.Nil, errors.New("userID is not a string")
	}
	return uuid.Parse(str)
}

func (s *Server) venueDetailResponse(ctx context.Context, venue *domain.Venue, media []*domain.VenueMedia) domain.VenueDetail {
	if venue == nil {
		return domain.VenueDetail{}
	}
	pricing, _ := s.venueService.GetVenuePricing(ctx, *venue.VenueID)
	return toVenueDetail(venue, media, pricing)
}

func toVenueDetail(v *domain.Venue, media []*domain.VenueMedia, pricing []domain.VenuePricing) domain.VenueDetail {
	if v == nil {
		return domain.VenueDetail{}
	}
	mediaVals := make([]domain.VenueMedia, 0, len(media))
	for _, m := range media {
		if m != nil {
			mediaVals = append(mediaVals, *m)
		}
	}

	var lat, lng *string
	if v.Location != nil {
		if v.Location.Latitude != "" {
			lat = &v.Location.Latitude
		}
		if v.Location.Longitude != "" {
			lng = &v.Location.Longitude
		}
	}

	if pricing == nil {
		pricing = []domain.VenuePricing{}
	}

	return domain.VenueDetail{
		VenueID:            *v.VenueID,
		OwnerID:            v.OwnerID.String(),
		OnboardingStatus:   v.OnboardingStatus,
		ReviewedBy:         v.ReviewedBy,
		AdminNotes:         v.AdminNotes,
		VenueName:          v.VenueName,
		Addressline1:       v.Addressline1,
		Addressline2:       v.Addressline2,
		Phone:              v.Phone,
		PhonePrivate:       v.PhonePrivate,
		Email:              v.Email,
		City:               v.City,
		District:           v.District,
		State:              v.State,
		PostalCode:         v.PostalCode,
		CountryCode:        v.CountryCode,
		Latitude:           lat,
		Longitude:          lng,
		SeatingCapacity:    v.SeatingCapacity,
		MinBookingDuration: v.MinBookingDuration.String(),
		OpeningPeriod:      v.OpeningPeriod,
		ClosingPeriod:      v.ClosingPeriod,
		RelaxationPeriod:   v.RelaxationPeriod.String(),
		IsAirConditioned:   v.IsAirConditioned,
		VenueType:          v.VenueType,
		Media:              mediaVals,
		Pricing:            pricing,
		CreatedAt:          v.CreatedAt,
		UpdatedAt:          v.UpdatedAt,
	}
}
