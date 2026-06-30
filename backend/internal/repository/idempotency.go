package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type idempotencyRepository struct {
	DB *pgxpool.Pool
}

func NewIdempotencyRepository(db *pgxpool.Pool) domain.IdempotencyRepository {
	return &idempotencyRepository{DB: db}
}

func (r *idempotencyRepository) GetByKey(ctx context.Context, key string) (*domain.IdempotencyKey, error) {
	query := `
		SELECT
			key, payment_id, request_hash, response_status, response_body,
			created_at, expires_at, status
		FROM idempotency_keys
		WHERE key = $1;
	`

	var record domain.IdempotencyKey
	err := r.DB.QueryRow(ctx, query, key).Scan(
		&record.Key,
		&record.PaymentID,
		&record.RequestHash,
		&record.ResponseStatus,
		&record.ResponseBody,
		&record.CreatedAt,
		&record.ExpiresAt,
		&record.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get idempotency key: %w", err)
	}

	return &record, nil
}

func (r *idempotencyRepository) Create(ctx context.Context, record *domain.IdempotencyKey) error {
	query := `
		INSERT INTO idempotency_keys (
			key, payment_id, request_hash, response_status, response_body,
			created_at, expires_at, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		)
		RETURNING
			key, payment_id, request_hash, response_status, response_body,
			created_at, expires_at, status;
	`

	err := r.DB.QueryRow(
		ctx, query,
		record.Key,
		record.PaymentID,
		record.RequestHash,
		record.ResponseStatus,
		record.ResponseBody,
		record.CreatedAt,
		record.ExpiresAt,
		record.Status,
	).Scan(
		&record.Key,
		&record.PaymentID,
		&record.RequestHash,
		&record.ResponseStatus,
		&record.ResponseBody,
		&record.CreatedAt,
		&record.ExpiresAt,
		&record.Status,
	)
	if err != nil {
		return fmt.Errorf("failed to create idempotency key: %w", err)
	}

	return nil
}

func (r *idempotencyRepository) UpdateStatus(
	ctx context.Context,
	key string,
	status domain.IdempotencyStatus,
	responseStatus int32,
	responseBody json.RawMessage,
) error {
	query := `
		UPDATE idempotency_keys
		SET
			status = $1,
			response_status = $2,
			response_body = $3
		WHERE key = $4
		  AND status = 'PENDING';
	`

	result, err := r.DB.Exec(ctx, query, status, responseStatus, responseBody, key)
	if err != nil {
		return fmt.Errorf("failed to update idempotency key status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return domain.ErrIdempotencyConflict
	}

	return nil
}

func (r *idempotencyRepository) DeleteExpired(ctx context.Context) error {
	query := `DELETE FROM idempotency_keys WHERE expires_at < NOW();`

	_, err := r.DB.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to delete expired idempotency keys: %w", err)
	}

	return nil
}
