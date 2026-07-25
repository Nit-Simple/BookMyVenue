package handler

import (
	"errors"
	"net/http"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// -------- application listing --------

func (s *Server) listAdminApplicationsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	status := c.Query("status")
	if status == "" {
		status = "PENDING_REVIEW"
	}

	switch status {
	case "PENDING_REVIEW", "APPROVED", "REJECTED", "CANCELLED":
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	apps, err := s.venueService.ListApplications(ctx, domain.ApplicationStatus(status))
	if err != nil {
		s.logger.Error("failed to list applications", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list applications"})
		return
	}

	c.JSON(http.StatusOK, apps)
}

func (s *Server) listManagerApplicationsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	ownerUUID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	apps, err := s.venueService.ListManagerApplications(ctx, ownerUUID)
	if err != nil {
		s.logger.Error("failed to list manager applications", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list applications"})
		return
	}

	c.JSON(http.StatusOK, apps)
}

func (s *Server) getApplicationByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	appID, err := uuid.Parse(c.Param("application_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid application id"})
		return
	}

	app, err := s.venueService.GetApplicationByID(ctx, appID)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		s.logger.Error("failed to get application", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get application"})
		return
	}

	c.JSON(http.StatusOK, app)
}

func (s *Server) approveApplicationByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	appID, err := uuid.Parse(c.Param("application_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid application id"})
		return
	}

	adminUUID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req domain.ApproveRejectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	result, err := s.venueService.ApproveApplication(ctx, appID, adminUUID, req.Notes)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		s.logger.Error("failed to approve application", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"application_id":    result.ApplicationID,
		"venue_id":          result.VenueID,
		"onboarding_status": domain.StatusApproved,
		"status":            result.Status,
	})
}

func (s *Server) rejectApplicationByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	appID, err := uuid.Parse(c.Param("application_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid application id"})
		return
	}

	adminUUID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req domain.ApproveRejectRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Notes == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rejection reason is required"})
		return
	}

	result, err := s.venueService.RejectApplication(ctx, appID, adminUUID, req.Notes)
	if err != nil {
		if errors.Is(err, domain.ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		s.logger.Error("failed to reject application", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reject application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"application_id":    result.ApplicationID,
		"venue_id":          result.VenueID,
		"onboarding_status": domain.StatusRejected,
		"status":            result.Status,
	})
}
