package domain

import "errors"

var (
	ErrTokenInvalid                 = errors.New("Invalid token")
	ErrTokenExpired                 = errors.New("Token expired")
	ErrTokenNotFound                = errors.New("Token not found")
	ErrInvalidEmailOrPassword       = errors.New("Invalid email or password")
	ErrUserWithTheEmailAlreadyExist = errors.New("email already used")
	ErrUserWithThePhoneAlreadyExist = errors.New("phone already used")
	ErrUserNotFound                 = errors.New("user not found")
	ErrSessionNotFound              = errors.New("session not found")
	ErrSessionExpired               = errors.New("session expired")
)
