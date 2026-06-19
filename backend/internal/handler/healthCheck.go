package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// healthCheckHandler handles health check requests.
// @Summary      Health check
// @Description  Check the health status of database and cache dependencies.
// @Tags         health
// @Produce      json
// @Success      200  {object}  map[string]string
// @Failure      503  {object}  map[string]string
// @Router       /health [get]
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
