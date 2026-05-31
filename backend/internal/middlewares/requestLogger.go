package middlewares

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

func RequestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		ctx := c.Request.Context()
		reqID := c.GetString("RequestIDKey")
		logger.InfoContext(ctx, "HTTP Request",
			slog.String("req_id", reqID),
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.Int("status", c.Writer.Status()),
			slog.Int("bytes", c.Writer.Size()),
			slog.Duration("duration", time.Since(start)),
			slog.String("ip", c.ClientIP()),
		)

	}
}
