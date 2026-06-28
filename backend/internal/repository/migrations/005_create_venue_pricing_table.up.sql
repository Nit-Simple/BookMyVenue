CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE venue_pricing (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id    uuid NOT NULL REFERENCES venue(venue_id) ON DELETE CASCADE,
    price_per_hour  numeric(10,2) NOT NULL,
    is_weekend  bool NOT NULL,
    currency    char(3) NOT NULL DEFAULT 'INR',
    is_active   bool NOT NULL DEFAULT true,
    start_date  date NOT NULL,
    end_date    date,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT no_overlapping_active_pricing EXCLUDE USING GIST (
        venue_id    WITH =,
        is_weekend  WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (is_active = true)
);

CREATE INDEX idx_venue_pricing_lookup
    ON venue_pricing(venue_id, is_weekend, is_active)
    WHERE is_active = true;
