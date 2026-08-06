CREATE TABLE IF NOT EXISTS refresh_token_history (
    session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash text NOT NULL PRIMARY KEY,
    used_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_token_history_session ON refresh_token_history (session_id);
