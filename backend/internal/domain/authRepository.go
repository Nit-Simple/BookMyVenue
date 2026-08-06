package domain

import (
	"context"
	"time"
)

type AuthRepository interface {
	CreateUser(ctx context.Context, user *UserCreate) (*UserDB, error)
	FindByID(ctx context.Context, id string) (*UserDB, error)
	FindUserByEmail(ctx context.Context, email string) (*UserDB, error)
	CheckExistByEmail(ctx context.Context, email string) (bool, error)
	CheckRoleByID(ctx context.Context, id string) (bool, error)
	CheckExistByPhone(ctx context.Context, phone string) (bool, error)
	CreateSession(ctx context.Context, session *Sessions) error
	FindSessionByHash(ctx context.Context, refreshTokenHash string) (*Sessions, error)
	UpdateSession(ctx context.Context, oldHash, newHash string, newEXpiry time.Time) error
	DeleteSession(ctx context.Context, requestTokenHash string) error
	RecordUsedToken(ctx context.Context, sessionID, tokenHash string) error
	FindUsedToken(ctx context.Context, tokenHash string) (string, error)
	DeleteSessionByID(ctx context.Context, sessionID string) error
}
