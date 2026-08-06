package domain

type WebhookEvent struct {
	Entity    string   `json:"entity"` // "event"
	AccountID string   `json:"account_id"`
	Event     string   `json:"event"`    // "payment.captured", "payment.failed"
	Contains  []string `json:"contains"` // ["payment"]
	Payload   struct {
		Payment PaymentWebhookEntity `json:"payment"`
	} `json:"payload"`
	CreatedAt int64 `json:"created_at"`
}

type PaymentWebhookEntity struct {
	ID          string `json:"id"`           // pay_xxxxxxxx
	Entity      string `json:"entity"`       // "payment"
	Amount      int64  `json:"amount"`       // In paise
	Currency    string `json:"currency"`     // "INR"
	Status      string `json:"status"`       // "captured", "failed"
	OrderID     string `json:"order_id"`     // order_xxxxxxxx
	Method      string `json:"method"`       // "upi", "card", "netbanking"
	VPA         string `json:"vpa"`          // UPI ID (if UPI)
	CardLast4   string `json:"card_last_4"`  // if card
	CardNetwork string `json:"card_network"` // "Visa", "Mastercard"
	Bank        string `json:"bank"`         // if netbanking
	Wallet      string `json:"wallet"`       // if wallet
	Email       string `json:"email"`
	Contact     string `json:"contact"`
	Notes       struct {
		BookingID string `json:"booking_id"`
	} `json:"notes"`
	ErrorCode        string `json:"error_code"`        // "BAD_CREDENTIALS", etc. (on payment.failed)
	ErrorDescription string `json:"error_description"` // human-readable failure reason
	ErrorSource      string `json:"error_source"`
	ErrorStep        string `json:"error_step"`
	ErrorReason      string `json:"error_reason"`
	CreatedAt        int64  `json:"created_at"`
}

// WebhookHeaders contains the headers from the webhook request
type WebhookHeaders struct {
	Signature string // X-Razorpay-Signature
	Timestamp string // X-Razorpay-Webhook-Timestamp
}

type CreateOrderRequest struct {
	Amount   int64             `json:"amount"`   // In paise
	Currency string            `json:"currency"` // "INR"
	Receipt  string            `json:"receipt"`  // Your booking reference
	Notes    map[string]string `json:"notes"`    // booking_id etc.
}

// RazorpayPayment is the subset of a Razorpay payment object we read back via
// the payments fetch API so we can sync capture state locally.
type RazorpayPayment struct {
	ID      string `json:"id"`      // pay_xxxxxxxx
	Status  string `json:"status"`  // "created" | "authorized" | "captured" | "attempted" | "failed"
	OrderID string `json:"order_id"`
	Amount  int64  `json:"amount"`  // In paise
}

type CreateOrderResponse struct {
	ID         string `json:"id"`     // order_xxxxxxxx
	Entity     string `json:"entity"` // "order"
	Amount     int64  `json:"amount"`
	AmountPaid int64  `json:"amount_paid"`
	AmountDue  int64  `json:"amount_due"`
	Currency   string `json:"currency"`
	Receipt    string `json:"receipt"`
	Status     string `json:"status"` // "created", "paid", "attempted"
	Notes      struct {
		BookingID string `json:"booking_id"`
	} `json:"notes"`
	CreatedAt int64 `json:"created_at"`
}
