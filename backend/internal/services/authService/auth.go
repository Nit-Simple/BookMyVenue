package authservice

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo domain.AuthRepository
	cfg  *config.Config
}

func NewAuthService(repo domain.AuthRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		repo: repo,
		cfg:  cfg,
	}
}

func (a *AuthService) RegisterUser(ctx context.Context, user *domain.UserCreate) (*domain.UserDB, error) {
	checkEmail, err := a.repo.CheckExistByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}
	if checkEmail {
		return nil, domain.ErrUserWithTheEmailAlreadyExist
	}

	checkPhone, err := a.repo.CheckExistByPhone(ctx, user.Phone)
	if err != nil {
		return nil, err
	}
	if checkPhone {
		return nil, domain.ErrUserWithThePhoneAlreadyExist
	}

	hashedPassword, err := hashPassword(user.Password)
	if err != nil {
		return nil, err
	}
	user.Password = hashedPassword

	if user.ID == "" {
		user.ID = uuid.New().String()
	}

	if user.Role == "" {
		user.Role = domain.User
	}

	userDB, err := a.repo.CreateUser(ctx, user)
	if err != nil {
		return nil, err
	}

	return userDB, nil
}

func (a *AuthService) Login(ctx context.Context, email, password, ip, userAgent string) (string, string, error) {
	user, err := a.repo.FindUserByEmail(ctx, email)
	if err != nil {
		return "", "", domain.ErrInvalidEmailOrPassword
	}

	if !validatePass(password, user.HashedPassword) {
		return "", "", domain.ErrInvalidEmailOrPassword
	}

	// Generate access token
	accessToken, err := a.generateAccessToken(user.ID, user.Role)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshTokenRaw, err := generateRandomHex(32)
	if err != nil {
		return "", "", err
	}
	refreshTokenHash := hashRefreshToken(refreshTokenRaw)

	deviceInfoMap := map[string]string{
		"user_agent": userAgent,
	}
	deviceInfoJSON, err := json.Marshal(deviceInfoMap)
	if err != nil {
		return "", "", err
	}

	session := &domain.Sessions{
		UserID:           user.ID,
		RefreshTokenHash: refreshTokenHash,
		DeviceInfo:       deviceInfoJSON,
		IPAddress:        ip,
		ExpiresAt:        time.Now().Add(a.cfg.RefreshExpiry),
	}

	err = a.repo.CreateSession(ctx, session)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshTokenRaw, nil
}

func (a *AuthService) Refresh(ctx context.Context, refreshToken, ip, userAgent string) (string, string, error) {
	oldHash := hashRefreshToken(refreshToken)

	session, err := a.repo.FindSessionByHash(ctx, oldHash)
	if err != nil {
		// Not a current token. If it's a previously-rotated (used) token, that's
		// a reuse signal: revoke the whole session family.
		if errors.Is(err, domain.ErrSessionNotFound) {
			if sid, ferr := a.repo.FindUsedToken(ctx, oldHash); ferr == nil {
				_ = a.repo.DeleteSessionByID(ctx, sid)
				return "", "", domain.ErrRefreshTokenReuse
			}
		}
		return "", "", domain.ErrSessionNotFound
	}

	if time.Now().After(session.ExpiresAt) {
		_ = a.repo.DeleteSession(ctx, oldHash)
		return "", "", domain.ErrSessionExpired
	}

	user, err := a.repo.FindByID(ctx, session.UserID)
	if err != nil {
		return "", "", domain.ErrUserNotFound
	}

	// Generate new access token
	newAccessToken, err := a.generateAccessToken(user.ID, user.Role)
	if err != nil {
		return "", "", err
	}

	// Generate new refresh token
	newRefreshTokenRaw, err := generateRandomHex(32)
	if err != nil {
		return "", "", err
	}
	newHash := hashRefreshToken(newRefreshTokenRaw)
	newExpiry := time.Now().Add(a.cfg.RefreshExpiry)

	if err := a.repo.RecordUsedToken(ctx, session.ID, oldHash); err != nil {
		// Same token consumed twice concurrently → reuse → revoke the session.
		_ = a.repo.DeleteSessionByID(ctx, session.ID)
		return "", "", domain.ErrRefreshTokenReuse
	}

	err = a.repo.UpdateSession(ctx, oldHash, newHash, newExpiry)
	if err != nil {
		if errors.Is(err, domain.ErrSessionNotFound) {
			// Concurrent rotation already advanced past this token → reuse.
			_ = a.repo.DeleteSessionByID(ctx, session.ID)
			return "", "", domain.ErrRefreshTokenReuse
		}
		return "", "", err
	}

	return newAccessToken, newRefreshTokenRaw, nil
}

func (a *AuthService) Logout(ctx context.Context, refreshToken string) error {
	hash := hashRefreshToken(refreshToken)
	return a.repo.DeleteSession(ctx, hash)
}


func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func validatePass(password string, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

