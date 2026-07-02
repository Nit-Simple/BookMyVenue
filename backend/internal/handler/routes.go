package handler

import (
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/Nit-Simple/BookMyVenue/internal/middlewares"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func (s *Server) setupRoutes(r *gin.Engine) {
	r.Use(gin.Recovery())
	r.Use(middlewares.CORS(s.config.AllowedOrigins))
	r.Use(middlewares.RequestID())
	r.Use(middlewares.RequestLogger(s.logger))

	r.GET("/health", s.healthCheckHandler)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", s.registerHandler)
		auth.POST("/login", s.loginHandler)
		auth.POST("/refresh", s.refreshHandler)
		auth.POST("/logout", s.logoutHandler)
	}

	r.GET("/api/v1/venues", s.listVenuesHandler)
	r.GET("/api/v1/venues/:venue_id", s.getVenueByIDHandler)

	// Manager venue and pricing routes
	manager := r.Group("/api/v1/manager/venues")
	manager.Use(middlewares.RequireAuth(s.config.JWTPublicKey))
	manager.Use(middlewares.RequireRoles(domain.VenueManager))
	{
		manager.POST("", s.createManagerVenueHandler)
		manager.GET("", s.listManagerVenuesHandler)
		manager.GET("/:venue_id", s.getManagerVenueByIDHandler)
		manager.PATCH("/:venue_id", s.updateManagerVenueHandler)
		manager.GET("/:venue_id/pricing", s.getManagerVenuePricingHandler)
		manager.POST("/:venue_id/pricing", s.createManagerVenuePricingHandler)
		manager.PATCH("/:venue_id/pricing/:pricing_id", s.updateManagerVenuePricingHandler)
		manager.GET("/applications", s.listManagerApplicationsHandler)
	}

	admin := r.Group("/api/v1/admin")
	admin.Use(middlewares.RequireAuth(s.config.JWTPublicKey))
	admin.Use(middlewares.RequireRoles(domain.Admin))
	{
		admin.GET("/venues", s.listAdminVenuesHandler)
		admin.GET("/applications", s.listAdminApplicationsHandler)
		admin.GET("/applications/:application_id", s.getApplicationByIDHandler)
		admin.PATCH("/applications/:application_id/approve", s.approveApplicationByIDHandler)
		admin.PATCH("/applications/:application_id/reject", s.rejectApplicationByIDHandler)
	}

	bookings := r.Group("/api/v1/bookings")
	bookings.Use(middlewares.RequireAuth(s.config.JWTPublicKey))
	{
		bookings.POST("", s.createBookingHandler)
		bookings.GET("", s.listBookingsHandler)
		bookings.GET("/:booking_id", s.getBookingByIDHandler)
		bookings.DELETE("/:booking_id", s.cancelBookingHandler)
	}
}

