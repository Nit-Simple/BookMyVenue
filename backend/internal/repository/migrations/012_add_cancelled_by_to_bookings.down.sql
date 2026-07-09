DROP INDEX IF EXISTS idx_bookings_cancelled_by;

ALTER TABLE bookings
DROP COLUMN IF EXISTS cancelled_by;
