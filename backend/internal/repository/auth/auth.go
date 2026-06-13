package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type authRepository struct {
	DB *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) domain.AuthRepository {
	return &authRepository{
		DB: db,
	}
}

// CheckExistByEmail checks if a user exists with the given email.
func (r *authRepository) CheckExistByEmail(ctx context.Context, email string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`
	err := r.DB.QueryRow(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

// CheckExistByPhone checks if a user exists with the given phone number.
func (r *authRepository) CheckExistByPhone(ctx context.Context, phone string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE phone = $1)`
	err := r.DB.QueryRow(ctx, query, phone).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (r *authRepository) CheckRoleByID(ctx context.Context, id string) (bool, error) {
	var IsManager bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 and role = 'venue_manager')AS "IsManager";`
	err := r.DB.QueryRow(ctx, query, id).Scan(IsManager)
	if err != nil {
		return false, err
	}
	return IsManager, nil

}

// CreateUser inserts a new user record into the users table.
func (r *authRepository) CreateUser(ctx context.Context, user *domain.UserCreate) (*domain.UserDB, error) {
	query := `
		INSERT INTO users (id, email, password, phone, role)
		VALUES ($1, $2, $3, $4, $5::user_role)
		RETURNING id, email, password, phone, role, created_at, updated_at
	`

	nullPhone := strToNullString(user.Phone)
	nullPassword := strToNullString(user.Password)

	var userDB domain.UserDB
	var scannedPhone sql.NullString
	var scannedPassword sql.NullString

	err := r.DB.QueryRow(ctx, query, user.ID, user.Email, nullPassword, nullPhone, user.Role).Scan(
		&userDB.ID,
		&userDB.Email,
		&scannedPassword,
		&scannedPhone,
		&userDB.Role,
		&userDB.CreatedAt,
		&userDB.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	userDB.HashedPassword = nullStringToStr(scannedPassword)
	userDB.Phone = nullStringToStr(scannedPhone)

	return &userDB, nil
}

// User Lookup Operations

// FindByID retrieves a user record by their ID.
func (r *authRepository) FindByID(ctx context.Context, id string) (*domain.UserDB, error) {
	query := `
		SELECT id, email, password, phone, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	var userDB domain.UserDB
	var scannedPhone sql.NullString
	var scannedPassword sql.NullString

	err := r.DB.QueryRow(ctx, query, id).Scan(
		&userDB.ID,
		&userDB.Email,
		&scannedPassword,
		&scannedPhone,
		&userDB.Role,
		&userDB.CreatedAt,
		&userDB.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	userDB.HashedPassword = nullStringToStr(scannedPassword)
	userDB.Phone = nullStringToStr(scannedPhone)

	return &userDB, nil
}

// FindUserByEmail retrieves a user record by their email address.
func (r *authRepository) FindUserByEmail(ctx context.Context, email string) (*domain.UserDB, error) {
	query := `
		SELECT id, email, password, phone, role, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	var userDB domain.UserDB
	var scannedPhone sql.NullString
	var scannedPassword sql.NullString

	err := r.DB.QueryRow(ctx, query, email).Scan(
		&userDB.ID,
		&userDB.Email,
		&scannedPassword,
		&scannedPhone,
		&userDB.Role,
		&userDB.CreatedAt,
		&userDB.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrInvalidEmailOrPassword
		}
		return nil, err
	}

	userDB.HashedPassword = nullStringToStr(scannedPassword)
	userDB.Phone = nullStringToStr(scannedPhone)

	return &userDB, nil
}

// Sessions Management Operations

// CreateSession inserts a new session record.
func (r *authRepository) CreateSession(ctx context.Context, session *domain.Sessions) error {
	query := `
		INSERT INTO sessions (user_id, refresh_token_hash, device_info, device_ip, expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	var ipVal any = session.IPAddress
	if session.IPAddress == "" {
		ipVal = nil
	}
	var devInfoVal any = session.DeviceInfo
	if len(session.DeviceInfo) == 0 {
		devInfoVal = nil
	}

	_, err := r.DB.Exec(ctx, query, session.UserID, session.RefreshTokenHash, devInfoVal, ipVal, session.ExpiresAt)
	return err
}

// FindSessionByHash retrieves a session by its refresh token hash.
func (r *authRepository) FindSessionByHash(ctx context.Context, refreshTokenHash string) (*domain.Sessions, error) {
	query := `
		SELECT id, user_id, refresh_token_hash, device_info, device_ip, expires_at, created_at, last_active
		FROM sessions
		WHERE refresh_token_hash = $1
	`
	var s domain.Sessions
	var scannedIP sql.NullString
	var id string // session ID is unexported, scan to local variable

	err := r.DB.QueryRow(ctx, query, refreshTokenHash).Scan(
		&id,
		&s.UserID,
		&s.RefreshTokenHash,
		&s.DeviceInfo,
		&scannedIP,
		&s.ExpiresAt,
		&s.CreatedAt,
		&s.LastActiveAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrSessionNotFound
		}
		return nil, err
	}

	s.IPAddress = nullStringToStr(scannedIP)
	s.DeviceInfo = nullBytesToBytes(s.DeviceInfo)

	return &s, nil
}

// UpdateSession rotates the refresh token hash and extends the expiration of a session.
func (r *authRepository) UpdateSession(ctx context.Context, oldHash, newHash string, newExpiry time.Time) error {
	query := `
		UPDATE sessions
		SET refresh_token_hash = $1, expires_at = $2, last_active = NOW()
		WHERE refresh_token_hash = $3
	`
	cmdTag, err := r.DB.Exec(ctx, query, newHash, newExpiry, oldHash)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return domain.ErrSessionNotFound
	}
	return nil
}

// DeleteSession invalidates/removes a session by its refresh token hash.
func (r *authRepository) DeleteSession(ctx context.Context, requestTokenHash string) error {
	query := `
		DELETE FROM sessions
		WHERE refresh_token_hash = $1
	`
	cmdTag, err := r.DB.Exec(ctx, query, requestTokenHash)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return domain.ErrSessionNotFound
	}
	return nil
}

// Helper functions for database scanning

// nullStringToStr converts sql.NullString to string.
func nullStringToStr(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

// strToNullString converts string to sql.NullString.
func strToNullString(s string) sql.NullString {
	return sql.NullString{
		String: s,
		Valid:  s != "",
	}
}

// nullBytesToBytes checks if bytes are nil and returns empty bytes instead.
func nullBytesToBytes(b []byte) []byte {
	if b == nil {
		return []byte{}
	}
	return b
}
