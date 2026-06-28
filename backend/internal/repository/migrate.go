package repository

import (
	"embed"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// RunMigrations applies all pending "up" migrations embedded in the binary.
// It is safe to call on every startup: already-applied migrations are skipped
// and a fully-migrated database results in no changes.
func RunMigrations(databaseURL string) error {
	src, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to load embedded migrations: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, toPgxURL(databaseURL))
	if err != nil {
		return fmt.Errorf("failed to initialize migrator: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to apply migrations: %w", err)
	}

	slog.Info("database migrations are up to date")
	return nil
}

// toPgxURL rewrites a standard postgres connection URL to the scheme expected
// by golang-migrate's pgx/v5 database driver (registered as "pgx5").
func toPgxURL(u string) string {
	for _, prefix := range []string{"postgresql://", "postgres://"} {
		if strings.HasPrefix(u, prefix) {
			return "pgx5://" + strings.TrimPrefix(u, prefix)
		}
	}
	return u
}
