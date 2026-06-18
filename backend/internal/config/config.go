// internal/config/config.go

package config

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Server
	Host         string
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
	ReadHeaderTimeout time.Duration

	// Database
	DatabaseURL   string
	DBMaxConns    int32
	DBMinConns    int32
	DBMaxConnIdle time.Duration
	//redis
	RedisURL string
	// App
	Environment   string
	EncryptionKey []byte

	JWTPrivateKey ed25519.PrivateKey
	JWTPublicKey  ed25519.PublicKey
	JWTExpiry     time.Duration
	RefreshExpiry time.Duration
}

func (c *Config) Addr() string {
	return c.Host + ":" + c.Port
}

func Load() (*Config, error) {
	cfg := &Config{}
	var errs []string

	// required fields — fail if missing
	cfg.DatabaseURL = requireEnv("DATABASE_URL", &errs)
	encKey := requireEnv("ENCRYPTION_KEY", &errs)
	cfg.RedisURL = requireEnv("REDIS_URL", &errs)

	// optional with defaults
	cfg.Host = getEnv("HOST", "0.0.0.0")
	cfg.Port = getEnv("PORT", "8080")
	cfg.Environment = getEnv("ENVIRONMENT", "development")

	// typed parsing
	cfg.ReadTimeout = getDuration("READ_TIMEOUT", 5*time.Second)
	cfg.WriteTimeout = getDuration("WRITE_TIMEOUT", 10*time.Second)
	cfg.IdleTimeout = getDuration("IDLE_TIMEOUT", 120*time.Second)
	cfg.ShutdownTimeout = getDuration("SHUTDOWN_TIMEOUT", 30*time.Second)

	cfg.DBMaxConns = int32(getInt("DB_MAX_CONNS", 25))
	cfg.DBMinConns = int32(getInt("DB_MIN_CONNS", 5))
	cfg.DBMaxConnIdle = getDuration("DB_MAX_CONN_IDLE", 30*time.Minute)
	cfg.ReadHeaderTimeout = getDuration("READ_HEADER_TIMEOUT", 2*time.Second)

	cfg.JWTExpiry = getDuration("JWT_EXPIRY", 15*time.Minute)
	cfg.RefreshExpiry = getDuration("REFRESH_EXPIRY", 7*24*time.Hour)

	jwtPrivKeyraw := requireEnv("JWT_PRIVATE_KEY", &errs) // base64-encoded
	jwtPubKeyraw := requireEnv("JWT_PUBLIC_KEY", &errs)

	// decode JWT private key
	privBytes, err := base64.StdEncoding.DecodeString(jwtPrivKeyraw)
	if err != nil {
		return nil, fmt.Errorf("config: JWT_PRIVATE_KEY invalid base64: %w", err)
	}
	if len(privBytes) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("config: JWT_PRIVATE_KEY must be %d bytes, got %d", ed25519.PrivateKeySize, len(privBytes))
	}
	cfg.JWTPrivateKey = ed25519.PrivateKey(privBytes)

	// decode JWT public key
	pubBytes, err := base64.StdEncoding.DecodeString(jwtPubKeyraw)
	if err != nil {
		return nil, fmt.Errorf("config: JWT_PUBLIC_KEY invalid base64: %w", err)
	}
	if len(pubBytes) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("config: JWT_PUBLIC_KEY must be %d bytes, got %d", ed25519.PublicKeySize, len(pubBytes))
	}
	cfg.JWTPublicKey = ed25519.PublicKey(pubBytes)

	// validation after parsing
	if len(encKey) != 64 {
		return nil, fmt.Errorf("config: ENCRYPTION_KEY must be 64 hex characters (32 bytes)")
	}
	key, err := hex.DecodeString(encKey)
	if err != nil {
		return nil, fmt.Errorf("config: ENCRYPTION_KEY must be valid hex: %w", err)
	}
	cfg.EncryptionKey = key

	return cfg, nil
}

func requireEnv(key string, errs *[]string) string {
	v := os.Getenv(key)
	if v == "" {
		*errs = append(*errs, key)
	}
	return v
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func getInt(key string, defaultVal int) int {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return defaultVal
	}
	return n
}
func getDuration(key string, defaultVal time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return defaultVal
	}
	return d
}
