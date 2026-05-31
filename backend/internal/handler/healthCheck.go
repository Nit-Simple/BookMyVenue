package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (s *Server) healthCheckHandler(c *gin.Context) {
	ctx := c.Request.Context()
	dbStatus := "up"
	cacheStatus := "up"
	isUnhealthy := false
	if err := s.db.Ping(ctx); err != nil {
		s.logger.Error("Database health check failed", "error", err)
		dbStatus = "down"
		isUnhealthy = true
	}

	if err := s.cache.Ping(ctx).Err(); err != nil {
		s.logger.Error("cache health check failed", "error", err)
		cacheStatus = "down"
		isUnhealthy = true
	}

	responsePayload := gin.H{
		"database": dbStatus,
		"redis":    cacheStatus,
		"status":   "healthy",
	}

	if isUnhealthy {
		responsePayload["status"] = "unhealthy"
		c.JSON(http.StatusServiceUnavailable, responsePayload)
		return
	}

	c.JSON(http.StatusOK, responsePayload)
}
