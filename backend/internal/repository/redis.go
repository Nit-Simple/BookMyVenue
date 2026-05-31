package repository

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/redis/go-redis/v9"
)

func NewRedisConnection(ctx context.Context, cfg *config.Config) (*redis.Client, error) {
	conn, err := redis.ParseURL(cfg.RedisUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	rdb := redis.NewClient(conn)

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping failed: %w", err)
	}

	slog.Info("successfully connected to redis")

	return rdb, nil
}
