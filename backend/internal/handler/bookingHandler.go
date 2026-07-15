package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) createBookingHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req domain.BookNowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.VenueID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "venue_id is required"})
		return
	}
	if req.StartTime.IsZero() || req.EndTime.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_time and end_time are required"})
		return
	}
	if !req.EndTime.After(req.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_time must be after start_time"})
		return
	}
	if req.GuestCount < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "guest_count must be at least 1"})
		return
	}

	resp, err := s.bookingService.CreateBooking(ctx, userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrVenueNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "venue not found"})
		case errors.Is(err, domain.ErrVenueNotAvailableInTime):
			c.JSON(http.StatusConflict, gin.H{"error": "venue not available for the requested time slot"})
		case errors.Is(err, domain.ErrVenueNotApproved):
			c.JSON(http.StatusForbidden, gin.H{"error": "venue is not approved for booking"})
		default:
			s.logger.Error("create booking failed", "user_id", userID, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create booking"})
		}
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (s *Server) confirmPaymentHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bookingID := c.Param("booking_id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "booking_id is required"})
		return
	}

	var req struct {
		RazorpayPaymentID string `json:"razorpay_payment_id" binding:"required"`
		RazorpayOrderID   string `json:"razorpay_order_id" binding:"required"`
		RazorpaySignature string `json:"razorpay_signature" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "razorpay_payment_id, razorpay_order_id, razorpay_signature are required"})
		return
	}

	confirmed, err := s.bookingService.ConfirmPayment(ctx, bookingID, userID, req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrPaymentUpdateConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "payment already processed"})
		case errors.Is(err, domain.ErrBookingConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "booking already confirmed"})
		default:
			s.logger.Error("confirm payment failed", "booking_id", bookingID, "error", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "payment verification failed"})
		}
		return
	}

	c.JSON(http.StatusOK, confirmed)
}

func (s *Server) listBookingsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit := 10
	offset := 0
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "10")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(c.DefaultQuery("offset", "0")); err == nil && o >= 0 {
		offset = o
	}

	var statusFilters []*domain.BookingStatus
	if statusStr := c.Query("status"); statusStr != "" {
		for _, s := range strings.Split(statusStr, ",") {
			s = strings.TrimSpace(s)
			if s != "" {
				st := domain.BookingStatus(s)
				statusFilters = append(statusFilters, &st)
			}
		}
	}

	bookings, total, err := s.bookingService.ListUserBookings(ctx, userID, statusFilters, limit, offset)
	if err != nil {
		s.logger.Error("list bookings failed", "user_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (s *Server) listManagerBookingsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit := 10
	offset := 0
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "10")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(c.DefaultQuery("offset", "0")); err == nil && o >= 0 {
		offset = o
	}

	var statusFilters []*domain.BookingStatus
	if statusStr := c.Query("status"); statusStr != "" {
		for _, s := range strings.Split(statusStr, ",") {
			s = strings.TrimSpace(s)
			if s != "" {
				st := domain.BookingStatus(s)
				statusFilters = append(statusFilters, &st)
			}
		}
	}

	bookings, total, err := s.bookingService.ListManagerBookings(ctx, userID, statusFilters, limit, offset)
	if err != nil {
		s.logger.Error("list manager bookings failed", "owner_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (s *Server) listManagerUpcomingBookingsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit := 10
	offset := 0
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "10")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(c.DefaultQuery("offset", "0")); err == nil && o >= 0 {
		offset = o
	}

	bookings, total, err := s.bookingService.ListManagerUpcomingBookings(ctx, userID, limit, offset)
	if err != nil {
		s.logger.Error("list manager upcoming bookings failed", "owner_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list upcoming bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (s *Server) listManagerOngoingBookingsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit := 10
	offset := 0
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "10")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(c.DefaultQuery("offset", "0")); err == nil && o >= 0 {
		offset = o
	}

	bookings, total, err := s.bookingService.ListManagerOngoingBookings(ctx, userID, limit, offset)
	if err != nil {
		s.logger.Error("list manager ongoing bookings failed", "owner_id", userID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list ongoing bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (s *Server) listManagerVenueBookingsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	venueID, err := uuid.Parse(c.Param("venue_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid venue id"})
		return
	}

	limit := 10
	offset := 0
	if l, err := strconv.Atoi(c.DefaultQuery("limit", "10")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(c.DefaultQuery("offset", "0")); err == nil && o >= 0 {
		offset = o
	}

	var statusFilters []*domain.BookingStatus
	if statusStr := c.Query("status"); statusStr != "" {
		for _, s := range strings.Split(statusStr, ",") {
			s = strings.TrimSpace(s)
			if s != "" {
				st := domain.BookingStatus(s)
				statusFilters = append(statusFilters, &st)
			}
		}
	}

	bookings, total, err := s.bookingService.ListManagerVenueBookings(ctx, venueID, userID, statusFilters, limit, offset)
	if err != nil {
		s.logger.Error("list manager venue bookings failed", "venue_id", venueID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list venue bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (s *Server) getManagerBookingDetailHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bookingID, err := uuid.Parse(c.Param("booking_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid booking id"})
		return
	}

	detail, err := s.bookingService.GetManagerBookingDetail(ctx, bookingID, userID)
	if err != nil {
		s.logger.Error("get manager booking detail failed", "booking_id", bookingID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch booking details"})
		return
	}
	if detail == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}

	c.JSON(http.StatusOK, detail)
}

func (s *Server) getBookingByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bookingID := c.Param("booking_id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "booking_id is required"})
		return
	}

	booking, err := s.bookingService.GetBooking(ctx, bookingID)
	if err != nil {
		s.logger.Error("get booking failed", "booking_id", bookingID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch booking"})
		return
	}
	if booking == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}

	if booking.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "booking does not belong to user"})
		return
	}

	c.JSON(http.StatusOK, booking)
}

func (s *Server) cancelBookingHandler(c *gin.Context) {
	ctx := c.Request.Context()

	userID, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bookingID := c.Param("booking_id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "booking_id is required"})
		return
	}

	var req domain.CancelBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reason is required (min 5 characters)"})
		return
	}
	if req.Reason == "" {
		req.Reason = "user requested cancellation"
	}

	if req.BookingID == "" {
		req.BookingID = bookingID
	}

	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := s.bookingService.CancelBooking(ctx, bookingID, userID, req.Reason)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrBookingFailed):
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found or not cancellable"})
		default:
			s.logger.Error("cancel booking failed", "booking_id", bookingID, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel booking"})
		}
		return
	}

	c.JSON(http.StatusOK, resp)
}
