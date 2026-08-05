package razorpayService

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
)

type RazorpayService struct {
	cfg           *config.Config
	httpClient    *http.Client
	webhookSecret string
}

func NewRazorpayService(cfg *config.Config) *RazorpayService {
	return &RazorpayService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		webhookSecret: cfg.RazorpayWebhookSecret,
	}
}

func (s *RazorpayService) CreateOrder(ctx context.Context, req *domain.CreateOrderRequest) (*domain.CreateOrderResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("razorpay: failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.razorpay.com/v1/orders", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("razorpay: failed to create request: %w", err)
	}
	httpReq.SetBasicAuth(s.cfg.RazorpayKeyID, s.cfg.RazorpayKeySecret)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("razorpay: order API call failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("razorpay: failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("razorpay: order API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var order domain.CreateOrderResponse
	if err := json.Unmarshal(respBody, &order); err != nil {
		return nil, fmt.Errorf("razorpay: failed to unmarshal response: %w", err)
	}

	return &order, nil
}

func (s *RazorpayService) VerifySignature(orderID, paymentID, signature string) bool {
	payload := orderID + "|" + paymentID
	expected := hmacSHA256(payload, s.cfg.RazorpayKeySecret)
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (s *RazorpayService) VerifyWebhookSignature(payload []byte, signature, timestamp string) bool {
	if signature == "" || timestamp == "" {
		return false
	}

	payloadStr := fmt.Sprintf("%s.%s", timestamp, string(payload))

	mac := hmac.New(sha256.New, []byte(s.webhookSecret))
	mac.Write([]byte(payloadStr))
	expected := mac.Sum(nil)

	decoded, err := base64.StdEncoding.DecodeString(signature)
	if err != nil {
		return false
	}

	return hmac.Equal(expected, decoded)
}

func (s *RazorpayService) ProcessRefund(ctx context.Context, paymentID string, amount int64) (string, error) {
	payload := fmt.Sprintf(`{"amount":%d}`, amount)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("https://api.razorpay.com/v1/payments/%s/refund", paymentID),
		strings.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("razorpay: failed to create refund request: %w", err)
	}
	httpReq.SetBasicAuth(s.cfg.RazorpayKeyID, s.cfg.RazorpayKeySecret)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("razorpay: refund API call failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("razorpay: failed to read refund response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("razorpay: refund API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("razorpay: failed to unmarshal refund response: %w", err)
	}

	return result.ID, nil
}

func hmacSHA256(payload, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}
