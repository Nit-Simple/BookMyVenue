-- Fix bookings.user_id FK which previously referenced the non-existent
-- relation `user(user_id)` (reserved word, wrong table, wrong column).
-- Defensive: the constraint may not exist if migration 006 never applied.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE bookings
    ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Enforce venue ownership. RESTRICT: an owner with venues cannot be deleted.
ALTER TABLE venue
    ADD CONSTRAINT venue_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE venue_application
    ADD CONSTRAINT venue_application_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;
