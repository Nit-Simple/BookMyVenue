CREATE TYPE booking_status AS ENUM(
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);

CREATE TABLE bookings(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id            UUID NOT NULL REFERENCES venue(venue_id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ NOT NULL,
    time_range          TSTZRANGE,
    booking_date        DATE,
    total_amount        NUMERIC(10,2) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'INR',

    -- Status & Lifecycle
    status              booking_status NOT NULL DEFAULT 'PENDING',
    cancellation_reason TEXT NULL,
    cancelled_at        TIMESTAMPTZ NULL,

    -- Human-readable Reference (for customer support)
    booking_reference   VARCHAR(20) UNIQUE NOT NULL,

    -- Business Metadata
    special_requests    TEXT NULL,
    guest_count         INT NOT NULL DEFAULT 1 CHECK (guest_count > 0),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    --Constraints
    CONSTRAINT valid_time CHECK (start_time < end_time),
    CONSTRAINT future_booking CHECK (start_time > NOW() - INTERVAL '1 hour'),
    CONSTRAINT valid_time_range CHECK (time_range = tstzrange(start_time, end_time, '[)')),
    CONSTRAINT no_overlap_bookings
    EXCLUDE USING GIST (
    venue_id WITH =,
    time_range WITH &&
    ) WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'))
);

CREATE OR REPLACE FUNCTION set_booking_computed_fields()
RETURNS trigger AS $$
BEGIN
    NEW.time_range = tstzrange(NEW.start_time, NEW.end_time, '[)');
    NEW.booking_date = NEW.start_time::DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_computed_fields
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_computed_fields();

CREATE INDEX idx_bookings_venue_active_range
ON bookings USING GIST (venue_id, time_range)
WHERE status NOT IN ('CANCELLED', 'NO_SHOW');

CREATE INDEX idx_bookings_user_id ON bookings (user_id);

CREATE INDEX idx_bookings_booking_date ON bookings (booking_date);

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_coloums();
