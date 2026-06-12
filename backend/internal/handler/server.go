package handler

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	authservice "github.com/Nit-Simple/BookMyVenue/internal/services/authService"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Server struct {
	httpServer  *http.Server
	db          *pgxpool.Pool
	config      *config.Config
	logger      *slog.Logger
	cache       *redis.Client
	authService *authservice.AuthService
}

func NewServer(cfg *config.Config, db *pgxpool.Pool, logger *slog.Logger, cache *redis.Client, authService *authservice.AuthService) *Server {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	s := &Server{
		db:          db,
		config:      cfg,
		logger:      logger,
		cache:       cache,
		authService: authService,
	}
	r := gin.New()

	s.httpServer = &http.Server{
		Addr:              cfg.Addr(),
		Handler:           r,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
	}
	s.setupRoutes(r)
	return s
}

func (s *Server) Start() error {
	errCh := make(chan error, 1)

	go func() {
		s.logger.Info("server starting", "addr", s.config.Addr())
		if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return fmt.Errorf("server error: %w", err)
	case sig := <-quit:
		s.logger.Info("shutdown signal received", "signal", sig)
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.config.ShutdownTimeout)
	defer cancel()

	if err := s.httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("graceful shutdown failed: %w", err)
	}

	s.db.Close()

	s.logger.Info("server shutdown complete")
	return nil
}
