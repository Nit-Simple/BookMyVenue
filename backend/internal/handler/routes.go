package handler

import (
	"github.com/Nit-Simple/BookMyVenue/internal/middlewares"
	"github.com/gin-gonic/gin"
)

func (s *Server) setupRoutes(r *gin.Engine) {
	r.Use(gin.Recovery())
	r.Use(middlewares.RequestID())
	r.Use(middlewares.RequestLogger(s.logger))

	r.GET("/health", s.healthCheckHandler)
}
