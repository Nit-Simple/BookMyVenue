ALTER TABLE bookings
ADD COLUMN cancelled_by UUID NULL REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_cancelled_by ON bookings (cancelled_by);
