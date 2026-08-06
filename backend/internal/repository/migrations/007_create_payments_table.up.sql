create type payment_status as enum(
    'PENDING',
    'AUTHORIZED',
    'CAPTURED',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);

create type payment_method as enum(
    'CARD',
    'UPI',
    'NETBANKING',
    'WALLET',
    'EMI',
    'PAY_LATER'
);

CREATE TABLE payments(
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references bookings(id) on delete restrict,
    razorpay_payment_id VARCHAR(50) UNIQUE,
    razorpay_order_id   VARCHAR(50) NOT NULL UNIQUE,
    razorpay_signature  VARCHAR(255),
    amount              INT NOT NULL,              -- 15000 = ₹150.00
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    status              payment_status NOT NULL DEFAULT 'PENDING',
    razorpay_status     VARCHAR(20),
    method              payment_method,
    card_last_4         CHAR(4),
    bank_name           VARCHAR(100),
    vpa                 VARCHAR(100),
    refund_id           VARCHAR(50),
    refund_amount       INT,
    refund_status       VARCHAR(20),
    webhook_payload     JSONB,
    webhook_received_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_amount CHECK (amount > 0),
    CONSTRAINT valid_refund_amount CHECK (refund_amount IS NULL OR refund_amount > 0),


    -- UPI payments MUST have a VPA
    CONSTRAINT payment_upi_vpa_required CHECK (
        method != 'UPI' OR vpa IS NOT NULL
    ),

    -- CARD and EMI payments MUST have last 4 digits
    CONSTRAINT payment_card_last4_required CHECK (
        method NOT IN ('CARD', 'EMI') OR card_last_4 IS NOT NULL
    ),

    -- NETBANKING and EMI payments MUST have a bank name
    CONSTRAINT payment_bank_name_required CHECK (
        method NOT IN ('NETBANKING', 'EMI') OR bank_name IS NOT NULL
    ),

    -- Refund fields: If refund_id is present, refund_amount must be > 0
    CONSTRAINT payment_refund_valid CHECK (
        refund_id IS NULL OR (refund_amount IS NOT NULL AND refund_amount > 0)
    ),

    -- Refund status: Can only be set if refund_id is present
    CONSTRAINT payment_refund_status_valid CHECK (
        refund_status IS NULL OR refund_id IS NOT NULL
    ),

    -- Razorpay payment_id: If status is CAPTURED, payment_id must be present
    CONSTRAINT payment_captured_id_required CHECK (
        status != 'CAPTURED' OR razorpay_payment_id IS NOT NULL
    )
);

CREATE INDEX idx_payments_razorpay_payment_id ON payments (razorpay_payment_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments (razorpay_order_id);
CREATE INDEX idx_payments_pending ON payments (created_at) WHERE status = 'PENDING';
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_status ON payments (status);


CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_coloums();
