package domain

import (
	"time"
)

type Role string

const (
	Admin        Role = "admin"
	VenueManager Role = "venue_manager"
	User         Role = "user"
)

type UserCreate struct {
	ID       string `json:"user_id" validate:"min:3,max:4"`
	Email    string `json:"email" validate:"min:required,email"`
	Role     Role   `json:"role"`
	Password string `json:"password" validate:"min:6,max:20"`
	Phone    string `json:"phone,omitempty"`
}

type Sessions struct {
	id               string    `db:"id"`
	UserID           string    `db:"user_id"`
	RefreshTokenHash string    `db:"refresh_token_hash"`
	DeviceInfo       []byte    `db:"device_info"`
	IPAddress        string    `db:"device_ip"`
	ExpiresAt        time.Time `db:"expires_at"`
	CreatedAt        time.Time `db:"created_at"`
	LastActiveAt     time.Time `db:"last_active"`
}
type UserDB struct {
	ID             string    `db:"id"`
	Email          string    `db:"email"`
	HashedPassword string    `db:"hashed_password"`
	Phone          string    `db:"phone,omitempty"`
	Role           string    `db:"role"`
	CreatedAt      time.Time `db:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"`
}
