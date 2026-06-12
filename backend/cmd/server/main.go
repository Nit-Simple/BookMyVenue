package main

import (
	"context"
	"fmt"
	"os"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/handler"
	"github.com/Nit-Simple/BookMyVenue/internal/repository"
	"github.com/Nit-Simple/BookMyVenue/internal/repository/auth"
	"github.com/Nit-Simple/BookMyVenue/internal/services/authService"
	"github.com/Nit-Simple/BookMyVenue/pkg/logger"
)

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
	cache, err := repository.NewRedisConnection(ctx, cfg)
	if err != nil {
		logger.Error("failed to connect to redis", "err", err)
		os.Exit(1)
	}

	authRepo := auth.NewAuthRepository(db)
	authSvc := authservice.NewAuthService(authRepo, cfg)

	server := handler.NewServer(cfg, db, logger, cache, authSvc)
	if err := server.Start(); err != nil {
		logger.Error("unable to start the server", "err", err)
		os.Exit(1)
	}
}
