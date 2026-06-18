package handler

import (
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/Nit-Simple/BookMyVenue/internal/middlewares"
	"github.com/gin-gonic/gin"
)

func (s *Server) setupRoutes(r *gin.Engine) {
	r.Use(gin.Recovery())
	r.Use(middlewares.RequestID())
	r.Use(middlewares.RequestLogger(s.logger))

	r.GET("/health", s.healthCheckHandler)

	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", s.registerHandler)
		auth.POST("/login", s.loginHandler)
		auth.POST("/refresh", s.refreshHandler)
		auth.POST("/logout", s.logoutHandler)
	}

	// Venue application routes
	venues := r.Group("/api/v1/venues")
	venues.Use(middlewares.RequireAuth(s.config.JWTPublicKey))
	venues.Use(middlewares.RequireRoles(domain.VenueManager))
	{
		venues.POST("/applications",s.submitVenueApplicationHandler)
	}

	admin := r.Group("/api/v1/admin")
	admin.Use(middlewares.RequireAuth(s.config.JWTPublicKey))
	admin.Use(middlewares.RequireRoles(domain.Admin))
	{
		admin.POST("/venues/applications/:id/approve", s.approveVenueApplicationHandler)
		admin.POST("/venues/applications/:id/reject", s.rejectVenueApplicationHandler)
	}
}

