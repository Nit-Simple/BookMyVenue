package middlewares

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
)

type bodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func IdempotencyKey(repo domain.IdempotencyRepository, logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("X-Idempotency-Key")
		if key == "" {
			key = generateRandomID()
			c.Header("X-Idempotency-Key", key)
		}

		bodyBytes, err := c.GetRawData()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to read request body"})
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		hash := sha256.Sum256(bodyBytes)
		requestHash := hex.EncodeToString(hash[:])

		existing, err := repo.GetByKey(c.Request.Context(), key)
		if err != nil {
			logger.Error("idempotency: failed to check key", "key", key, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "idempotency check failed"})
			return
		}

		if existing != nil {
			switch existing.Status {
			case domain.IdempotencyStatusComplete:
				c.AbortWithStatusJSON(int(existing.ResponseStatus), existing.ResponseBody)
				return
			case domain.IdempotencyStatusPending, domain.IdempotencyStatusFailed:
				c.AbortWithStatusJSON(http.StatusConflict, gin.H{
					"error":  "idempotency key already in use",
					"key":    key,
					"status": existing.Status,
				})
				return
			}
		}

		record := &domain.IdempotencyKey{
			Key:         key,
			RequestHash: requestHash,
			Status:      domain.IdempotencyStatusPending,
			CreatedAt:   time.Now(),
			ExpiresAt:   time.Now().Add(24 * time.Hour),
		}

		if err := repo.Create(c.Request.Context(), record); err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				c.AbortWithStatusJSON(http.StatusConflict, gin.H{
					"error": "idempotency key already in use",
					"key":   key,
				})
				return
			}
			logger.Error("idempotency: failed to create key", "key", key, "error", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to create idempotency key"})
			return
		}

		c.Set("IdempotencyKey", key)

		blw := &bodyWriter{body: &bytes.Buffer{}, ResponseWriter: c.Writer}
		c.Writer = blw

		defer func() {
			status := c.Writer.Status()
			respBody := blw.body.Bytes()

			newStatus := domain.IdempotencyStatusComplete
			if status < 200 || status >= 300 {
				newStatus = domain.IdempotencyStatusFailed
			}

			if err := repo.UpdateStatus(c.Request.Context(), key, newStatus, int32(status), json.RawMessage(respBody)); err != nil {
				logger.Error("idempotency: failed to update key status", "key", key, "status", newStatus, "error", err)
			}
		}()

		c.Next()
	}
}
