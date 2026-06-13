package authservice

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/golang-jwt/jwt/v5"
)

func (a *AuthService) generateAccessToken(userID string, role string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(a.cfg.JWTExpiry).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	return token.SignedString(a.cfg.JWTPrivateKey)
}

func (a *AuthService) ValidateAccessToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodEd25519); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return a.cfg.JWTPublicKey, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, domain.ErrTokenInvalid
}

func generateRandomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func hashRefreshToken(token string) string {
	h := sha256.New()
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}
