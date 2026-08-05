-- Bookings must start strictly in the future; remove the previous 1-hour grace
-- period allowed by the original `future_booking` CHECK (migration 006).
ALTER TABLE bookings DROP CONSTRAINT future_booking;
ALTER TABLE bookings ADD CONSTRAINT future_booking CHECK (start_time > NOW());
