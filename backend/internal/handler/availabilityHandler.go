package handler

import (
	"net/http"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// checkVenueAvailabilityHandler checks whether a venue is bookable for the given time window.
// @Summary      Check venue availability
// @Description  Check whether an approved venue has no overlapping booking for the requested time window.
// @Tags         venues
// @Accept       json
// @Produce      json
// @Param        venue_id   path      string  true  "Venue ID"
// @Param        start_time query     string  true  "Start time (RFC3339)"
// @Param        end_time   query     string  true  "End time (RFC3339)"
// @Success      200        {object}  domain.AvailabilityCheckResponse
// @Failure      400        {object}  map[string]string
// @Router       /api/v1/venues/{venue_id}/availability [get]
func (s *Server) checkVenueAvailabilityHandler(c *gin.Context) {
	ctx := c.Request.Context()

	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	var req domain.AvailabilityCheckRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_time and end_time are required in RFC3339 format"})
		return
	}
	req.VenueID = venueID.String()

	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := s.bookingService.CheckAvailability(ctx, req.VenueID, req.StartTime, req.EndTime, req.GuestCount)
	if err != nil {
		s.logger.Error("check availability failed", "venue_id", venueID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check availability"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
