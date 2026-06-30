package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type IdempotencyStatus string

const (
	IdempotencyStatusPending  IdempotencyStatus = "PENDING"
	IdempotencyStatusFailed   IdempotencyStatus = "FAILED"
	IdempotencyStatusComplete IdempotencyStatus = "COMPLETE"
)

type IdempotencyKey struct {
	Key            string             `db:"key" json:"key"`
	PaymentID      pgtype.UUID        `db:"payment_id" json:"payment_id"`
	RequestHash    string             `db:"request_hash" json:"request_hash"`
	ResponseStatus int32              `db:"response_status" json:"response_status"`
	ResponseBody   json.RawMessage    `db:"response_body" json:"response_body"`
	CreatedAt      time.Time          `db:"created_at" json:"created_at"`
	ExpiresAt      time.Time          `db:"expires_at" json:"expires_at"`
	Status         IdempotencyStatus  `db:"status" json:"status"`
}

type IdempotencyRepository interface {
	GetByKey(ctx context.Context, key string) (*IdempotencyKey, error)
	Create(ctx context.Context, record *IdempotencyKey) error
	UpdateStatus(ctx context.Context, key string, status IdempotencyStatus, responseStatus int32, responseBody json.RawMessage) error
	DeleteExpired(ctx context.Context) error
}
