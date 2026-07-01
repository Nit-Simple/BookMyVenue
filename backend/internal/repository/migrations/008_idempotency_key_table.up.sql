CREATE TYPE idempotency_status AS ENUM('PENDING','FAILED','COMPLETE');

CREATE TABLE idempotency_keys (
    key             TEXT PRIMARY KEY,
    payment_id      UUID REFERENCES payments(id),
    request_hash    TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    status         idempotency_status NOT NULL DEFAULT 'PENDING'
);


CREATE INDEX idx_idempotency_key  ON idempotency_keys (created_at);
