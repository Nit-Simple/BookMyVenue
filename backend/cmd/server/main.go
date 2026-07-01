package main

import (
	"context"
	"fmt"
	"os"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/handler"
	"github.com/Nit-Simple/BookMyVenue/internal/repository"
	"github.com/Nit-Simple/BookMyVenue/internal/repository/auth"
	"github.com/Nit-Simple/BookMyVenue/internal/repository/venue"
	authservice "github.com/Nit-Simple/BookMyVenue/internal/services/authService"
	mediaService "github.com/Nit-Simple/BookMyVenue/internal/services/mediaService"
	razorpayService "github.com/Nit-Simple/BookMyVenue/internal/services/razorpayService"
	venueservice "github.com/Nit-Simple/BookMyVenue/internal/services/venueService"
	"github.com/Nit-Simple/BookMyVenue/pkg/logger"

	_ "github.com/Nit-Simple/BookMyVenue/docs"
)

// @title           BookMyVenue API
// @version         1.0
// @description     This is a venue booking service API server.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config %v\n", err)
		os.Exit(1)
	}
	logger := logger.New(cfg.Environment)
	db, err := repository.Connect(context.Background(), cfg)
	if err != nil {
		logger.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	if err := repository.RunMigrations(cfg.DatabaseURL); err != nil {
		logger.Error("failed to run database migrations", "err", err)
		os.Exit(1)
	}
	cache, err := repository.NewRedisConnection(ctx, cfg)
	if err != nil {
		logger.Error("failed to connect to redis", "err", err)
		os.Exit(1)
	}

	authRepo := auth.NewAuthRepository(db)
	authSvc := authservice.NewAuthService(authRepo, cfg)

	venueRepo := venue.NewVenueRepository(db)
	venueMediaRepo := repository.NewVenueMediaRepository(db)
	venueSvc := venueservice.NewVenueService(venueRepo, venueMediaRepo)
	razorpaySvc := razorpayService.NewRazorpayService(cfg)
	mediaSvc := mediaService.NewMediaService(cfg, venueMediaRepo, logger)

	server := handler.NewServer(cfg, db, logger, cache, authSvc, venueSvc, razorpaySvc, mediaSvc)
	if err := server.Start(); err != nil {
		logger.Error("unable to start the server", "err", err)
		os.Exit(1)
	}
}
