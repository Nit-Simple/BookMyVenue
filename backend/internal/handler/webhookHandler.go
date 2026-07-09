package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
)

func (s *Server) razorpayWebhookHandler(c *gin.Context) {
	ctx := c.Request.Context()

	if c.Request.Body == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty request body"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}
	defer c.Request.Body.Close()

	if len(body) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty request body"})
		return
	}

	signature := c.GetHeader("X-Razorpay-Signature")
	timestamp := c.GetHeader("X-Razorpay-Webhook-Timestamp")

	if !s.razorpayService.VerifyWebhookSignature(body, signature, timestamp) {
		s.logger.Warn("webhook: invalid signature",
			"signature", signature,
			"timestamp", timestamp,
		)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid webhook signature"})
		return
	}

	var event domain.WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		s.logger.Error("webhook: failed to parse event", "error", err)
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}

	s.logger.Info("webhook: received event",
		"event", event.Event,
		"order_id", event.Payload.Payment.OrderID,
		"payment_id", event.Payload.Payment.ID,
	)

	switch event.Event {
	case "payment.captured":
		err = s.bookingService.HandlePaymentCaptured(
			ctx,
			event.Payload.Payment.OrderID,
			event.Payload.Payment.ID,
			body,
		)
		if err != nil {
			s.logger.Error("webhook: handle payment.captured failed",
				"order_id", event.Payload.Payment.OrderID,
				"payment_id", event.Payload.Payment.ID,
				"error", err,
			)
		}

	case "payment.failed":
		reason := event.Payload.Payment.ErrorDescription
		if reason == "" {
			reason = event.Payload.Payment.ErrorCode
		}
		if reason == "" {
			reason = "payment_failed"
		}

		err = s.bookingService.HandlePaymentFailed(
			ctx,
			event.Payload.Payment.OrderID,
			reason,
		)
		if err != nil {
			s.logger.Error("webhook: handle payment.failed failed",
				"order_id", event.Payload.Payment.OrderID,
				"payment_id", event.Payload.Payment.ID,
				"error", err,
			)
		}

	default:
		s.logger.Warn("webhook: unknown event type", "event", event.Event)
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
