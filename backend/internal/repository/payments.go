package repository

import "github.com/jackc/pgx/v5/pgxpool"

type paymentRepository struct {
	DB *pgxpool.Pool
}

func NewPaymentRepository(db *pgxpool.Pool) *domain.PaymentRepository {
	return &paymentRepository{
		DB: db,
	}
}
