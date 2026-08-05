ALTER TABLE bookings ADD COLUMN expires_at TIMESTAMPTZ;

UPDATE bookings
SET expires_at = created_at + interval '24 hours'
WHERE status = 'PENDING' AND expires_at IS NULL;

CREATE INDEX idx_bookings_pending_expires ON bookings (expires_at)
WHERE status = 'PENDING';
