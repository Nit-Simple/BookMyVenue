package main

import (
	"context"
	"log/slog"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
)

// runBookingReaper periodically cancels PENDING bookings whose expires_at has
// passed, freeing their slots. It runs until ctx is cancelled so it shuts down
// gracefully with the server.
func runBookingReaper(ctx context.Context, repo domain.BookingRepository, logger *slog.Logger, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	logger.Info("booking reaper started", "interval", interval.String())
	for {
		select {
		case <-ctx.Done():
			logger.Info("booking reaper stopped")
			return
		case <-ticker.C:
			count, err := repo.ExpireStaleBookings(ctx)
			if err != nil {
				logger.Error("booking reaper sweep failed", "err", err)
				continue
			}
			if count > 0 {
				logger.Info("booking reaper expired pending bookings", "count", count)
			}
		}
	}
}
