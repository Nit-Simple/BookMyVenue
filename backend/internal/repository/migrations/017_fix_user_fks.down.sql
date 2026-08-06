ALTER TABLE venue_application DROP CONSTRAINT IF EXISTS venue_application_owner_id_fkey;
ALTER TABLE venue DROP CONSTRAINT IF EXISTS venue_owner_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
