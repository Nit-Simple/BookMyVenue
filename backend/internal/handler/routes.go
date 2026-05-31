package handler

import (
	"github.com/Nit-Simple/BookMyVenue/internal/middlewares"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func (s *Server) setupRoutes() *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middlewares.RequestLogger(s.logger))
	return r
}
