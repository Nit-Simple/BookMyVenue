-- Restore the previous 1-hour grace period.
ALTER TABLE bookings DROP CONSTRAINT future_booking;
ALTER TABLE bookings ADD CONSTRAINT future_booking CHECK (start_time > NOW() - INTERVAL '1 hour');
