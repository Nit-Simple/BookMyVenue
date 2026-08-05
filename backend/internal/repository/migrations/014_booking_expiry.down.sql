DROP INDEX IF EXISTS idx_bookings_pending_expires;

ALTER TABLE bookings DROP COLUMN IF EXISTS expires_at;
