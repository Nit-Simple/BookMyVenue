package middlewares

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqId := c.GetHeader("X-Request-ID")

		if reqId == "" {
			reqId = generateRandomID()
		}
		c.Set("RequestIDKey", reqId)
		c.Header("X-Request-ID", reqId)

		ctx := context.WithValue(c.Request.Context(), "RequestIDKey", reqId)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func generateRandomID() string {
	return uuid.New().String()
}
