package middlewares

import (
	"context"

	"github.com/gin-gonic/gin"
)

func IdempotencyKey() gin.HandlerFunc {
	return func(c *gin.Context) {
		IdempKey := c.GetHeader("X-Idempotency-Key")
		if IdempKey == "" {
			IdempKey = generateRandomID()
		}
		c.Set("IdempotencyKey", IdempKey)
		c.Header("X-Idempotency-Key", IdempKey)

		ctx := context.WithValue(c.Request.Context(), "IdempotecyKey", IdempKey)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
