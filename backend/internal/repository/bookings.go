package repository

import "github.com/jackc/pgx/v5/pgxpool"

type bookingRepository struct {
	DB *pgxpool.Pool
}

func NewBookingRepository(db *pgxpool.Pool) *domain.BookingRepository {
	return &bookingRepository{
		DB: db,
	}
}
